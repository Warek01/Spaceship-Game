import { Injectable, EventEmitter, OnInit } from "@angular/core";

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
  private _scoreIntervalId!: any;

  readonly currentScore = new EventEmitter<number>();
  readonly bestScore = new EventEmitter<number>();
  readonly shipPosition = new EventEmitter<Position>();
  readonly currentGameState = new EventEmitter<GameState>();

  constructor() {
    setTimeout(() => {
      this.launch();
      setTimeout(() => {
        this.stop();
      }, 3000);
    }, 1500);
  }

  launch() {
    this.changeGameState(GameState.InGame);
    this._scoreIntervalId = setInterval(() => {
      this._currentScore++;
      this.currentScore.emit(this._currentScore);
    }, 50);
  }

  stop() {
    clearInterval(this._scoreIntervalId);
    if (this._currentScore > this._bestScore) {
      this._bestScore = this._currentScore;
      this._currentScore = 0;

      this.bestScore.emit(this._bestScore);
    }

    this.currentScore.emit(0);
    this.changeGameState(GameState.EndScreen);
  }

  pause() {}

  changeGameState(state: GameState) {
    this.currentGameState.emit(state);
  }

  /** Save score and best score to LocalStorage */
  save() {}
}
