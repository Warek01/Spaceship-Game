import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
} from "@angular/core";
import { GameService } from "./services/game.service";

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

  constructor(public Game: GameService) {}

  ngOnInit() {
    this.Game.currentScore.subscribe((score) => {
      this.currentScore = score;
    });

    this.Game.bestScore.subscribe((score) => {
      this.bestScore = score;
    });

    this.Game.currentGameState.subscribe((state) => {
      this.currentGameState = state;
    });
  }
  ngAfterViewInit() {}
}
