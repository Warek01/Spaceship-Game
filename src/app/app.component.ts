import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
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
import { HelpWindowComponent } from "./app-windows/help/help-window.component";
import $ from "jquery";
import "./global";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  encapsulation: ViewEncapsulation.Emulated,
})
export class AppComponent implements OnInit, AfterViewInit {
  private _activeWindow: AppWindowRef | null = null;
  private _openedWindows: AppWindowRef[] = [];
  private _registeredWindows: AppWindow[] = [
    { id: "help", component: HelpWindowComponent },
  ];

  @HostListener("document:keydown.escape", ["$event"]) private trackEscPress(
    e: KeyboardEvent
  ) {
    e.preventDefault();
  }
  @HostListener("document:keydown.h") private openHelpWindow() {
    this.WinService.open("help")
  }
  @HostListener("document:keydown.f") private enterFullScreen() {
    this.Game.toggleFullscreen();
  }

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

    this.Game.emitters.currentScore.subscribe((score) => {
      this.currentScore = score;
    });

    this.Game.emitters.bestScore.subscribe((score) => {
      this.bestScore = score;
      this.isBestScore = true;
    });

    this.Game.emitters.currentGameState.subscribe((state) => {
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
