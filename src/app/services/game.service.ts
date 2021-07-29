import { Injectable, EventEmitter } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ViewComputingService } from "./viewComputing.service";
import { GameComponent } from "../game/game.component";
import { GameSound, SoundId } from "../game-audio/game-audio.component";
import { GameLauchError } from "../classes/Errors";

@Injectable({
  providedIn: "root",
})
export class GameService {
  // Game configuration object
  private readonly config: GameConfigObject = {
    ship: {
      immune: false,
      defaultHp: 3,
      defaultMaxHp: 3,
      testHp: 1,
      testMaxHp: 1,
      challengingHp: 1,
      challengingMaxHp: 1,
      immuneTime: 2000,
      defaultShipTexture: 0,
      defaultBg: 0
    },
    endGameDelay: 3000,
    isEndGameDelay: true,
    sound: {
      initialVoulmeActive: false,
      initialVolumeValue: 50,
      masterVolume: 0, // Equals to initial volume in constructor
    },
  };

  /** Object with functional intervals ids */
  private readonly _intervals: any = {
    score: null,
    asteroid: null,
    asteroidClear: null,
    distance: null,
    keyDown: null,
  };

  private _rangeCalcTimerId: any = null;
  private _currentScore = 0;
  private _bestScore = 0;
  /** Astroid generation rate */
  private _genRate = 1;
  /** (ms) */
  private _scoreRate = 100;
  /** If game is stopped */
  private _isStopped = false;
  /** Total removed asteroids */
  private _removedAsteroids = 0;
  /** Total asteroids passed */
  private _totalAsteroids = 0;
  /** Name of current key held by user */
  private _currentKeyHeld: string | null = null;
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
  /** (px/tick) */
  private _shipSpeed = 20;
  private _shipTextureElement!: HTMLDivElement;
  private _shipTransitionDuration!: string;
  /** Where is user now */
  private _currentGameState = GameService.GameState.Menu;
  /** When game started */
  private _gameStartTimestamp!: number;
  /** When game ended */
  private _gameEndTimestamp!: number;
  /** If to play the end sound */
  private _endSound = true;

  readonly textures: GameTexturesContainer = {
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

  ship: MovingShip | null = null;
  difficulty: GameService.Difficulty = GameService.Difficulty.Medium;
  isSoundDisabled = false;
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

  /** All event emitters */
  readonly emitters = {
    currentScore: new EventEmitter<number>(),
    /** Fires when best score happends */
    bestScore: new EventEmitter<number>(),
    /** Fires when gamestate changes */
    currentGameState: new EventEmitter<GameService.GameState>(),
    setDifficulty: new EventEmitter<GameService.Difficulty>(),
    setShipTexture: new EventEmitter<number>(),
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
    /** Fires when ship moves from a position to another */
    shipMove: new EventEmitter<BasicMovement>(),
    /** Fires when hp amount changes */
    hitPoints: new EventEmitter<number>(),
    /** Fires when max hp amount changes */
    maxHitPoints: new EventEmitter<number>(),
    /** Make ship blink (appear and dissapear) for
     * @argument miliseconds */
    shipBlink: new EventEmitter<number>(),
    /** Fires when game is resetted */
    reset: new EventEmitter<null>(),
  };

  /** Setters */
  readonly set = {
    _self: this,

    asteroidRadius(r: number, spread?: number) {
      if (r > 0 && r < this._self.View.availHeight / 8) this._self._r = r * 2;
      if (spread && spread >= 0) this._self._r_spread = spread;

      return this;
    },

    asteroidSpeed(s: number, spread?: number) {
      if (s > 0) this._self._s = s;
      if (spread && spread >= 0) this._self._s_spread = spread;

      return this;
    },

    shipRadius(r: number) {
      if (r > 0) this._self._R = r * 2;

      return this;
    },

    _shipTexture(texture: string) {
      let currentTexture = 0;

      this._self.textures.ship.forEach((str) => {
        if (str === texture) {
          this._self.currentTexture.ship = currentTexture;
          this._self._shipTextureElement.style.backgroundImage = `url(../../../../assets/img/${texture})`;
          return;
        } else currentTexture++;
      });

      return this;
    },

    shipSpeed(speed: number) {
      if (speed > 0) this._self._shipSpeed = speed;

      return this;
    },

    shipHitPoints(value: number) {
      if (value > 0) this._self.ship!.hp = value;

      return this;
    },

    shipMaxHitPoints(value: number) {
      if (value > 0) this._self.ship!.maxHp = value;
      if (value > this._self.ship!.hp) this._self.ship!.hp = value;

      return this;
    },

    shipPosition(pos: Position) {
      this._self.ship!.element.classList.add("no-transition");

      this._self.ship!.element.style.left = pos.x + "px";
      this._self.ship!.element.style.top = pos.y + "px";

      this._self.ship!.pos.x = pos.x;
      this._self.ship!.pos.y = pos.y;

      setTimeout(() => {
        this._self.ship!.element.classList.remove("no-transition");
        this._self.ship!.element.style.transitionDuration =
          this._self._shipTransitionDuration;
      });

      return this;
    },

    ship(ship: ShipConfig) {
      ship.speed && this.shipSpeed(ship.speed);

      const R = ship.radius || this._self._R;
      const shipSpeed = this._self._shipSpeed;
      const self = this._self;

      self.ship = {
        element: ship.element,
        hp: 3,
        maxHp: 3,
        immune: false,
        pos: {
          x: ship.pos.x,
          y: ship.pos.y,
        },
        movingSpeed: shipSpeed,

        moveDown() {
          const currentPos = parseInt(getComputedStyle(this.element).top);
          const nextPos = currentPos + this.movingSpeed;

          if (nextPos < self.View.availHeight - R * 2) {
            this.pos.y = nextPos;
            this.element.style.top = nextPos + "px";
          } else {
            this.pos.y = self.View.availHeight - R * 2;
            this.element.style.top = self.View.availHeight - R * 2 + "px";
          }

          self.emitters.shipMove.emit({
            direction: "down",
            from: currentPos,
            to: nextPos,
          });
        },

        moveUp() {
          const currentPos = parseInt(getComputedStyle(this.element).top);
          const nextPos = currentPos - this.movingSpeed;

          if (nextPos > 0) {
            this.pos.y = nextPos;
            this.element.style.top = nextPos + "px";
          } else {
            this.pos.y = 0;
            this.element.style.top = "0px";
          }

          self.emitters.shipMove.emit({
            direction: "up",
            from: currentPos,
            to: nextPos,
          });
        },

        moveLeft() {
          const currentPos = parseInt(getComputedStyle(this.element).left);
          const nextPos = currentPos - this.movingSpeed;

          if (nextPos > 0) {
            this.pos.x = nextPos;
            this.element.style.left = nextPos + "px";
          } else {
            this.pos.x = 0;
            this.element.style.left = 0 + "px";
          }

          self.emitters.shipMove.emit({
            direction: "left",
            from: currentPos,
            to: nextPos,
          });
        },

        moveRight() {
          const currentPos = parseInt(getComputedStyle(this.element).left);
          const nextPos = currentPos + this.movingSpeed;

          if (nextPos < self.View.availWidth - self._R * 2) {
            this.pos.x = nextPos;
            this.element.style.left = nextPos + "px";
          } else {
            this.pos.x = self.View.availWidth - self._R * 2;
            this.element.style.left = self.View.availWidth - self._R * 2 + "px";
          }

          self.emitters.shipMove.emit({
            direction: "right",
            from: currentPos,
            to: nextPos,
          });
        },
      };

      self._shipTextureElement = <HTMLDivElement>(
        ship.element.querySelector(".texture")
      );

      ship.radius && this.shipRadius(ship.radius);
      ship.texture && this._shipTexture(ship.texture);

      self.ship!.element.style.width = self._R * 2 + "px";
      self.ship!.element.style.height = self._R * 2 + "px";

      self._shipTransitionDuration = getComputedStyle(
        ship.element
      ).transitionDuration;

      this._shipTexture(self.textures.ship[self.currentTexture.ship]);

      return this;
    },

    masterVolume(value: number) {
      if (value >= 0 && value <= 100) {
        this._self.config.sound.masterVolume = value;
      }
    },
  };

  /** Listeners */
  readonly track = {
    _self: this,
    keyDown(component: GameComponent) {
      const self = this._self;
      return function (this: GameComponent, e: KeyboardEvent) {
        if (
          this.Game._currentGameState === GameService.GameState.InGame &&
          this.Game.ship &&
          self._currentKeyHeld !== e.key.toLowerCase()
        ) {
          clearInterval(self._intervals.keyDown);
          self._currentKeyHeld = e.key.toLowerCase();

          if (
            self._currentKeyHeld === "w" ||
            self._currentKeyHeld === "arrowup"
          )
            self._intervals.keyDown = setInterval(() => {
              self.ship!.moveUp();
            }, 25);
          else if (
            self._currentKeyHeld === "s" ||
            self._currentKeyHeld === "arrowdown"
          )
            self._intervals.keyDown = setInterval(() => {
              self.ship!.moveDown();
            }, 25);
          else if (
            self._currentKeyHeld === "a" ||
            self._currentKeyHeld === "arrowleft"
          )
            self._intervals.keyDown = setInterval(() => {
              self.ship!.moveLeft();
            }, 25);
          else if (
            self._currentKeyHeld === "d" ||
            self._currentKeyHeld === "arrowright"
          )
            self._intervals.keyDown = setInterval(() => {
              self.ship!.moveRight();
            }, 25);
        }
      }.bind(component);
    },

    keyUp(component: GameComponent) {
      const self = this._self;
      return function (this: GameComponent, e: KeyboardEvent) {
        if (
          this.Game._currentGameState === GameService.GameState.InGame &&
          this.Game.ship &&
          self._currentKeyHeld
        ) {
          self._currentKeyHeld = null;
          clearInterval(self._intervals.keyDown);
        }
      }.bind(component);
    },
  };

  constructor(
    private Router: Router,
    private Route: ActivatedRoute,
    private View: ViewComputingService
  ) {
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

    this.emitters.setShipTexture.subscribe((index) => {
      this.currentTexture.ship = index;
    });

    this.emitters.setBgTexture.subscribe((index) => {
      this.currentTexture.bg = index;
      document.body.style.backgroundImage = `url(../../assets/img/${
        this.textures.bg[this.currentTexture.bg]
      })`;
    });

    this.emitters.reset.subscribe((NULL) => {
      this.emitters.bestScore.emit(0);
      this.emitters.currentScore.emit(0);
      this.emitters.setBgTexture.emit(0);
    });

    this.config.sound.masterVolume = this.config.sound.initialVolumeValue;

    if (!this.config.sound.initialVoulmeActive) this.disableSound();
  }

  static clearIntervals = function (intervalsObject: any) {
    for (const key of Object.keys(intervalsObject)) {
      if (!intervalsObject[key]) continue;
      clearInterval(intervalsObject[key]);
      intervalsObject[key] = null;
    }
  };

  private _changeGameState(state: GameService.GameState) {
    this.emitters.currentGameState.emit(state);
    this._currentGameState = state;
  }

  private _createExplosion(pos: Position, duration: number) {
    this.emitters.explosion.emit({ pos, duration });
  }

  private _generatePickup(): PickupItem | void {
    const itemId = +(
      Math.random() *
      (GameService.PickupItemId._LENGTH - 1)
    ).toFixed(0);

    const data = this._generateAsteroid();
    data.texture = "";
  }

  private _generateAsteroid(): Asteroid {
    const rotation: RotationZ | null =
      Math.random() <= 0.75 // 75% chance
        ? {
            degrees:
              +(Math.random() * 100).toFixed(0) +
              +(Math.random() * 900).toFixed(0), // 0-100 + 0-900 (0-1000)
            transitionSpeed:
              +(Math.random() * 3000).toFixed(0) +
              +(Math.random() * 3000).toFixed(0), // 0-3000 + 0-3000 (0-6000)
            type: +(Math.random() * 4).toFixed(0),
          }
        : null;

    return {
      texture: `asteroid_${+(Math.random() * 9 + 1).toFixed(0)}.png`,
      /** Render height (right offscreen) */
      initialY: +(Math.random() * (this.View.availHeight + this._r)).toFixed(0),
      /** End height (left offscreen) */
      finalY: +(Math.random() * (this.View.availHeight + this._r)).toFixed(0),
      /** Radius from _r to _r + random(0 to _spread) px */
      radius: +(Math.random() * this._r_spread + this._r).toFixed(0),
      /** px/s  450 - 550*/
      velocity: +(Math.random() * this._s_spread + this._s).toFixed(0),
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

    this._genRate = 1;
    this._scoreRate = 100;
    this._currentScore = 0;
    this._gameEndTimestamp = Date.now();
    this.ship!.hp = this.config.ship.defaultHp;
    this.ship!.maxHp = this.config.ship.defaultMaxHp;

    this._endSound && this.playSound("break");
    this.navTo(GameService.GameState.EndScreen);
  }

  /** When ship collides into asteroid */
  private _shipCollision(pos: Position) {
    const ship = this.ship!;

    ship.hp--;
    ship.immune = true;
    this.emitters.hitPoints.emit(ship.hp);

    if (ship.hp > 0) {
      this._createExplosion(pos, 500);

      this.emitters.shipBlink.emit(this.config.ship.immuneTime);
      setTimeout(() => {
        ship.immune = false;
      }, this.config.ship.immuneTime);
    } else {
      this._createExplosion(pos, 1500);
      this.endGame(
        this.config.isEndGameDelay ? this.config.endGameDelay : null
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
    const CONFIG = this.config;
    Object.seal(CONFIG);

    return CONFIG;
  }

  launch() {
    if (this._isStopped) throw new GameLauchError("Game is stopped");

    const ship = this.ship!;

    this.playSound("launch");
    const difficulty = this.difficulty;

    ship.immune = this.config.ship.immune;
    if (difficulty === GameService.Difficulty.Challenging) {
      ship.hp = this.config.ship.challengingHp;
      ship.maxHp = this.config.ship.challengingMaxHp;
    } else if (difficulty === GameService.Difficulty.Test) {
      ship.hp = this.config.ship.testHp;
      ship.maxHp = this.config.ship.testMaxHp;
    }

    this.emitters.hitPoints.emit(ship.hp);
    this.emitters.maxHitPoints.emit(ship.maxHp);

    this._changeGameState(GameService.GameState.InGame);
    GameService.clearIntervals(this._intervals);
    this._isStopped = false;

    this.difficulty = difficulty;
    this._gameStartTimestamp = Date.now();

    this._intervals.asteroid = setInterval(() => {
      this.emitters.asteroid.emit(this._generateAsteroid());
    }, 3000 / (this._genRate + this.difficulty));

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
          if (asteroids[i].getBoundingClientRect().left <= 0)
            asteroids[i].remove();
      } catch {}
    }, 1000);

    let timer: any;
    this._rangeCalcTimerId = setTimeout(
      (timer = () => {
        const asteroids = document.getElementsByClassName("asteroid");
        const ship = this.ship!.element;
        const R = parseFloat(ship.style.width!) / 2;

        const len = asteroids.length;
        for (let i = 0; i < len; i++) {
          if (this._isStopped || this.ship!.immune) break;
          const elem = <HTMLDivElement>asteroids[i];
          const r = parseFloat(elem.style.width) / 2;

          if (r && R && r + R > this.View.distanceBetween(elem, ship) + 5) {
            this._shipCollision({
              y: this.ship!.pos.y - this._R / 2,
              x: this.ship!.pos.x - this._R / 2,
            });
          }
        }
        this._rangeCalcTimerId = this._rangeCalcTimerId
          ? setTimeout(timer, 25)
          : null;
      }),
      25
    );
  }

  /** Stop all entities and nav to end screen
   * @param timeout delay (miliseconds)
   */
  endGame(timeout?: number | null) {
    if (timeout && timeout < 0) timeout = 3000;
    else if (timeout === null) timeout = 0;

    this.emitters.endGame.emit(null);
    GameService.clearIntervals(this._intervals);

    this._isStopped = true;
    clearTimeout(this._rangeCalcTimerId);
    this._rangeCalcTimerId = null;

    if (timeout) setTimeout(() => this._stop(), timeout);
    else this._stop();
  }

  /** Restart (from end screen) */
  restart() {
    this.navTo(GameService.GameState.Menu);
    this.navTo(GameService.GameState.InGame);
  }

  pause() {
    this._changeGameState(GameService.GameState.Paused);
  }

  continue() {}

  /** Save data to LocalStorage */
  save(score: number) {
    localStorage.removeItem("best-score");
    localStorage.setItem("best-score", score.toString());
  }

  /** Navigate to game state */
  navTo(state: GameService.GameState) {
    if (this._currentGameState !== state) {
      this._changeGameState(state);
      switch (state) {
        case GameService.GameState.Menu:
          this.Router.navigate(["/menu"]);
          break;
        case GameService.GameState.InGame:
          this.Router.navigate(["/game"]);
          break;
        case GameService.GameState.EndScreen:
          this.Router.navigate(["/end-screen"]);
          break;
      }
    }
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

  playSound(id: SoundId, volume = this.config.sound.masterVolume) {
    if (this.config.sound.masterVolume && !this.isSoundDisabled)
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
  }

  enableSound() {
    this.isSoundDisabled = false;
  }
}

export namespace GameService {
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

  export enum Difficulty {
    Test = 1,
    Easy = 2.5,
    Medium = 5, // -default
    Hard = 7,
    Challenging = 9,
  }

  export enum TransitionType {
    "linear",
    "ease",
    "ease-in",
    "ease-in-out",
  }
}

export type gameMode = "debug" | "release";

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
  immune: boolean;
}

export interface MovingShip extends Ship {
  movingSpeed: number;
  moveUp(): void;
  moveDown(): void;
  moveLeft(): void;
  moveRight(): void;
}

export interface Asteroid {
  texture: string;
  radius: number;
  velocity: number;
  initialY: number;
  finalY: number;
  rotation: RotationZ | null;
}

export interface PickupItem extends Asteroid {}

export interface RotationZ {
  /** @type deg */
  degrees: number;
  /** @type miliseconds */
  transitionSpeed: number;
  /** ease, ease-in, ease-in-out, linear */
  type: GameService.TransitionType;
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

export interface ComplexMovement {
  from: Position;
  to: Position;
}

export interface GameConfigObject {
  ship: {
    immune: boolean;
    defaultHp: number;
    defaultMaxHp: number;
    testHp: number;
    testMaxHp: number;
    challengingHp: number;
    challengingMaxHp: number;
    immuneTime: number;
    defaultShipTexture: number;
    defaultBg: number;
  };
  isEndGameDelay: boolean;
  endGameDelay: number;
  sound: {
    masterVolume: number;
    initialVoulmeActive: boolean;
    initialVolumeValue: number;
  };
}
