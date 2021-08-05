import { Injectable, EventEmitter } from "@angular/core";
import { Router } from "@angular/router";
import { ViewComputingService } from "./viewComputing.service";
import { GameComponent } from "../game/game.component";
import { GameSound, SoundId } from "../game-audio/game-audio.component";
import { GameLauchError, ParameterError } from "../classes/Errors";
import { and, equals } from "../global";

import {
  Difficulty,
  GameDifficulties,
  GameDifficultyConfig,
} from "../Difficulties";
export { Difficulty, GameDifficulties, GameDifficultyConfig };

export enum PickupItemId {
  Hp,
  XpBoost,
  Immunity,
  _LENGTH,
}

export enum GameState {
  Menu, // -default
  InGame,
  Paused,
  EndScreen,
}

export enum TransitionType {
  linear,
  ease,
  ease_in,
  ease_in_out,
}

export enum MovingDirection {
  none,
  up,
  down,
  left,
  right,
}

const V = MovingDirection;

export const texturesContainer: GameTexturesContainer = {
  bg: [
    "game_bg_1.jpg",
    "game_bg_2.jpg",
    "game_bg_3.jpg",
    "game_bg_4.jpg",
    "game_bg_5.jpg",
    "game_bg_6.jpg",
    "game_bg_7.jpg",
    "game_bg_8.jpg",
    "game_bg_9.jpg",
    "game_bg_10.jpg",
    "game_bg_11.jpg",
    "game_bg_12.jpg",
  ],
  ship: [
    "ship_1.png",
    "ship_2.png",
    "ship_3.png",
    "ship_4.png",
    "ship_5.png",
    "ship_6.png",
    "ship_7.png",
  ],
  asteroid: [
    "asteroid_1.png",
    "asteroid_2.png",
    "asteroid_3.png",
    "asteroid_4.png",
    "asteroid_5.png",
    "asteroid_6.png",
    "asteroid_7.png",
    "asteroid_8.png",
    "asteroid_9.png",
    "asteroid_10.png",
  ],
};

@Injectable({
  providedIn: "root",
})
export class GameService {
  static GAME_MODE: GameBuildState = "debug";

  // Game configuration object
  static readonly config: GameConfigObject = {
    ship: {
      immune: true,
      immuneTime: 2000,
      defaultShipTexture: 0,
      defaultBg: 0,
      defaultPosition: {
        x: 150,
        y: 300,
      },
      defaultSize: 50,
    },
    pickupGenerationInterval: 1000,
    endGameDelay: 3000,
    isEndGameDelay: true,
    gameMode: GameService.GAME_MODE,
    popupFade: 300,
    sound: {
      initialVoulmeActive: false,
      initialVolumeValue: 50,
      masterVolume: 0, // Equals to initial volume in constructor
    },
  };

  /** Object with functional intervals ids */
  private readonly _intervals: IntervalsObject = {
    score: null,
    asteroid: null,
    asteroidClear: null,
    distance: null,
    moveUp: null,
    moveDown: null,
    moveLeft: null,
    moveRight: null,
    positionTrack: null,
    pickupGeneration: null,
  };

  private _currentScore = 0;
  private _bestScore = 0;
  /** (ms) */
  private _scoreRate = 100;
  /** If game is stopped */
  private _isStopped = false;
  /** Total removed asteroids */
  private _removedAsteroids = 0;
  /** Total asteroids passed */
  private _totalAsteroids = 0;
  /** Asteroid radius (px) */
  private _r = 40;
  /** Asteroid radius spread (px) */
  private _r_spread = 20;
  /** asteroid speed (px/s) */
  private _s = 450;
  /** Asteroid speed spread (px) */
  private _s_spread = 100;
  /** Ship radius (px) */
  private _R = 30;
  private _shellRadius = 5;
  /** seconds to traverse width and height */
  private _SHIP_X_SPD = 1.5;
  private _SHIP_Y_SPD = 1;
  private _SHELL_X_SPD = 1.25;
  private _shipElement!: HTMLDivElement;
  /** Where is user now */
  private _currentGameState = GameState.Menu;
  /** When game started */
  private _gameStartTimestamp!: number;
  /** When game ended */
  private _gameEndTimestamp!: number;
  /** If to play the end sound */
  private _endSound = true;

  ship!: Ship;
  difficulty: Difficulty = Difficulty.Medium;
  isSoundDisabled = false;
  itemsPicked = 0;
  /** Images base URL */
  readonly imgUrl = "./assets/img/";

  /** Currently used texture index */
  currentTexture: {
    bg: number;
    ship: number;
  } = {
    bg: 0,
    ship: 0,
  };

  shipTexture = this.getTextureUrl(texturesContainer.ship[0]);

  /** All event emitters */
  readonly emitters = {
    currentScore: new EventEmitter<number>(),
    /** Fires when best score happends */
    bestScore: new EventEmitter<number>(),
    /** Fires when gamestate changes */
    currentGameState: new EventEmitter<GameState>(),
    setDifficulty: new EventEmitter<Difficulty>(),
    setBgTexture: new EventEmitter<number>(),
    /** Fires when a new asteroid is generated */
    asteroid: new EventEmitter<Asteroid>(),
    /** Count an asteroid */
    countAsteroid: new EventEmitter<null>(),
    /** Count a deleted (passed) asteroid */
    deleteAsteroid: new EventEmitter<null>(),
    /** Switch to next game background */
    nextBg: new EventEmitter<null>(),
    /** Switch to previous game background */
    prevBg: new EventEmitter<null>(),
    playSound: new EventEmitter<GameSound>(),
    /** Fires when game ends (before stop) */
    endGame: new EventEmitter<null>(),
    /** Creates a new explosion */
    explosion: new EventEmitter<{ pos: Position; duration: number }>(),
    /** Fires regulary with ship position */
    position: new EventEmitter<Position>(),
    /** Fires when hp amount changes */
    hitPoints: new EventEmitter<number>(),
    /** Fires when max hp amount changes */
    maxHitPoints: new EventEmitter<number>(),
    /** Make ship blink (appear and dissapear) for
     * @argument miliseconds */
    shipBlink: new EventEmitter<number>(),
    /** Fires when game is resetted */
    reset: new EventEmitter<null>(),
    gameFieldChange: new EventEmitter<Size>(),
    popup: new EventEmitter<PopupWindow>(),
    /** Fires when sound is being enabled/disabled */
    sound: new EventEmitter<boolean>(),
    itemPicked: new EventEmitter<PickupItem>(),
    pickupGererated: new EventEmitter<PickupItem>(),
  };

  /** Name of current key held by user */
  movingVector: MovingDirection = V.none;

  gameField: Size = {
    width() {
      return parseInt(getComputedStyle(document.body).width);
    },
    height() {
      return parseInt(getComputedStyle(document.body).height);
    },
  };

  shipMoveUp() {
    if (this.movingVector === V.up) return;

    this.movingVector = V.up;

    const { y } = this.ship.pos;
    const endY = 0;
    const seconds = (this._SHIP_Y_SPD * y) / this.gameField.height();

    this.ship.element.style.transition = `all linear ${seconds}s`;
    this.ship.element.style.top = endY + "px";
  }

  shipMoveLeft() {
    if (this.movingVector === V.left) return;
    this.movingVector = V.left;

    const { x } = this.ship.pos;
    const endX = 0;

    const seconds = (this._SHIP_X_SPD * x) / this.gameField.width();

    this.ship.element.style.transition = `all linear ${seconds}s`;
    this.ship.element.style.left = endX + "px";
  }

  shipMoveRight() {
    if (this.movingVector === V.right) return;
    this.movingVector = V.right;

    const { x } = this.ship.pos;
    const endX = this.gameField.width() - this.shipRadius * 2;

    const seconds = (this._SHIP_X_SPD * (this.gameField.width() - x)) / endX;

    this.ship.element.style.transition = `all linear ${seconds}s`;
    this.ship.element.style.left = endX + "px";
  }

  shipMoveDown() {
    if (this.movingVector === V.down) return;
    this.movingVector = V.down;

    const { y } = this.ship.pos;
    const endY = this.gameField.height() - this.shipRadius * 2;

    const seconds = (this._SHIP_Y_SPD * (this.gameField.height() - y)) / endY;

    this.ship.element.style.transition = `all linear ${seconds}s`;
    this.ship.element.style.top = endY + "px";
  }

  /** Listeners (event trackers) */
  readonly track = {
    _self: this,
    keyDown(component: GameComponent) {
      /** self = GameService */
      const self = this._self;

      /** Event Handler */
      return function (this: GameComponent, e: KeyboardEvent) {
        if (
          this.Game._currentGameState === GameState.InGame &&
          this.Game.ship
        ) {
          const key = e.key.toLocaleLowerCase();

          if (equals(key, ["d", "arrowright"])) self.shipMoveRight();
          else if (equals(key, ["a", "arrowleft"])) self.shipMoveLeft();
          else if (equals(key, ["w", "arrowup"])) self.shipMoveUp();
          else if (equals(key, ["s", "arrowdown"])) self.shipMoveDown();
        }
      }.bind(component);
    },

    keyUp(component: GameComponent) {
      const self = this._self;
      return function (this: GameComponent, e: KeyboardEvent) {
        const key = e.key.toLowerCase();
        if (
          this.Game._currentGameState === GameState.InGame &&
          this.Game.ship
        ) {
          const ship = self.ship!;
          if (equals(key, ["d", "arrowright"])) {
            self.movingVector = V.none;
            ship.element.style.left = getComputedStyle(ship.element).left;
          } else if (equals(key, ["a", "arrowleft"])) {
            self.movingVector = V.none;
            ship.element.style.left = getComputedStyle(ship.element).left;
          } else if (equals(key, ["w", "arrowup"])) {
            self.movingVector = V.none;
            ship.element.style.top = getComputedStyle(ship.element).top;
          } else if (equals(key, ["s", "arrowdown"])) {
            self.movingVector = V.none;
            ship.element.style.top = getComputedStyle(ship.element).top;
          }
        }
      }.bind(component);
    },
  };

  constructor(private Router: Router, private View: ViewComputingService) {
    this.emitters.currentGameState.subscribe((state) => {
      this._currentGameState = state;
    });

    this.emitters.countAsteroid.subscribe((NULL) => {
      this._totalAsteroids++;
    });

    this.emitters.deleteAsteroid.subscribe((NULL) => {
      this._removedAsteroids++;
    });

    this.emitters.setDifficulty.subscribe((diff) => {
      this.difficulty = diff;
    });

    this.emitters.setBgTexture.subscribe((index) => {
      this.currentTexture.bg = index;
      document.body.style.backgroundImage = `url(../../assets/img/${
        texturesContainer.bg[this.currentTexture.bg]
      })`;
    });

    this.emitters.reset.subscribe((NULL) => {
      this.emitters.bestScore.emit(0);
      this.emitters.currentScore.emit(0);
      this.emitters.setBgTexture.emit(0);
      this.enableSound();
    });

    this.emitters.itemPicked.subscribe((item) => {
      this.itemsPicked++;
    });

    GameService.config.sound.masterVolume =
      GameService.config.sound.initialVolumeValue;

    if (!GameService.config.sound.initialVoulmeActive) this.disableSound();
  }

  static clearIntervals = function (intervalsObject: any) {
    for (const key of Object.keys(intervalsObject)) {
      if (!intervalsObject[key]) continue;
      clearInterval(intervalsObject[key]);
      intervalsObject[key] = null;
    }
  };

  private _changeGameState(state: GameState) {
    this.emitters.currentGameState.emit(state);
    this._currentGameState = state;
  }

  private _createExplosion(pos: Position, duration: number) {
    this.emitters.explosion.emit({ pos, duration });
  }

  private _generatePickup(): PickupItem {
    const itemId = PickupItemId[this.genRandomInt(0, PickupItemId._LENGTH - 1)];

    const item: PickupItem = {
      type: itemId,
      initialY: this.genRandomInt(-100, this.gameField.height() + 100),
      finalY: this.genRandomInt(-100, this.gameField.height() + 100),
      radius: 30,
      texture: "",
      speed: 2000,
    };

    return item;
  }

  genRandomInt(from: number, to: number): number {
    return Math.round(this.genRandomFloat(from, to));
  }

  genRandomFloat(from: number, to: number): number {
    return Math.random() * (to - from) + from;
  }

  /** Generate a chance and test it */
  generateChance(chance: number): boolean {
    if (chance <= 100 && chance >= 0) {
      return Math.random() <= chance;
    } else throw new ParameterError(chance.toString());
  }

  private _generateAsteroid(): Asteroid {
    const rotation: RotationZ | null = this.generateChance(75) // 75% chance
      ? {
          degrees: this.genRandomInt(0, 1000),
          transitionSpeed: this.genRandomInt(1000, 6000),
          type: this.genRandomInt(0, 4),
        }
      : null;

    return {
      texture: `asteroid_${this.genRandomInt(1, 10)}.png`,
      /** Render height (right offscreen) */
      initialY: this.genRandomFloat(
        -100,
        this.View.availHeight + 100 + this._r
      ),
      /** End height (left offscreen) */
      finalY: this.genRandomFloat(-100, this.View.availHeight + 100 + this._r),
      /** Radius from _r to _r + random(0 to _spread) px */
      radius: this.genRandomFloat(this._r, this._r + this._r_spread),
      /** px/s  450 - 550*/
      velocity: this.genRandomFloat(this._s, this._s_spread + this._s),
      rotation,
    };
  }

  /** Completely stop & move to end screen */
  private _stop() {
    if (this._currentScore > this._bestScore) {
      this._bestScore = this._currentScore;
      this._currentScore = 0;
      this._isStopped = false;

      this.emitters.bestScore.emit(this._bestScore);
    }
    this._autosave();

    this._scoreRate = 100;
    this._currentScore = 0;
    this._gameEndTimestamp = Date.now();
    // this.ship!.hp = GameService.config.ship.defaultHp;
    // this.ship!.maxHp = GameService.config.ship.defaultMaxHp;

    this._endSound && this.playSound("break");
    this.navTo(GameState.EndScreen);
  }

  /** When ship collides into asteroid */
  private _shipCollision(pos: Position) {
    const ship = this.ship!;

    ship.hp--;
    ship.immune = true;
    this.emitters.hitPoints.emit(ship.hp);

    if (ship.hp > 0) {
      this._createExplosion(pos, 500);

      this.emitters.shipBlink.emit(GameService.config.ship.immuneTime);
      setTimeout(() => {
        ship.immune = false;
      }, GameService.config.ship.immuneTime);
    } else {
      this._createExplosion(pos, 1500);
      this.endGame(
        GameService.config.isEndGameDelay
          ? GameService.config.endGameDelay
          : null
      );
    }
  }

  get passedAsteroidsCount(): number {
    return this._removedAsteroids;
  }

  get totalAsteroidsCount(): number {
    return this._totalAsteroids;
  }

  get ingameTime(): number {
    return +(
      (this._gameEndTimestamp - this._gameStartTimestamp) /
      1000
    ).toFixed(0);
  }

  get shipRadius(): number {
    return this._R;
  }

  getConfig(): GameConfigObject {
    const CONFIG = GameService.config;
    Object.seal(CONFIG);

    return CONFIG;
  }

  launch(difficulty?: GameDifficultyConfig) {
    if (this._isStopped) throw new GameLauchError("Game is stopped");

    GameService.clearIntervals(this._intervals);
    this._changeGameState(GameState.InGame);

    this._isStopped = false;
    this._gameStartTimestamp = Date.now();

    this.playSound("launch");

    const CONF = GameService.config;

    if (difficulty)
      this.ship = {
        element: this._shipElement,
        hp: difficulty.hp.initial,
        maxHp: difficulty.hp.max,
        ammo: difficulty.ammo.initial,
        maxAmmo: difficulty.ammo.max,
        immune: CONF.ship.immune,
        size: CONF.ship.defaultSize,
        pos: {
          x: GameService.config.ship.defaultPosition.x,
          y: this.View.availHeight / 2 - this._R,
        },
      };
    else {
      const local = GameDifficulties.get(this.difficulty)!;

      this.ship = {
        element: this._shipElement,
        hp: local.hp.initial,
        maxHp: local.hp.max,
        ammo: local.ammo.initial,
        maxAmmo: local.ammo.max,
        immune: CONF.ship.immune,
        size: CONF.ship.defaultSize,
        pos: {
          x: GameService.config.ship.defaultPosition.x,
          y: this.View.availHeight / 2 - this._R,
        },
      };
    }

    const s = this.ship;

    s.element.style.width = this.ship.size + "px";
    s.element.style.height = this.ship.size + "px";
    this._R = this.ship.size;

    s.element.querySelector<HTMLDivElement>(
      ".texture"
    )!.style.backgroundImage = `url(${this.shipTexture})`;

    // Asteroid generation
    this._intervals.asteroid = setInterval(
      () => {
        this.emitters.asteroid.emit(this._generateAsteroid());
      },
      difficulty
        ? difficulty.asteroidGenRate
        : GameDifficulties.get(this.difficulty)!.asteroidGenRate
    );

    // X - Y position tracking for all entities
    this._intervals.positionTrack = setInterval(() => {
      const entities = document.getElementsByClassName("entity");

      for (let i = 0; i < entities.length; i++) {
        if (entities[i].id === "ship") {
          // Update ship position
          const { x, y } = entities[i].getBoundingClientRect();
          s.pos.x = Math.round(x);
          s.pos.y = Math.round(y);
        } else if (entities[i].classList.contains("asteroid")) {
          // Check for asteroid collision
          if (
            and(
              !this.ship.immune,
              !this._isStopped,
              this._r + this._R >
                this.View.distanceBetween(entities[i], this.ship.element)
            )
          )
            this._shipCollision({
              y: this.ship!.pos.y - this._R / 2,
              x: this.ship!.pos.x - this._R / 2,
            });
        } else if (entities[i].classList.contains("pickup")) {
        }
      }

      this.emitters.position.emit(s.pos);
    }, 1000 / 60 /* 60 tps */);

    this._intervals.score = setInterval(() => {
      this._currentScore++;
      this.emitters.currentScore.emit(this._currentScore);
      if (this._currentScore % 100 === 0) this.playSound("notification");
    }, this._scoreRate);

    this._intervals.asteroidClear = setInterval(() => {
      try {
        const asteroids = document.getElementsByClassName("asteroid");

        const len = asteroids.length;
        for (let i = 0; i < len; i++)
          if (asteroids[i] && asteroids[i].getBoundingClientRect().left <= 0)
            asteroids[i].remove();
      } catch (err: unknown) {
        console.log("Asteroid error: ", err);
      }
    }, 1000);

    this._intervals.pickupGeneration = setInterval(() => {
      const item = this._generatePickup();
      this.emitters.pickupGererated.emit(item);
    }, CONF.pickupGenerationInterval);
  }

  /** Stop all entities and nav to end screen
   * @param timeout delay (miliseconds)
   */
  endGame(timeout?: number | null) {
    if (timeout && timeout < 0) timeout = 3000;
    else if (timeout === null) timeout = 0;

    this.emitters.endGame.emit(null);
    GameService.clearIntervals(this._intervals);

    const shipElement = this.ship!.element;
    const { x, y } = this.ship!.pos;
    shipElement.style.top = y + "px";
    shipElement.style.left = x + "px";

    this._isStopped = true;

    if (timeout) setTimeout(() => this._stop(), timeout);
    else this._stop();
  }

  /** Restart (from end screen) */
  restart() {
    this._isStopped = false;
    GameService.clearIntervals(this._intervals);

    this.navTo(GameState.Menu);
    this.navTo(GameState.InGame);
  }

  pause() {
    this._changeGameState(GameState.Paused);
  }

  continue() {}

  /** Save data to LocalStorage */
  save(score: number) {
    localStorage.removeItem("best-score");
    localStorage.setItem("best-score", score.toString());
  }

  private _autosave() {
    this.save(this._bestScore);
  }

  setShipElement(element: HTMLDivElement) {
    this._shipElement = element;
  }

  setShipTexture(index: number) {
    if (index < 0 || index > texturesContainer.ship.length - 1)
      throw new ParameterError("Wrong index", index);
    this.currentTexture.ship = index;
    this.shipTexture = this.getTextureUrl(texturesContainer.ship[index]);
  }

  /** Navigate to game state */
  navTo(state: GameState) {
    if (this._currentGameState !== state) {
      this._changeGameState(state);
      switch (state) {
        case GameState.Menu:
          this.Router.navigate(["/menu"]);
          break;
        case GameState.InGame:
          this.Router.navigate(["/game"]);
          break;
        case GameState.EndScreen:
          this.Router.navigate(["/end-screen"]);
          break;
      }
    }
  }

  shoot(from: Position, to: Position) {
    const particle = <HTMLDivElement>document.createElement("div");
  }

  toggleFullscreen() {
    if (!document.fullscreenEnabled) return alert("Fullscreen not allowed");
    if (
      document.fullscreenElement ||
      (screen.availHeight === window.innerHeight &&
        screen.availWidth === window.innerWidth)
    )
      document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }

  getTextureUrl(src: string): string {
    return this.imgUrl + src;
  }

  getSoundUrl(src: string): string {
    return `./assets/sounds/${src}`;
  }

  playSound(id: SoundId, volume = GameService.config.sound.masterVolume) {
    if (GameService.config.sound.masterVolume && !this.isSoundDisabled)
      this.emitters.playSound.emit({ id, volume });
  }

  nextBg() {
    this.emitters.nextBg.emit(null);
  }

  prevBg() {
    this.emitters.prevBg.emit(null);
  }

  disableSound() {
    this.isSoundDisabled = true;
    this.emitters.sound.emit(false);
  }

  enableSound() {
    this.isSoundDisabled = false;
    this.emitters.sound.emit(true);
  }

  createPopup(popup: PopupWindow) {
    this.emitters.popup.emit(popup);
  }

  setVolume(value: number) {
    if (value < 0) value = 0;
    else if (value > 100) value = 100;

    GameService.config.sound.masterVolume = value;
  }
}

export type GameBuildState = "debug" | "release";

export interface GameTexturesContainer {
  bg: string[];
  ship: string[];
  asteroid: string[];
}

export interface Position {
  x: number;
  y: number;
}

export interface Ship {
  element: HTMLDivElement;
  pos: Position;
  hp: number;
  maxHp: number;
  ammo: number;
  maxAmmo: number;
  immune: boolean;
  size: number;
}

export interface Asteroid {
  texture: string;
  radius: number;
  velocity: number;
  initialY: number;
  finalY: number;
  rotation: RotationZ | null;
}

export interface PickupItem {
  texture: string;
  radius: number;
  speed: number;
  initialY: number;
  finalY: number;
  type: string;
}

export interface RotationZ {
  /** @type deg */
  degrees: number;
  /** @type miliseconds */
  transitionSpeed: number;
  /** ease, ease-in, ease-in-out, linear */
  type: TransitionType;
}

export interface ShipConfig {
  element: HTMLDivElement;
  pos: Position;
  texture?: string;
  radius?: number;
  speed?: number;
}

export interface BasicMovement {
  direction: "up" | "down" | "left" | "right";
  from: number;
  to: number;
}

export interface IntervalsObject {
  score: Interval;
  asteroid: Interval;
  asteroidClear: Interval;
  distance: Interval;
  moveUp: Interval;
  moveDown: Interval;
  moveLeft: Interval;
  moveRight: Interval;
  positionTrack: Interval;
  pickupGeneration: Interval;
}

export interface Size {
  width(): number;
  height(): number;
}

export interface PopupWindow {
  text: string;
  duration: number;
}

export type Timer = any;
export type Interval = any;

export interface GameConfigObject {
  ship: {
    immune: boolean;
    immuneTime: number;
    defaultShipTexture: number;
    defaultBg: number;
    defaultPosition: Position;
    defaultSize: number;
  };
  isEndGameDelay: boolean;
  endGameDelay: number;
  gameMode: GameBuildState;
  popupFade: number;
  pickupGenerationInterval: number;
  sound: {
    masterVolume: number;
    initialVoulmeActive: boolean;
    initialVolumeValue: number;
  };
}
