import { Injectable, EventEmitter, OnInit, Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ViewComputingService } from "./viewComputing.service";
import { GameComponent } from "../game/game.component";
import $ from "jquery";

export enum GameState {
  Menu = 0,
  InGame,
  Paused,
  EndScreen,
}

export enum Difficulty {
  Test = 1,
  Easy = 2.5,
  Medium = 5,
  Hard = 7,
  Challenging = 9,
}

@Injectable({
  providedIn: "root",
})
export class GameService {
  static readonly GameState = GameState;

  private _intervals: {
    score: any;
    asteroid: any;
    asteroidClear: any;
    distance: any;
    keyDown: any;
  } = {
    score: null,
    asteroid: null,
    asteroidClear: null,
    distance: null,
    keyDown: null,
  };

  private _currentScore = 0;
  private _bestScore = 0;
  private _genRate = 1;
  private _scoreRate = 100; // ms
  private _isStopped = false;
  private _removedAsteroids = 0;
  private _totalAsteroids = 0;
  private _currentKeyHeld: string | null = null;
  private _r = 40; // asteroid radius (px)
  private _r_spread = 20; // asteroid radius spread (px)
  private _s = 450; // asteroid speed
  private _s_spread = 100; // asteroid speed spread
  private _R = 30; // ship radius (px)
  private _shipSpeed = 20; // px/tick
  private _shipTextureElement!: JQuery<HTMLDivElement>;
  private _currentGameState = GameState.Menu;
  private _shipTransitionDuration!: string;
  private _gameStartTimestamp!: number;
  private _gameEndTimestamp!: number;

  readonly textures: {
    bg: string[];
    ship: string[];
    asteroid: string[];
  } = {
    bg: [
      "game_bg_1.jpg",
      "game_bg_2.jpg",
      "game_bg_3.jpg",
      "game_bg_4.jpg",
      "game_bg_5.jpg",
      "game_bg_6.jpg",
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
  difficulty: Difficulty = Difficulty.Medium;

  currentTexture: {
    bg: number;
    ship: number;
  } = {
    bg: 0,
    ship: 0,
  };

  readonly emitters = {
    currentScore: new EventEmitter<number>(),
    bestScore: new EventEmitter<number>(),
    shipPosition: new EventEmitter<Position>(),
    currentGameState: new EventEmitter<GameState>(),
    setDifficulty: new EventEmitter<Difficulty>(),
    setShipTexture: new EventEmitter<number>(),
    setBgTexture: new EventEmitter<number>(),
    asteroid: new EventEmitter<Asteroid>(),
    countAsteroid: new EventEmitter<null>(),
    deleteAsteroid: new EventEmitter<null>(),
    nextBg: new EventEmitter<null>(),
    prevBg: new EventEmitter<null>(),
  };

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
          this._self._shipTextureElement.css(
            "background-image",
            `url(../../../../assets/img/${texture})`
          );
          return;
        } else currentTexture++;
      });

      return this;
    },

    ShipSpeed(speed: number) {
      if (speed > 0) this._self._shipSpeed = speed;

      return this;
    },

    shipPosition(pos: Position) {
      this._self.ship!.element.css("transition-duration", "0s");

      this._self.ship!.element.css({
        left: pos.x,
        top: pos.y,
      });

      setTimeout(() => {
        this._self.ship!.element.css(
          "transition-duration",
          this._self._shipTransitionDuration
        );
      });

      return this;
    },

    ship(ship: ShipConfig) {
      ship.speed && this.ShipSpeed(ship.speed);

      const R = ship.radius || this._self._R;
      const shipSpeed = this._self._shipSpeed;
      const self = this._self;

      self.ship = {
        element: ship.element,
        pos: {
          x: ship.pos.x,
          y: ship.pos.y,
        },
        movingSpeed: shipSpeed,
        moveDown() {
          const nextPos = this.element.offset()!.top + this.movingSpeed;

          if (nextPos < self.View.availHeight - R * 2) {
            this.pos.y = nextPos;
            this.element.css("top", nextPos);
          } else {
            this.pos.y = self.View.availHeight - R * 2;
            this.element.css("top", self.View.availHeight - R * 2);
          }
        },
        moveUp() {
          const nextPos = this.element.offset()!.top - R * 2 - this.movingSpeed;

          if (nextPos > R * 2) {
            this.pos.y = nextPos;
            this.element.css("top", nextPos);
          } else {
            this.pos.y = self.View.headerHeight - R * 2;
            this.element.css("top", self.View.headerHeight - R * 2);
          }
        },
      };

      self._shipTextureElement = ship.element.find(".texture") as any;

      ship.radius && this.shipRadius(ship.radius);
      ship.texture && this._shipTexture(ship.texture);

      self.ship!.element.width(self._R * 2).height(self._R * 2);

      self._shipTransitionDuration = self.ship.element.css(
        "transition-duration"
      );

      this._shipTexture(self.textures.ship[self.currentTexture.ship]);

      return this;
    },
  };

  readonly track = {
    _self: this,
    keyDown(component: GameComponent) {
      const self = this._self;
      return function (this: GameComponent, e: KeyboardEvent) {
        if (
          this.Game._currentGameState === GameState.InGame &&
          this.Game.ship &&
          self._currentKeyHeld !== e.key.toLowerCase()
        ) {
          clearInterval(self._intervals.keyDown);
          self._currentKeyHeld = e.key.toLowerCase();

          switch (e.key.toLowerCase()) {
            case "w":
              self._intervals.keyDown = setInterval(() => {
                self.ship!.moveUp();
              }, 25);
              break;

            case "s":
              self._intervals.keyDown = setInterval(() => {
                self.ship!.moveDown();
              }, 25);
              break;
          }
        }
      }.bind(component);
    },

    keyUp(component: GameComponent) {
      const self = this._self;
      return function (this: GameComponent, e: KeyboardEvent) {
        if (
          this.Game._currentGameState === GameState.InGame &&
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

    this.emitters.countAsteroid.subscribe((val) => {
      this._totalAsteroids++;
    });

    this.emitters.deleteAsteroid.subscribe((val) => {
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
      $(document.body).css(
        "background-image",
        `url(../../assets/img/${this.textures.bg[this.currentTexture.bg]})`
      );
    });
  }

  static clearIntervals = function (intervalsObject: any) {
    for (const key of Object.keys(intervalsObject)) {
      clearInterval(intervalsObject[key]);
      intervalsObject[key] = null;
    }
  };

  private _changeGameState(state: GameState) {
    this.emitters.currentGameState.emit(state);
    this._currentGameState = state;
  }

  get passedAsteroidsCount() {
    return this._removedAsteroids;
  }

  get totalAsteroidsCount() {
    return this._totalAsteroids;
  }

  get ingameTime() {
    return +(
      (this._gameEndTimestamp - this._gameStartTimestamp) /
      1000
    ).toFixed(0);
  }

  launch() {
    const difficulty = this.difficulty;
    if (this._currentGameState === GameState.InGame && !this._isStopped)
      throw "Launch Error";

    this._changeGameState(GameState.InGame);
    this._isStopped = false;
    GameService.clearIntervals(this._intervals);

    this.difficulty = difficulty;
    this._gameStartTimestamp = Date.now();

    clearInterval(this._intervals.asteroid);
    this._intervals.asteroid = null;

    this._intervals.asteroid = setInterval(() => {
      this.emitters.asteroid.emit(this.generateAsteroid());
    }, 3000 / (this._genRate + this.difficulty));

    this._intervals.score = setInterval(() => {
      this._currentScore++;
      this.emitters.currentScore.emit(this._currentScore);
    }, this._scoreRate);

    this._intervals.asteroidClear = setInterval(() => {
      const asteroids = document.querySelectorAll(".asteroid");

      let i = asteroids.length;
      if (i)
        while (--i) {
          if (asteroids[i].getBoundingClientRect().left <= 0)
            asteroids[i].remove();
        }
    }, 1000);

    let timer: any;
    let timerId: any = setTimeout(
      (timer = () => {
        if (this._isStopped) return;
        const asteroids = document.querySelectorAll(".asteroid");
        const ship = document.getElementById("ship");
        const R = parseFloat(ship?.style.width!) / 2;

        for (let i = 0; i < asteroids.length; i++) {
          const elem = asteroids[i];
          const r = parseFloat((elem as HTMLDivElement).style.width!) / 2;

          if (r && R && r + R > this.View.distanceBetween(elem, ship!)) {
            this._isStopped = true;
            this.stop();
            clearTimeout(timerId);
            timerId = null;
          }
        }
        if (timerId) timerId = setTimeout(timer, 50);
      }),
      50
    );
  }

  stop() {
    if (this._currentScore > this._bestScore) {
      this._bestScore = this._currentScore;
      this._currentScore = 0;

      this.emitters.bestScore.emit(this._bestScore);
    }

    this._isStopped = true;
    this._genRate = 1;
    this._scoreRate = 100;
    this._currentScore = 0;
    this._gameEndTimestamp = Date.now();

    GameService.clearIntervals(this._intervals);
    this.navTo(GameState.EndScreen);
  }

  pause() {
    this._changeGameState(GameState.Paused);
  }
  continue() {}

  generateAsteroid(): Asteroid {
    return {
      texture: `asteroid_${+(Math.random() * 9 + 1).toFixed(0)}.png`,
      /** Render height (right offscreen) */
      initialY: +(Math.random() * this.View.availHeight).toFixed(0),
      /** End height (left offscreen) */
      finalY: +(Math.random() * this.View.availHeight).toFixed(0),
      /** Radius from _r to _r + random(0 to _spread) px */
      radius: +(Math.random() * this._r_spread + this._r).toFixed(0),
      /** px/s  450 - 550*/
      velocity: +(Math.random() * this._s_spread + this._s).toFixed(0),
    };
  }

  save(score: number) {
    localStorage.removeItem("best-score");
    localStorage.setItem("best-score", score.toString());
  }

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

  toggleFullscreen() {
    if (!document.fullscreenEnabled) return alert("Fullscreen not allowed");
    if (
      document.fullscreenElement ||
      (screen.availHeight === window.innerHeight &&
        screen.availWidth === window.innerWidth)
    )
      document.exitFullscreen();
    else document.documentElement.requestFullscreen();

    console.log(screen.height);
  }

  getTextureUrl(src: string): string {
    return `./assets/img/${src}`;
  }

  nextBg() {
    this.emitters.nextBg.emit(null);
  }

  prevBg() {
    this.emitters.prevBg.emit(null);
  }
}

export type gameMode = "debug" | "release";

export interface Position {
  x: number;
  y: number;
}

export interface Ship {
  element: JQuery<HTMLDivElement>;
  pos: Position;
}

export interface MovingShip extends Ship {
  movingSpeed: number;
  moveUp(): void;
  moveDown(): void;
}

export interface Asteroid {
  texture: string;
  radius: number;
  velocity: number;
  rotation?: string;
  initialY: number;
  finalY: number;
}

export interface ShipConfig {
  element: JQuery<HTMLDivElement>;
  pos: Position;
  texture?: string;
  radius?: number;
  speed?: number;
}
