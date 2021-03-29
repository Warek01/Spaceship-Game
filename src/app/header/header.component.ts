import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  EventEmitter,
} from "@angular/core";
import { GameService } from "../services/game.service";
import { SizingService } from "../services/sizing.service";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnChanges {
  GameState = GameService.GameState;
  attributes = {
    display: "flex",
    height: "0px",
    backgroundColor: "#00000030",
    color: "#333",
  };
  newBestIndicator = false;
  headerHeight = new EventEmitter<number>();

  @Input("score") currentScore!: number;
  @Input("best-score") bestScore!: number;
  @Input("is-best-score") isBestScore = false;
  @Input("app-title") title!: string;
  @Input("game-state") currentGameState!: number;

  constructor(public Game: GameService, Sizes: SizingService) {
    this.attributes.height = Sizes.headerHeight + "px";
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    // When a new best score occurs
    if (changes.bestScore && !changes.bestScore.firstChange) {
      let counter = 0;
      const intervalId = setInterval(() => {
        this.newBestIndicator = !this.newBestIndicator;

        if (++counter === 20) {
          clearInterval(intervalId);
          this.newBestIndicator = true;
        }
      }, 500);
    }
  }
}
