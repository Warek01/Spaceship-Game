import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GameService, GameState, trackMovement } from "./services/game.service";

import $ from "jquery";

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
  currentGameState = GameService.GameState.Menu;
  isBestScore = false;
  isPaused = false;

  constructor(
    public Game: GameService,
    public Router: Router,
    public Route: ActivatedRoute
  ) {
    $(document.body).css(
      "background-image",
      `url(./assets/img/${this.Game.textures.bg[this.Game.currentTexture.bg]})`
    );
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

    $(window).keydown(trackMovement(this));
  }
}
