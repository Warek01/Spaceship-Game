import { Injectable, EventEmitter, OnInit } from "@angular/core";

export enum GameState {
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
  private _currentScore = 0;
  private _bestScore = 0;
  private _scoreIntervalId!: any;

  readonly currentScore = new EventEmitter<number>();
  readonly bestScore = new EventEmitter<number>();
  readonly shipPosition = new EventEmitter<Position>();
  readonly currentGameState = new EventEmitter<GameState>();

  constructor() {}

  launch() {
    this._scoreIntervalId = setInterval(() => {
      this._currentScore++;
      this.currentScore.emit(this._currentScore);
    }, 200);
  }

  stop() {
    clearInterval(this._scoreIntervalId);
    if (this._currentScore > this._bestScore) {
      this._bestScore = this._currentScore;
      this._currentScore = 0;

      this.bestScore.emit(this._bestScore);
      this.currentScore.emit(0);

      this.changeGameState(GameState.EndScreen);
    }
  }

  changeGameState(state: GameState) {
    this.currentGameState.emit(state);
  }

  /** Save score and best score to LocalStorage */
  save() {}
}
