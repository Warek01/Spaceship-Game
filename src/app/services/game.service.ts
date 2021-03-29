import { Injectable, EventEmitter, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

enum GameState {
  Menu = 0,
  InGame,
  Paused,
  EndScreen,
}

export interface Position {
  x: number;
  y: number;
}

@Injectable({
  providedIn: "root",
})
export class GameService {
  static readonly GameState = GameState;

  private _currentScore = 0;
  private _bestScore = 0;
  private _currentGameState = GameState.Menu;
  private _scoreIntervalId!: any;

  readonly currentScore = new EventEmitter<number>();
  readonly bestScore = new EventEmitter<number>();
  readonly shipPosition = new EventEmitter<Position>();
  readonly currentGameState = new EventEmitter<GameState>();

  constructor(private Router: Router, private Route: ActivatedRoute) {}

  launch() {
    this.changeGameState(GameState.InGame);
    this.Router.navigate(["/game"]);

    this._scoreIntervalId = setInterval(() => {
      this._currentScore++;
      this.currentScore.emit(this._currentScore);
    }, 50);
  }

  stop() {
    if (this._scoreIntervalId) {
      clearInterval(this._scoreIntervalId);
      this._scoreIntervalId = null;
    }

    if (this._currentScore > this._bestScore) {
      this._bestScore = this._currentScore;
      this._currentScore = 0;

      this.bestScore.emit(this._bestScore);
    }

    this.currentScore.emit(0);
    this.changeGameState(GameState.EndScreen);
    this.Router.navigate(["/end-screen"]);
  }

  pause() {
    if (this._scoreIntervalId && this._currentGameState === GameState.Paused) {
      this.changeGameState(GameState.Paused);
    }
  }

  continue() {}

  changeGameState(state: GameState) {
    this.currentGameState.emit(state);
    this._currentGameState = state;
  }

  /** Save score and best score to LocalStorage */
  save() {}
}
