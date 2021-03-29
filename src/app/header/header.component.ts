import { Component, Input, OnInit } from "@angular/core";
import { GameService } from "../services/game.service";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit {
  GameState = GameService.GameState;
  attributes = {
    hidden: false,
    height: 50,
    bg: "#00000030",
    color: "#333",
  };

  @Input("score") currentScore!: number;
  @Input("best-score") bestScore!: number;
  @Input("app-title") title!: string;
  @Input("game-state") currentGameState!: number;

  constructor(public Game: GameService) {}

  ngOnInit(): void {}
}
