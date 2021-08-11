import { Component, OnInit } from "@angular/core";
import { GameService, Difficulty, GameState } from "../services/game.service";
import { ViewComputingService } from "../services/viewComputing.service";

@Component({
  selector: "app-end-screen",
  templateUrl: "./end-screen.component.html",
  styleUrls: ["./end-screen.component.scss"],
  host: {
    "(window:keydown.space)": "Game.restart()",
    "(window:keydown.q)": "goToMenu()",
  },
})
export class EndScreenComponent implements OnInit {
  stats: Statistic[] = [
    {
      description: "Total asteroids passed",
      data: this.Game.totalAsteroidsCount,
    },
    {
      description: "Ingame time",
      data: this.Game.ingameTime + " seconds",
    },
    {
      description: "On diffiulty",
      data: Difficulty[this.Game.difficulty],
    },
    {
      description: "Items picked",
      data: this.Game.itemsPicked,
    },
  ];

  goToMenu() {
    this.Game.stop();
    this.Game.navTo(GameState.Menu);
  }

  constructor(private View: ViewComputingService, private Game: GameService) {}

  ngOnInit() {}
}

interface Statistic {
  description: string;
  data: number | string | boolean;
}
