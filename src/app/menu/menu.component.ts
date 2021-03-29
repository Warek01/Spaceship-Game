import { Component, OnInit } from "@angular/core";
import { GameService } from "../services/game.service";
import { SizingService } from "../services/sizing.service";

@Component({
  selector: "app-menu",
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.scss"],
})
export class MenuComponent implements OnInit {
  attributes = {
    height: "500px",
  };

  constructor(public Game: GameService, Sizes: SizingService) {
    this.attributes.height = Sizes.availHeight + "px";
  }

  startGame() {
    this.Game.launch();
  }

  ngOnInit() {}
}
