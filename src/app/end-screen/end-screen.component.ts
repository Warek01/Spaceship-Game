import { Component, OnInit } from "@angular/core";
import { GameService } from "../services/game.service";
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
  stats: Statistic[] = [];

  constructor(private View: ViewComputingService, private Game: GameService) {}

  ngOnInit() {
    this.stats.push({
      description: "Total asteroids passed",
      data: this.Game.totalAsteroidsCount,
    });

    this.stats.push({
      description: "Ingame time",
      data: this.Game.ingameTime + " seconds",
    });
  }
}
