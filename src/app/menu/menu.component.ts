import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { Difficulty, GameService } from "../services/game.service";
import { ViewComputingService } from "../services/viewComputing.service";

@Component({
  selector: "app-menu",
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.scss"],
})
export class MenuComponent implements OnInit {
  attributes = {
    height: "500px",
  };

  difficulty: string = Difficulty[this.Game.difficulty];
  texture: string = this._setTexture(
    this.Game.textures.ship[this.Game.currentTexture.ship]
  );

  constructor(public Game: GameService, View: ViewComputingService) {
    this.attributes.height = View.availHeight + "px";
  }

  private _setTexture(src: string): string {
    return `./assets/img/${src}`;
  }

  nextShipTexture() {
    const current = this.Game.currentTexture.ship;

    if (current === this.Game.textures.ship.length - 1) {
      this.Game.SetShipTexture.emit(0);
      this.texture = this._setTexture(this.Game.textures.ship[0]);
    } else {
      this.Game.SetShipTexture.emit(current + 1);
      this.texture = this._setTexture(this.Game.textures.ship[current + 1]);
    }
  }

  previousShipTexture() {
    const current = this.Game.currentTexture.ship;

    if (current === 0) {
      this.Game.SetShipTexture.emit(this.Game.textures.ship.length - 1);
      this.texture = this._setTexture(this.Game.textures.ship[this.Game.textures.ship.length - 1]);
    } else {
      this.Game.SetShipTexture.emit(current - 1);
      this.texture = this._setTexture(this.Game.textures.ship[current - 1]);
    }
  }

  nextBgTexture() {
    const current = this.Game.currentTexture.bg;

    if (current === this.Game.textures.bg.length - 1) {
      this.Game.SetBgTexture.emit(0);
    } else {
      this.Game.SetBgTexture.emit(current + 1);
    }
  }

  previousSBgTexture() {
    const current = this.Game.currentTexture.bg;

    if (current === 0) {
      this.Game.SetBgTexture.emit(this.Game.textures.bg.length - 1);
    } else {
      this.Game.SetBgTexture.emit(current - 1);
    }
  }

  raiseDifficulty() {
    switch (this.difficulty) {
      case Difficulty[Difficulty.Test]:
        this.difficulty = Difficulty[Difficulty.Easy];
        this.Game.SetDifficulty.emit(Difficulty.Easy);
        break;
      case Difficulty[Difficulty.Easy]:
        this.difficulty = Difficulty[Difficulty.Medium];
        this.Game.SetDifficulty.emit(Difficulty.Medium);
        break;
      case Difficulty[Difficulty.Medium]:
        this.difficulty = Difficulty[Difficulty.Hard];
        this.Game.SetDifficulty.emit(Difficulty.Hard);
        break;
      case Difficulty[Difficulty.Hard]:
        this.difficulty = Difficulty[Difficulty.Challenging];
        this.Game.SetDifficulty.emit(Difficulty.Challenging);
        break;
      case Difficulty[Difficulty.Challenging]:
        this.difficulty = Difficulty[Difficulty.Test];
        this.Game.SetDifficulty.emit(Difficulty.Test);
        break;
    }
  }

  lowerDifficulty() {
    switch (this.difficulty) {
      case Difficulty[Difficulty.Test]:
        this.difficulty = Difficulty[Difficulty.Challenging];
        this.Game.SetDifficulty.emit(Difficulty.Challenging);
        break;
      case Difficulty[Difficulty.Challenging]:
        this.difficulty = Difficulty[Difficulty.Hard];
        this.Game.SetDifficulty.emit(Difficulty.Hard);
        break;
      case Difficulty[Difficulty.Hard]:
        this.difficulty = Difficulty[Difficulty.Medium];
        this.Game.SetDifficulty.emit(Difficulty.Medium);
        break;
      case Difficulty[Difficulty.Medium]:
        this.difficulty = Difficulty[Difficulty.Easy];
        this.Game.SetDifficulty.emit(Difficulty.Easy);
        break;
      case Difficulty[Difficulty.Easy]:
        this.difficulty = Difficulty[Difficulty.Test];
        this.Game.SetDifficulty.emit(Difficulty.Test);
        break;
    }
  }

  ngOnInit() {}
}
