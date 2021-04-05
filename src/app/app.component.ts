import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  HostBinding,
  HostListener,
  OnInit,
  ViewContainerRef,
  ViewEncapsulation,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GameService, GameState } from "./services/game.service";
import { ViewComputingService } from "./services/viewComputing.service";
import {
  WindowsService,
  AppWindow,
  AppWindowRef,
} from "./services/windows.service";
import $ from "jquery";
import { HelpWindowComponent } from "./help-window/help-window.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class AppComponent implements OnInit, AfterViewInit {
  private _openedWindows: AppWindowRef[] = [];
  private _registeredWindows: AppWindow[] = [
    { id: "help", component: HelpWindowComponent },
  ];

  title = "Spaceship";
  currentScore!: number;
  bestScore!: number;
  currentGameState = GameState.Menu;
  isBestScore = false;
  isPaused = false;

  @HostListener("document:keydown.escape", ["$event"]) trackEscPress(
    e: KeyboardEvent
  ) {
    e.preventDefault();
  }

  constructor(
    private View: ViewComputingService,
    private Game: GameService,
    private Router: Router,
    private Route: ActivatedRoute,
    private Factory: ComponentFactoryResolver,
    private ViewRef: ViewContainerRef,
    private WinService: WindowsService
  ) {
    $(document.body).css("font-size", View.fontSize);
  }

  ngOnInit() {
    this._registeredWindows.forEach((wd) => {
      this.WinService.registerWindow(wd);
    });

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

    this.WinService.OpenWindow.subscribe((wd) => {
      const factory = this.Factory.resolveComponentFactory(wd.component);
      const ref = this.ViewRef.createComponent(factory);
      this._openedWindows.push({ ...wd, ref });
    });

    this.WinService.CloseWindow.subscribe((wd) => {
      this._openedWindows.forEach((owd, i) => {
        if (wd.id === owd.id) {
          owd.ref.destroy();
          this._openedWindows.splice(i, 1);
        }
      });
    });
  }
}
