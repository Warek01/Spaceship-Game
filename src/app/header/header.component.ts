import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  EventEmitter,
} from "@angular/core";
import { Router } from "@angular/router";
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
    backgroundColor: "#000000ff",
    color: "#fff",
  };
  newBestIndicator = false;
  isPaused = false;
  headerHeight = new EventEmitter<number>();

  @Input("score") currentScore!: number;
  @Input() bestScore!: number;
  @Input() isBestScore = false;
  @Input("app-title") title!: string;
  @Input("game-state") currentGameState!: number;

  constructor(
    private Router: Router,
    public Game: GameService,
    public Sizes: SizingService
  ) {
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

  goToMenu() {
    this.Router.navigate(["/menu"]);
    this.Game.changeGameState(this.GameState.Menu);
  }
}
