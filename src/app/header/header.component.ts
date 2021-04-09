import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  EventEmitter,
  Output,
  HostBinding,
  HostListener,
} from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { HelpWindowComponent } from "../help-window/help-window.component";
import { GameService, GameState } from "../services/game.service";
import { ViewComputingService } from "../services/viewComputing.service";
import { WindowsService, AppWindow } from "../services/windows.service";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnChanges {
  private _intervals: {
    bestScore: any;
  } = {
    bestScore: null,
  };

  GameState = GameService.GameState;
  attributes = {
    display: "flex",
    height: "0px",
    backgroundColor: "#000000ff",
    color: "#fff",
  };
  isPaused = false;
  headerHeight = new EventEmitter<number>();

  @Input("score") currentScore!: number;
  @Input() bestScore!: number;
  @Input() isBestScore = false;
  @Input("app-title") title!: string;
  @Input("game-state") currentGameState!: number;

  constructor(
    private Router: Router,
    private WinService: WindowsService,
    public Game: GameService,
    public View: ViewComputingService
  ) {
    this.attributes.height = View.headerHeight + "px";
  }

  goToMenu() {
    this.Game.navTo(this.GameState.Menu);
  }

  openHelpWindow() {
    this.WinService.open("help");
  }

  ngOnInit() {
    this.Router.events.subscribe((event) => {
      if (
        event instanceof NavigationEnd &&
        event.urlAfterRedirects === "/menu"
      ) {
        GameService.clearIntervals(this._intervals);
        this.isBestScore = false;
        this.currentScore = 0;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.bestScore && !changes.bestScore.firstChange) {
      let counter = 0;
      this._intervals.bestScore = setInterval(() => {
        this.isBestScore = !this.isBestScore;

        if (++counter === 20) {
          clearInterval(this._intervals.bestScore);
          this.isBestScore = true;
        }
      }, 500);
    }
  }
}
