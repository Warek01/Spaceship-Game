import { Component, OnInit } from "@angular/core";
import { GameService } from "../services/game.service";
import { ViewComputingService } from "../services/viewComputing.service";

@Component({
  selector: "app-end-screen",
  templateUrl: "./end-screen.component.html",
  styleUrls: ["./end-screen.component.scss"],
  host: {
    "(window:keydown.space)": "Game.restart()",
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
      data: GameService.Difficulty[this.Game.difficulty],
    },
  ];

  constructor(private View: ViewComputingService, private Game: GameService) {}

  ngOnInit() {}
}

interface Statistic {
  description: string;
  data: number | string | boolean;
}
