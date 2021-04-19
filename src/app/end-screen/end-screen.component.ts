import { Component, OnInit } from "@angular/core";
import { Difficulty, GameService } from "../services/game.service";
import { ViewComputingService } from "../services/viewComputing.service";

export interface Statistic {
  description: string;
  data: number | string | boolean;
}

@Component({
  selector: "app-end-screen",
  templateUrl: "./end-screen.component.html",
  styleUrls: ["./end-screen.component.scss"],
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
  ];

  constructor(private View: ViewComputingService, private Game: GameService) {}

  ngOnInit() {}
}
