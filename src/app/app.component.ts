import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  OnInit,
  Type,
  ViewContainerRef,
  ViewEncapsulation,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GameService, GameState, PopupWindow } from "./services/game.service";
import { ViewComputingService } from "./services/viewComputing.service";
import {
  WindowsService,
  AppWindow,
  AppWindowRef,
} from "./services/windows.service";
import { HelpWindowComponent } from "./app-windows/help/help.component";

import "./global";
import { SettingsWindowComponent } from "./app-windows/settings/settings.component";
import { PopupComponent } from "./popup/popup.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  encapsulation: ViewEncapsulation.Emulated,
  host: {
    "(window:click)": "_events.onButtonClick($event)",
    "(window:keydown.escape)": "_events.trackEscPress($event)",
    "(window:keydown.h)": "_events.openHelpWindow()",
    "(window:keydown.f)": "_events.enterFullScreen()",
    "(window:keydown.alt.shift.d)": "_events.toggleDebugMode()",
  },
})
export class AppComponent implements OnInit, AfterViewInit {
  private _activeWindow: AppWindowRef | null = null;
  private _openedWindows: AppWindowRef[] = [];
  private _registeredWindows: AppWindow[] = [
    { id: "help", component: HelpWindowComponent },
    { id: "settings", component: SettingsWindowComponent },
  ];

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

    toggleDebugMode: () => {
      GameService.GAME_MODE = !this.Game.isDebug() ? "debug" : "release";

      this.Game.save("debug-mode", this.Game.isDebug());
      this.Game.reload();
    },
  };

  private _existentPopup: ComponentRef<unknown> | null = null;
  createPopup(popup: PopupWindow) {
    if (this._existentPopup) this._existentPopup.destroy();

    const ref = (this._existentPopup = this._createComponent(PopupComponent));
    const input = <PopupWindow>ref.instance;

    input.duration = popup.duration;
    input.text = popup.text;
    ref.changeDetectorRef.detectChanges();

    setTimeout(() => {
      ref.destroy();
    }, popup.duration + GameService.config.popupFade);
  }

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

    this.Game.emitters.popup.subscribe((popup: PopupWindow) => {
      this.createPopup(popup);
    });
  }

  private _createComponent(component: Type<unknown>): ComponentRef<unknown> {
    const factory = this.Factory.resolveComponentFactory(component);
    const ref = this.ViewRef.createComponent(factory);
    return ref;
  }

  ngAfterViewInit() {
    if (this.Route.snapshot.url.toString() !== "/menu")
      this.Router.navigate(["/menu"]);

    this.WdService.OpenWindow.subscribe((wd) => {
      const ref = this._createComponent(wd.component);
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
