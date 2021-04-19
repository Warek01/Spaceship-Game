import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  OnInit,
  ViewContainerRef,
  ViewEncapsulation,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GameService } from "./services/game.service";
import { ViewComputingService } from "./services/viewComputing.service";
import {
  WindowsService,
  AppWindow,
  AppWindowRef,
} from "./services/windows.service";
import { HelpWindowComponent } from "./app-windows/help/help.component";

import "./global";
import { SettingsWindowComponent } from "./app-windows/settings/settings.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  encapsulation: ViewEncapsulation.Emulated,
  host: {
    "(window:click)": "_events.onButtonClick($event)",
    "(document:keydown.escape)": "_events.trackEscPress($event)",
    "(document:keydown.h)": "_events.openHelpWindow()",
    "(document:keydown.f)": "_events.enterFullScreen()",
  },
})
export class AppComponent implements OnInit, AfterViewInit {
  private _initialMasterVolume = 50;
  private _activeWindow: AppWindowRef | null = null;
  private _openedWindows: AppWindowRef[] = [];
  private _registeredWindows: AppWindow[] = [
    { id: "help", component: HelpWindowComponent },
    { id: "settings", component: SettingsWindowComponent },
  ];

  title = "Spaceship";
  currentScore!: number;
  bestScore!: number;
  currentGameState = GameService.GameState.Menu;
  isBestScore = false;
  isPaused = false;

  constructor(
    private View: ViewComputingService,
    private Game: GameService,
    private Router: Router,
    private Route: ActivatedRoute,
    private Factory: ComponentFactoryResolver,
    private ViewRef: ViewContainerRef,
    private WdService: WindowsService
  ) {
    document.body.style.fontSize = this.View.fontSize + "px";
  }

  private readonly _events = {
    onButtonClick: (event: MouseEvent) => {
      const target = <HTMLElement>event.target;

      if (
        target.tagName.toLowerCase() === "button" ||
        target.parentElement?.tagName.toLowerCase() === "button"
      )
        this.Game.playSound("click-1");
    },

    trackEscPress: (e: KeyboardEvent) => {
      e.preventDefault();
    },

    openHelpWindow: () => {
      this.WdService.open("help");
    },

    enterFullScreen: () => {
      this.Game.toggleFullscreen();
    },
  };

  ngOnInit() {
    this._registeredWindows.forEach((wd) => {
      this.WdService.registerWindow(wd);
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

    this.Game.set.masterVolume(this._initialMasterVolume);
  }

  ngAfterViewInit() {
    if (this.Route.snapshot.url.toString() !== "/menu")
      this.Router.navigate(["/menu"]);

    this.WdService.OpenWindow.subscribe((wd) => {
      const factory = this.Factory.resolveComponentFactory(wd.component);
      const ref = this.ViewRef.createComponent(factory);
      const wnd: AppWindowRef = { ...wd, ref };

      this._openedWindows.push(wnd);
      this._activeWindow = wnd;
    });

    this.WdService.CloseWindow.subscribe((wd) => {
      this._openedWindows.forEach((owd, i) => {
        if (wd.id === owd.id) {
          owd.ref.destroy();
          this._openedWindows.splice(i, 1);

          this._activeWindow = this._openedWindows.length
            ? this._openedWindows[this._openedWindows.length - 1]
            : null;
        }
      });
    });
  }
}
