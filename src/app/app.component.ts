import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
} from "@angular/core";
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterEvent,
} from "@angular/router";
import { GameService, GameState } from "./services/game.service";

import $ from "jquery";
import { ViewComputingService } from "./services/viewComputing.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class AppComponent implements OnInit, AfterViewInit {
  title = "Spaceship";
  currentScore!: number;
  bestScore!: number;
  currentGameState = GameState.Menu;
  isBestScore = false;
  isPaused = false;

  constructor(
    private View: ViewComputingService,
    private Game: GameService,
    private Router: Router,
    private Route: ActivatedRoute
  ) {
    $(document.body).css("font-size", View.fontSize);
  }

  ngOnInit() {
    this.Game.currentScore.subscribe((score) => {
      this.currentScore = score;
    });

    this.Game.bestScore.subscribe((score) => {
      this.bestScore = score;
      this.isBestScore = true;
    });

    this.Game.CurrentGameState.subscribe((state) => {
      this.currentGameState = state;
    });
  }

  ngAfterViewInit() {
    if (this.Route.snapshot.url.toString() !== "/menu")
      this.Router.navigate(["/menu"]);
  }
}
