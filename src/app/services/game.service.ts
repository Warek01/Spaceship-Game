import { Injectable, EventEmitter, OnInit, Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { SizingService } from "./sizing.service";

import $ from "jquery";

export type gameMode = "debug" | "release";

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

export interface Position {
  x: number;
  y: number;
}

export interface Ship {
  element: JQuery<HTMLDivElement>;
  pos: Position;
  moveUp(): void;
  moveDown(): void;
  changeTexture(): void;
}

export interface Asteroid {
  texture: string;
  radius: number;
  velocity: number;
  rotation?: string;
  initialY: number;
  finalY: number;
  id: number;
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
  } = {
    score: null,
    asteroid: null,
    asteroidClear: null,
  };

  private _currentScore = 0;
  private _bestScore = 0;
  private _genRate = 1;
  private _scoreRate = 100; // ms
  private _progress = 0;
  private _asteroidId = 0;
  private _removedAsteroids = 0;
  private _totalAsteroids = 0;
  private _r = 30; // px
  private _spread = 20; // px
  private _progressTreshold = 3000; // score
  private _shipElement!: JQuery<HTMLDivElement>;
  private _shipPos!: Position;

  readonly textures: {
    bg: string[];
    ship: string[];
    asteroid: string[];
  } = {
    bg: ["game_bg.jpg"],
    ship: ["ship_1.png", "ship_2.png", "ship_3.png"],
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

  currentTexture: {
    bg: number;
    ship: number;
    asteroid: number;
  } = {
    bg: 0,
    ship: 0,
    asteroid: 0,
  };
  currentGameState = GameState.Menu;
  difficulty!: Difficulty;

  readonly currentScore = new EventEmitter<number>();
  readonly bestScore = new EventEmitter<number>();
  readonly shipPosition = new EventEmitter<Position>();
  readonly CurrentGameState = new EventEmitter<GameState>();

  readonly Asteroid = new EventEmitter<Asteroid>();
  readonly CountAsteroid = new EventEmitter<null>();
  readonly DeleteAsteroid = new EventEmitter<null>();

  private readonly _Progress = new EventEmitter<null>();

  ship: Ship = {
    element: this._shipElement,
    pos: this._shipPos,
    moveUp: () => {console.log("UP")},
    moveDown: () => {},
    changeTexture: () => {},
  };

  constructor(
    private Router: Router,
    private Route: ActivatedRoute,
    private Sizing: SizingService
  ) {
    this.CurrentGameState.subscribe((state) => {
      this.currentGameState = state;
    });

    this.CountAsteroid.subscribe((val) => {
      this._totalAsteroids++;
    });

    this.DeleteAsteroid.subscribe((val) => {
      this._removedAsteroids++;
    });
  }

  get passedAsteroidsCount() {
    return this._removedAsteroids;
  }

  get totalAsteroidsCount() {
    return this._totalAsteroids;
  }

  setAsteroidRadius(r: number, spread?: number) {
    if (r > 0 && r < this.Sizing.availHeight / 4) this._r = r;
    if (spread && spread >= 0) this._spread = spread;
  }

  launch(difficulty = Difficulty.Challenging) {
    this.changeGameState(GameState.InGame);
    this.Router.navigate(["/game"]);

    this.difficulty = difficulty;
    this._shipElement = $("#ship");
    this._shipPos;

    this._Progress.subscribe((val) => {
      this._progress += this.difficulty / 15;
      clearInterval(this._intervals.asteroid);
      this._intervals.asteroid = null;

      this._intervals.asteroid = setInterval(() => {
        this.Asteroid.emit(this.generateAsteroid());
      }, 3000 / (this._genRate + this.difficulty + this._progress));
    });

    this._intervals.score = setInterval(() => {
      this._currentScore++;
      this.currentScore.emit(this._currentScore);

      if (
        this._currentScore <= this._progressTreshold &&
        this._currentScore % 150 === 0
      )
        this._Progress.emit();
    }, this._scoreRate);

    // Delay before generating asteroids
    setTimeout(() => {
      this._Progress.emit(null);
    }, 250);

    this._intervals.asteroidClear = setInterval(() => {
      $(".asteroid").each((i, elem) => {
        if (parseInt(window.getComputedStyle(elem).left) === 0) elem.remove();
      });
    }, 2000);
  }

  stop(fromPause = false) {
    fromPause && this.pause();

    if (this._currentScore > this._bestScore) {
      this._bestScore = this._currentScore;
      this._currentScore = 0;

      this.bestScore.emit(this._bestScore);
    }

    this._progress = 0;
    this._genRate = 1;

    this.currentScore.emit(0);

    this.changeGameState(GameState.EndScreen);
    this.Router.navigate(["/end-screen"]);
  }

  pause() {
    if (
      this._intervals.score &&
      this._intervals.asteroid &&
      this._intervals.asteroidClear &&
      this.currentGameState !== GameState.Paused
    ) {
      this.changeGameState(GameState.Paused);

      for (let [key, value] of Object.entries(this._intervals)) {
        clearInterval((this._intervals as any)[key]);
        (this._intervals as any)[key] = null;
      }
    }
  }

  continue() {}

  changeGameState(state: GameState) {
    this.CurrentGameState.emit(state);
    this.currentGameState = state;
  }

  generateAsteroid(): Asteroid {
    return {
      texture: `asteroid_${+(Math.random() * 9 + 1).toFixed(0)}.png`,
      /** Render height (right offscreen) */
      initialY: +(Math.random() * this.Sizing.availHeight).toFixed(0),
      /** End height (left offscreen) */
      finalY: +(Math.random() * this.Sizing.availHeight).toFixed(0),
      /** Radius from _r to _r + random(0 to _spread) px */
      radius: +(Math.random() * this._spread + this._r).toFixed(0),
      /** px/s */
      velocity: 500,
      id: this._asteroidId++,
    };
  }

  /** Save score and best score to LocalStorage */
  save() {}
}

export function trackMovement(component: any) {
  return function (this: any, e: JQuery.KeyDownEvent) {
    if (this.Game.currentGameState === GameState.InGame) {
      switch (e.key.toLowerCase()) {
        case "w": {
          this.Game.ship.moveUp();
          break;
        }
        case "s": {
          this.Game.ship.moveDown();
          break;
        }
      }
    }
  }.bind(component);
}
