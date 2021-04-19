import { Component, OnInit } from "@angular/core";
import { GameService } from "../services/game.service";
import { ViewComputingService } from "../services/viewComputing.service";

@Component({
  selector: "app-menu",
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.scss"],
  host: {
    "(window:keydown.space)": "launchGame(1)",
  },
})
export class MenuComponent implements OnInit {
  attributes = {
    height: "500px",
  };

  difficulty: string = GameService.Difficulty[this.Game.difficulty];
  texture: string = this.Game.getTextureUrl(
    this.Game.textures.ship[this.Game.currentTexture.ship]
  );

  constructor(public Game: GameService, public View: ViewComputingService) {
    this.attributes.height = View.availHeight + "px";
  }

  launchGame() {
    this.Game.navTo(GameService.GameState.InGame);
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
      this.Game.emitters.setShipTexture.emit(
        this.Game.textures.ship.length - 1
      );
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
    const Dif = GameService.Difficulty;

    switch (this.difficulty) {
      case Dif[Dif.Test]:
        this.difficulty = Dif[Dif.Easy];
        this.Game.emitters.setDifficulty.emit(Dif.Easy);
        break;
      case Dif[Dif.Easy]:
        this.difficulty = Dif[Dif.Medium];
        this.Game.emitters.setDifficulty.emit(Dif.Medium);
        break;
      case Dif[Dif.Medium]:
        this.difficulty = Dif[Dif.Hard];
        this.Game.emitters.setDifficulty.emit(Dif.Hard);
        break;
      case Dif[Dif.Hard]:
        this.difficulty = Dif[Dif.Challenging];
        this.Game.emitters.setDifficulty.emit(Dif.Challenging);
        break;
      case Dif[Dif.Challenging]:
        this.difficulty = Dif[Dif.Test];
        this.Game.emitters.setDifficulty.emit(Dif.Test);
        break;
    }
  }

  lowerDifficulty() {
    const Dif = GameService.Difficulty;

    switch (this.difficulty) {
      case Dif[Dif.Test]:
        this.difficulty = Dif[Dif.Challenging];
        this.Game.emitters.setDifficulty.emit(Dif.Challenging);
        break;
      case Dif[Dif.Challenging]:
        this.difficulty = Dif[Dif.Hard];
        this.Game.emitters.setDifficulty.emit(Dif.Hard);
        break;
      case Dif[Dif.Hard]:
        this.difficulty = Dif[Dif.Medium];
        this.Game.emitters.setDifficulty.emit(Dif.Medium);
        break;
      case Dif[Dif.Medium]:
        this.difficulty = Dif[Dif.Easy];
        this.Game.emitters.setDifficulty.emit(Dif.Easy);
        break;
      case Dif[Dif.Easy]:
        this.difficulty = Dif[Dif.Test];
        this.Game.emitters.setDifficulty.emit(Dif.Test);
        break;
    }
  }

  ngOnInit() {}
}
