import { Injectable, EventEmitter } from "@angular/core";
import { Router } from "@angular/router";
import { ViewComputingService } from "./viewComputing.service";
import { GameComponent } from "../game/game.component";
import { GameSound, SoundId } from "../game-audio/game-audio.component";
import {
  EnvironmentError,
  GameLauchError,
  ParameterError,
} from "../classes/Errors";
import {
  and,
  equals,
  genRandomFloat,
  genRandomInt,
  or,
  strToBool,
  pickRandom,
  generateChance,
  getFromMapChance,
} from "../global";

import $ from "jquery";

import {
  Difficulty,
  GameDifficulties,
  GameDifficultyConfig,
} from "../Difficulties";
export { Difficulty, GameDifficulties, GameDifficultyConfig };

export enum PickupItemId {
  Hp,
  MaxHp,
  XpBoost,
  Immunity,
  Ammo,
  MaxAmmo,
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

const GAME_SAVE_KEYS = new Map<string, StringConvertor>([
  ["best-score", Number],
  ["volume", Number],
  ["sound-is-active", strToBool],
  ["ship", Number],
  ["background", Number],
  ["difficulty", Number],
  ["debug-mode", strToBool],
]);

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
  pickups: new Map<PickupItemType, string>([
    ["Hp", "pill.png"],
    ["Immunity", "slienld.png"],
    ["Ammo", "bullet.png"],
    ["XpBoost", "plus.png"],
    ["MaxAmmo", "ammo.png"],
    ["MaxHp", "heart.png"],
  ]),
};

@Injectable({
  providedIn: "root",
})
export class GameService {
  static GAME_MODE: GameBuildState = "release";

  // Game configuration object
  static readonly config: GameConfigObject = {
    ship: {
      immune: false,
      immuneTime: 2000,
      defaultShipTexture: 0,
      defaultBg: 0,
      defaultPosition: {
        x: 50,
        y: 300,
      },
      defaultSize: 50,
      pickupRadius: 100,
    },
    endGameDelay: 3000,
    isEndGameDelay: true,
    gameMode: GameService.GAME_MODE,
    popupFade: 300,
    sound: {
      initialVoulmeActive: true,
      initialVolumeValue: 50,
      masterVolume: 0, // Equals to initial volume in constructor
    },
  };

  /** Object with functional intervals ids */
  private readonly _intervals: IntervalsObject = {
    score: null,
    asteroid: null,
    positionTrack: null,
    pickupGeneration: null,
  };

  private _currentScore = 0;
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

  // **** Public properties ****

  /** All event emitters */
  readonly emitters = {
    currentScore: new EventEmitter<number>(),
    /** Fires when best score happends */
    bestScore: new EventEmitter<number>(),
    /** Fires when gamestate changes */
    currentGameState: new EventEmitter<GameState>(),
    difficultyChange: new EventEmitter<Difficulty>(),
    setBgTexture: new EventEmitter<number>(),
    ammo: new EventEmitter<number>(),
    maxAmmo: new EventEmitter<number>(),
    /** New asteroid generated */
    asteroid: new EventEmitter<Asteroid>(),
    /** Count an asteroid */
    countAsteroid: new EventEmitter<null>(),
    /** Count a deleted (passed) asteroid */
    deleteAsteroid: new EventEmitter<null>(),
    /** Switch to next game background */
    nextBg: new EventEmitter<null>(),
    /** Switch to previous game background */
    prevBg: new EventEmitter<null>(),
    /** Sound is played */
    playSound: new EventEmitter<GameSound>(),
    /** Game end (before stop) */
    endGame: new EventEmitter<null>(),
    /** Creates a new explosion */
    explosion: new EventEmitter<{ position: Position; duration: number }>(),
    /** Ship position update (interval) */
    position: new EventEmitter<Position>(),
    /** Hp amount change */
    hitPoints: new EventEmitter<number>(),
    /** Max hp amount change */
    maxHitPoints: new EventEmitter<number>(),
    /** Make ship blink (appear and dissapear) for
     * @argument miliseconds */
    shipBlink: new EventEmitter<number>(),
    /** Game is resetted */
    reset: new EventEmitter<null>(),
    /** Window size change */
    gameFieldChange: new EventEmitter<Size>(),
    /** Popup window created */
    popup: new EventEmitter<PopupWindow>(),
    /** Sound is enabled/disabled */
    sound: new EventEmitter<boolean>(),
    /** An item is picked */
    itemPicked: new EventEmitter<null>(),
    /** Pickacble item is generated */
    pickupGererated: new EventEmitter<PickupItem>(),
  };

  /** Images folder base URL */
  readonly IMG_URL = "./assets/img/";

  /** Name of current key held by user */
  ship!: Ship;
  difficulty: Difficulty = Difficulty.Medium;
  difficultyData: GameDifficultyConfig = GameDifficulties.get(this.difficulty)!;
  isSoundDisabled = false;
  itemsPicked = 0;
  shipTexture = this.getTextureUrl(texturesContainer.ship[0]);
  movingVector: MovingDirection = V.none;
  bestScore = 0;

  /** Currently used texture index */
  currentTexture: {
    bg: number;
    ship: number;
  } = {
    bg: 0,
    ship: 0,
  };
  gameField: Size = {
    width() {
      return document.body.offsetWidth;
    },
    height() {
      return document.body.offsetHeight;
    },
  };

  // Public properties ---------------------------------

  shipMoveUp() {
    if (this.movingVector === V.up) return;

    this.movingVector = V.up;

    const { y } = this.ship.pos;
    $(this.ship.element)
      .animate(
        {
          top: "0px",
        },
        {
          easing: "linear",
          duration: ((this._SHIP_Y_SPD * y) / this.gameField.height()) * 1000,
          queue: "up",
        }
      )
      .dequeue("up");
  }

  shipMoveLeft() {
    if (this.movingVector === V.left) return;
    this.movingVector = V.left;

    const { x } = this.ship.pos;
    $(this.ship.element)
      .animate(
        {
          left: "0px",
        },
        {
          easing: "linear",
          duration: ((this._SHIP_X_SPD * x) / this.gameField.width()) * 1000,
          queue: "left",
        }
      )
      .dequeue("left");
  }

  shipMoveRight() {
    if (this.movingVector === V.right) return;
    this.movingVector = V.right;

    const { x } = this.ship.pos;

    $(this.ship.element)
      .animate(
        {
          left: this.gameField.width() - this.ship.size + "px",
        },
        {
          easing: "linear",
          duration:
            ((this._SHIP_X_SPD * (this.gameField.width() - x)) /
              (this.gameField.width() - this.shipRadius * 2)) *
            1000,
          queue: "right",
        }
      )
      .dequeue("right");
  }

  shipMoveDown() {
    if (this.movingVector === V.down) return;
    this.movingVector = V.down;

    const { y } = this.ship.pos;

    $(this.ship.element)
      .animate(
        {
          top: this.gameField.height() - this.ship.size * 2 + "px",
        },
        {
          easing: "linear",
          duration:
            ((this._SHIP_Y_SPD * this.gameField.height() - y) /
              (this.gameField.height() - this.shipRadius * 2)) *
            1000,
          queue: "down",
        }
      )
      .dequeue("down");
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
          const ship = self.ship;

          if (equals(key, ["d", "arrowright"])) {
            self.movingVector = V.none;
            $(ship.element).stop("right");
          } else if (equals(key, ["a", "arrowleft"])) {
            self.movingVector = V.none;
            $(ship.element).stop("left");
          } else if (equals(key, ["w", "arrowup"])) {
            self.movingVector = V.none;
            $(ship.element).stop("up");
          } else if (equals(key, ["s", "arrowdown"])) {
            self.movingVector = V.none;
            $(ship.element).stop("down");
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

    this.emitters.difficultyChange.subscribe((diff) => {
      this.difficulty = diff;
      this.difficultyData = GameDifficulties.get(diff)!;
      this.save("difficulty", diff);
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
      this.setVolume(GameService.config.sound.initialVolumeValue);
    });

    this.emitters.difficultyChange;

    this.emitters.itemPicked.subscribe((NULL) => {
      this.itemsPicked++;
    });

    GameService.config.sound.masterVolume =
      GameService.config.sound.initialVolumeValue;

    if (!GameService.config.sound.initialVoulmeActive) this.disableSound();

    this._loadSavedGameData();
  }

  static clearIntervals(intervalsObject: any) {
    for (const key of Object.keys(intervalsObject)) {
      if (!intervalsObject[key]) continue;
      clearInterval(intervalsObject[key]);
      intervalsObject[key] = null;
    }
  }

  private _changeGameState(state: GameState) {
    this.emitters.currentGameState.emit(state);
    this._currentGameState = state;
  }

  private _createExplosion(position: Position, duration: number) {
    this.emitters.explosion.emit({ position, duration });
  }

  private _generatePickup(): PickupItem {
    const diff = this.difficultyData;

    const itemType = getFromMapChance(diff.pickup.chances);

    const item: PickupItem = {
      type: itemType,
      initialY: genRandomInt(-100, this.gameField.height() + 100),
      finalY: genRandomInt(-100, this.gameField.height() + 100),
      radius: 30,
      texture: "",
      speed: 2000,
    };

    return item;
  }

  private _generateAsteroid(): Asteroid {
    const rotation: RotationZ | null = generateChance(75) // 75% chance
      ? {
          degrees: genRandomInt(0, 1000),
          transitionSpeed: genRandomInt(1000, 6000),
          type: genRandomInt(0, 4),
        }
      : null;

    return {
      texture: `asteroid_${genRandomInt(1, 10)}.png`,
      /** Render height (right offscreen) */
      initialY: genRandomFloat(-100, this.View.availHeight + 100 + this._r),
      /** End height (left offscreen) */
      finalY: genRandomFloat(-100, this.View.availHeight + 100 + this._r),
      /** Radius from _r to _r + random(0 to _spread) px */
      radius: genRandomFloat(this._r, this._r + this._r_spread),
      /** px/s  450 - 550*/
      velocity: genRandomFloat(this._s, this._s_spread + this._s),
      rotation,
    };
  }

  /** Completely stop & move to end screen */
  stop() {
    if (this._currentScore > this.bestScore) {
      this.bestScore = this._currentScore;
      this._currentScore = 0;
      this._isStopped = false;

      this.emitters.bestScore.emit(this.bestScore);
    }
    this._autosave();

    this._scoreRate = 100;
    this._currentScore = 0;
    this._gameEndTimestamp = Date.now();
    GameService.clearIntervals(this._intervals);
    this._isStopped = false;
  }

  /** When ship collides into asteroid */
  private _shipCollision(pos: Position) {
    const ship = this.ship;

    ship.hp--;
    ship.immune = true;
    this.emitters.hitPoints.emit(ship.hp);
    this.playSound(pickRandom<SoundId>("explosion-1", "explosion-2"));

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
    if (!difficulty) difficulty = GameDifficulties.get(this.difficulty)!;

    GameService.clearIntervals(this._intervals);
    this._changeGameState(GameState.InGame);

    this._isStopped = false;
    this.itemsPicked = 0;
    this._totalAsteroids = 0;
    this._gameStartTimestamp = Date.now();
    this._gameEndTimestamp = 0;

    this.playSound("launch");

    const CONF = GameService.config;

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

    const s = this.ship;

    if (GameService.GAME_MODE === "debug") {
      s.element.style.outline = "1px solid #81ecec";
      s.element.style.border = "1px solid #4cd137";
    }

    this._R = this.ship.size / 2;
    $(s.element)
      .css({
        width: this.ship.size,
        height: this.ship.size,
        left: this.ship.pos.x,
        top: this.ship.pos.y,
      })
      .find(".texture")
      .css("background-image", `url(${this.shipTexture})`);

    // Asteroid generation
    this._intervals.asteroid = setInterval(() => {
      this.emitters.asteroid.emit(this._generateAsteroid());
    }, difficulty.asteroidGenRate);

    // X - Y position tracking for all entities
    this._intervals.positionTrack = setInterval(() => {
      const entities = document.getElementsByClassName("entity");

      const len = entities.length;
      for (let i = 0; i < len; i++) {
        const entity = <HTMLDivElement>entities[i];

        if (entity && entity.id === "ship") {
          // Update ship position
          s.pos.x = entity.offsetLeft;
          s.pos.y = entity.offsetTop;
        } else if (entity && entity.classList.contains("asteroid")) {
          // Check for asteroid collision
          if (
            and(
              !this.ship.immune,
              !this._isStopped,
              entity,
              entity.offsetWidth / 2 + this.ship.element.offsetWidth / 2 >
                this.View.distanceBetween(entity, this.ship.element)
            )
          )
            this._shipCollision({
              y: this.ship.pos.y,
              x: this.ship.pos.x,
            });
          else if (and(!this._isStopped, entity, entity.offsetLeft <= 0)) {
            entity.remove();
          }
        } else if (entity && entity.classList.contains("pickup")) {
          if (
            and(
              !this._isStopped,
              entity,
              entity.offsetWidth / 2 + CONF.ship.pickupRadius >
                this.View.distanceBetween(entity, this.ship.element)
            )
          )
            this._pickupItem(entity);
        }
      }

      this.emitters.position.emit(s.pos);
    }, 1000 / 60 /* 60 tps */);

    this._intervals.score = setInterval(() => {
      this._currentScore++;
      this.emitters.currentScore.emit(this._currentScore);
      if (this._currentScore % 100 === 0) this.playSound("notification");
    }, this._scoreRate);

    this._intervals.pickupGeneration = setInterval(() => {
      const item = this._generatePickup();
      this.emitters.pickupGererated.emit(item);
    }, difficulty.pickup.genRate);
  }

  /** Stop all entities and nav to end screen
   * @param timeout delay (miliseconds)
   */
  endGame(timeout?: number | null) {
    if (timeout && timeout < 0) timeout = 3000;
    else if (timeout === null) timeout = 0;

    this.emitters.endGame.emit(null);

    $(this.ship.element).stop();
    
    this._endSound && this.playSound(pickRandom<SoundId>("end-1", "end-2"));
    
    if (timeout) setTimeout(() => this.stop(), timeout);
    else this.stop();
    
    this.navTo(GameState.EndScreen);
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
  private _saveScore(score: number) {
    this.save("best-score", score);
  }

  private _autosave() {
    this._saveScore(this.bestScore);
  }

  save(data: string | any, value?: any) {
    if (!window.localStorage)
      throw new EnvironmentError("Missing localStorage object");

    const storage = window.localStorage;

    if (typeof data === "object" && !value)
      for (const [key, value] of Object.entries(data))
        storage.setItem(key, String(value));
    else if (typeof data === "string") storage.setItem(data, String(value));
    else throw new ParameterError("Wrong parameters", data, value);
  }

  private _loadSavedGameData() {
    if (!window.localStorage)
      throw new EnvironmentError("Missing localStorage object");

    const storage = window.localStorage;

    for (const [key, conversionObject] of GAME_SAVE_KEYS.entries()) {
      const raw = storage.getItem(key);

      if (raw) {
        const parsed = conversionObject(raw);

        switch (key) {
          case "best-score":
            this.emitters.bestScore.emit(parsed);
            this.bestScore = parsed;
            break;
          case "sound-is-active":
            parsed ? this.enableSound() : this.disableSound();
            break;
          case "volume":
            this.setVolume(parsed);
            break;
          case "difficulty":
            this.emitters.difficultyChange.emit(parsed);
            break;
          case "debug-mode":
            GameService.GAME_MODE = parsed ? "debug" : "release";
            break;
        }
      }
    }
  }

  loadSavedData(key: string) {
    if (!window.localStorage)
      throw new EnvironmentError("Missing localStorage object");

    const storage = window.localStorage;

    return storage.getItem(key);
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

  private _pickupItem(item: HTMLDivElement) {
    const type = <PickupItemType>item.dataset.type;
    item.remove();

    this.emitters.itemPicked.emit();
    this.playSound(pickRandom<SoundId>("item-pick-1", "item-pick-2"));

    const ship = this.ship;
    const diff = this.difficultyData;

    // console.log(type);
    switch (type) {
      case "Hp":
        if (ship.hp < ship.maxHp) this.emitters.hitPoints.emit(++ship.hp);
        break;
      case "MaxHp":
        if (ship.maxHp < diff.hp.maxAllowed)
          this.emitters.maxHitPoints.emit(++ship.maxHp);
        break;
    }
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

  reload(force = false) {
    if (!location) throw new EnvironmentError(location);

    if (!force) this._autosave();
    setTimeout(location.reload);
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
    return this.IMG_URL + src;
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
    this.save("volume", value);
  }

  isDebug() {
    return GameService.isDebug();
  }

  static isDebug() {
    return GameService.GAME_MODE === "debug";
  }
}

export type GameBuildState = "debug" | "release";

export interface GameTexturesContainer {
  bg: string[];
  ship: string[];
  asteroid: string[];
  pickups: Map<PickupItemType, string>;
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
  type: PickupItemType;
}

export type PickupItemType =
  | "Hp"
  | "MaxHp"
  | "XpBoost"
  | "Immunity"
  | "Ammo"
  | "MaxAmmo";

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

export type StringConvertor = (str: string) => any;

export interface GameConfigObject {
  ship: {
    immune: boolean;
    immuneTime: number;
    defaultShipTexture: number;
    defaultBg: number;
    defaultPosition: Position;
    defaultSize: number;
    pickupRadius: number;
  };
  isEndGameDelay: boolean;
  endGameDelay: number;
  gameMode: GameBuildState;
  popupFade: number;
  sound: {
    masterVolume: number;
    initialVoulmeActive: boolean;
    initialVolumeValue: number;
  };
}

export type Component = any;
