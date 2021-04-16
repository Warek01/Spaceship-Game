import { Component, OnInit } from "@angular/core";
import { Difficulty, GameService, GameState } from "../services/game.service";
import { ViewComputingService } from "../services/viewComputing.service";

@Component({
  selector: "app-menu",
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.scss"],
  host: {
    "(window:keydown.space)": "launchGame(1)"
  }
})
export class MenuComponent implements OnInit {
  attributes = {
    height: "500px",
  };

  difficulty: string = Difficulty[this.Game.difficulty];
  texture: string = this.Game.getTextureUrl(
    this.Game.textures.ship[this.Game.currentTexture.ship]
  );

  constructor(public Game: GameService, public View: ViewComputingService) {
    this.attributes.height = View.availHeight + "px";
  }

  launchGame() {
    this.Game.navTo(GameState.InGame)
  }

  nextShipTexture() {
    const current = this.Game.currentTexture.ship;

    if (current === this.Game.textures.ship.length - 1) {
      this.Game.emitters.setShipTexture.emit(0);
      this.texture = this.Game.getTextureUrl(this.Game.textures.ship[0]);
    } else {
      this.Game.emitters.setShipTexture.emit(current + 1);
      this.texture = this.Game.getTextureUrl(
        this.Game.textures.ship[current + 1]
      );
    }
  }

  prevShipTexture() {
    const current = this.Game.currentTexture.ship;

    if (current === 0) {
      this.Game.emitters.setShipTexture.emit(this.Game.textures.ship.length - 1);
      this.texture = this.Game.getTextureUrl(
        this.Game.textures.ship[this.Game.textures.ship.length - 1]
      );
    } else {
      this.Game.emitters.setShipTexture.emit(current - 1);
      this.texture = this.Game.getTextureUrl(
        this.Game.textures.ship[current - 1]
      );
    }
  }

  raiseDifficulty() {
    switch (this.difficulty) {
      case Difficulty[Difficulty.Test]:
        this.difficulty = Difficulty[Difficulty.Easy];
        this.Game.emitters.setDifficulty.emit(Difficulty.Easy);
        break;
      case Difficulty[Difficulty.Easy]:
        this.difficulty = Difficulty[Difficulty.Medium];
        this.Game.emitters.setDifficulty.emit(Difficulty.Medium);
        break;
      case Difficulty[Difficulty.Medium]:
        this.difficulty = Difficulty[Difficulty.Hard];
        this.Game.emitters.setDifficulty.emit(Difficulty.Hard);
        break;
      case Difficulty[Difficulty.Hard]:
        this.difficulty = Difficulty[Difficulty.Challenging];
        this.Game.emitters.setDifficulty.emit(Difficulty.Challenging);
        break;
      case Difficulty[Difficulty.Challenging]:
        this.difficulty = Difficulty[Difficulty.Test];
        this.Game.emitters.setDifficulty.emit(Difficulty.Test);
        break;
    }
  }

  lowerDifficulty() {
    switch (this.difficulty) {
      case Difficulty[Difficulty.Test]:
        this.difficulty = Difficulty[Difficulty.Challenging];
        this.Game.emitters.setDifficulty.emit(Difficulty.Challenging);
        break;
      case Difficulty[Difficulty.Challenging]:
        this.difficulty = Difficulty[Difficulty.Hard];
        this.Game.emitters.setDifficulty.emit(Difficulty.Hard);
        break;
      case Difficulty[Difficulty.Hard]:
        this.difficulty = Difficulty[Difficulty.Medium];
        this.Game.emitters.setDifficulty.emit(Difficulty.Medium);
        break;
      case Difficulty[Difficulty.Medium]:
        this.difficulty = Difficulty[Difficulty.Easy];
        this.Game.emitters.setDifficulty.emit(Difficulty.Easy);
        break;
      case Difficulty[Difficulty.Easy]:
        this.difficulty = Difficulty[Difficulty.Test];
        this.Game.emitters.setDifficulty.emit(Difficulty.Test);
        break;
    }
  }

  ngOnInit() {}
}
