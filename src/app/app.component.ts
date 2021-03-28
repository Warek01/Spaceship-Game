import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
} from "@angular/core";
import { GameService, GameState } from "./services/game.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class AppComponent implements OnInit, AfterViewInit {
  title = "Spaceship Game";
  currentScore!: number;
  bestScore!: number;

  constructor(public Game: GameService) {}

  ngOnInit() {
    this.Game.currentScore.subscribe((score) => {
      this.currentScore = score;
    });

    this.Game.bestScore.subscribe((score) => {
      this.bestScore = score;
    });

    setTimeout(() => {
      this.Game.launch();

      setTimeout(() => {
        this.Game.stop();
      }, 3000);
    }, 1000);
  }
  ngAfterViewInit() {}
}
