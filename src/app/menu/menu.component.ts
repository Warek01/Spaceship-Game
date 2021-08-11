import { Component, OnInit } from "@angular/core";
import { ParameterError } from "../classes/Errors";
import { equals } from "../global";
import {
  GameService,
  Difficulty,
  GameState,
  texturesContainer,
} from "../services/game.service";
import { ViewComputingService } from "../services/viewComputing.service";

@Component({
  selector: "app-menu",
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.scss"],
  host: {
    "(window:keydown.space)": "launchGame(1)",
    "(window:keydown.1)": "focus(1)",
    "(window:keydown.2)": "focus(2)",
    "(window:keydown.3)": "focus(3)",
    "(window:keydown.4)": "focus(4)",
    "(window:keydown.5)": "focus(5)",
  },
})
export class MenuComponent implements OnInit {
  attributes = {
    height: "500px",
  };

  difficulty: string = Difficulty[this.Game.difficulty];
  texture: string = this.Game.getTextureUrl(
    texturesContainer.ship[this.Game.currentTexture.ship]
  );
  focusedIndex = 0;

  constructor(public Game: GameService, public View: ViewComputingService) {
    this.attributes.height = View.availHeight + "px";
  }

  launchGame() {
    this.Game.navTo(GameState.InGame);
  }

  nextShipTexture() {
    const current = this.Game.currentTexture.ship;

    if (current === texturesContainer.ship.length - 1) {
      this.Game.setShipTexture(0);
      this.texture = this.Game.getTextureUrl(texturesContainer.ship[0]);
    } else {
      this.Game.setShipTexture(current + 1);
      this.texture = this.Game.getTextureUrl(
        texturesContainer.ship[current + 1]
      );
    }
  }

  prevShipTexture() {
    const current = this.Game.currentTexture.ship;

    if (current === 0) {
      this.Game.setShipTexture(texturesContainer.ship.length - 1);
      this.texture = this.Game.getTextureUrl(
        texturesContainer.ship[texturesContainer.ship.length - 1]
      );
    } else {
      this.Game.setShipTexture(current - 1);
      this.texture = this.Game.getTextureUrl(
        texturesContainer.ship[current - 1]
      );
    }
  }

  focus(index: number) {
    if (index < 0 || index > 9) throw new ParameterError("Wrong index", index);
    this.focusedIndex = index;

    window.removeEventListener("keypress", this._trackFocus);
    window.addEventListener("keypress", this._trackFocus);
  }

  private _trackFocus(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if (equals(key, ["a", "leftarrow"])) {
      
    }
  }

  raiseDifficulty() {
    const Dif = Difficulty;

    switch (this.difficulty) {
      case Dif[Dif.Test]:
        this.difficulty = Dif[Dif.Easy];
        this.Game.emitters.difficultyChange.emit(Dif.Easy);
        break;
      case Dif[Dif.Easy]:
        this.difficulty = Dif[Dif.Medium];
        this.Game.emitters.difficultyChange.emit(Dif.Medium);
        break;
      case Dif[Dif.Medium]:
        this.difficulty = Dif[Dif.Hard];
        this.Game.emitters.difficultyChange.emit(Dif.Hard);
        break;
      case Dif[Dif.Hard]:
        this.difficulty = Dif[Dif.Challenging];
        this.Game.emitters.difficultyChange.emit(Dif.Challenging);
        break;
      case Dif[Dif.Challenging]:
        this.difficulty = Dif[Dif.Test];
        this.Game.emitters.difficultyChange.emit(Dif.Test);
        break;
    }
  }

  lowerDifficulty() {
    const Dif = Difficulty;

    switch (this.difficulty) {
      case Dif[Dif.Test]:
        this.difficulty = Dif[Dif.Challenging];
        this.Game.emitters.difficultyChange.emit(Dif.Challenging);
        break;
      case Dif[Dif.Challenging]:
        this.difficulty = Dif[Dif.Hard];
        this.Game.emitters.difficultyChange.emit(Dif.Hard);
        break;
      case Dif[Dif.Hard]:
        this.difficulty = Dif[Dif.Medium];
        this.Game.emitters.difficultyChange.emit(Dif.Medium);
        break;
      case Dif[Dif.Medium]:
        this.difficulty = Dif[Dif.Easy];
        this.Game.emitters.difficultyChange.emit(Dif.Easy);
        break;
      case Dif[Dif.Easy]:
        this.difficulty = Dif[Dif.Test];
        this.Game.emitters.difficultyChange.emit(Dif.Test);
        break;
    }
  }

  ngOnInit() {}
}
