import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";

import {
  GameService,
  Asteroid,
  Position,
  TransitionType,
  Difficulty,
  GameState,
} from "../services/game.service";

import { ViewComputingService } from "../services/viewComputing.service";
import { fromEvent, Subscription } from "rxjs";

@Component({
  selector: "app-game",
  templateUrl: "./game.component.html",
  styleUrls: ["./game.component.scss"],
  host: {
    "(window:keydown.F1)": "_events.kill($event)",
    "(window:keydown.F2)":
      GameService.GAME_MODE === "debug"
        ? "_events.nextShip($event)"
        : "_events.PREVENT($event)",
    "(window:keydown.F3)":
      GameService.GAME_MODE === "debug"
        ? "_events.endGame($event)"
        : "_events.PREVENT($event)",
    "(window:keydown.F4)":
      GameService.GAME_MODE === "debug"
        ? "_events.shipImmune($event)"
        : "_events.PREVENT($event)",
  },
})
export class GameComponent implements OnInit, OnDestroy, AfterViewInit {
  private _shipElement!: HTMLDivElement;
  private _shipPosition!: Position;
  private _shipRadius = 20;
  private _keyDown!: Subscription;
  private _keyUp!: Subscription;
  private _gameElement!: HTMLDivElement;
  private _statusWdPos!: DOMRect;
  private _shipImtCd = 250;
  private _shipImtSwpTmp!: number;

  statusWd = {
    width: 300,
    height: 200,
    margin: 15,
    hidden: false,
    class: "",
    transparentOpacity: 0.25,
    defaultOpacity: 1,
    opacity: 1,
  };

  asteroids = new Map<number, Asteroid>();
  height!: string;
  shipIsHidden = false;
  shipHp = 3;
  shipMaxHp = 3;

  @Input() difficulty!: Difficulty;
  @Input() shipTexture!: string;

  constructor(private View: ViewComputingService, public Game: GameService) {
    this.height = View.availHeight + "px";
  }

  private readonly _events = {
    PREVENT(e: Event) {
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    endGame: (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.Game.endGame(0);
      this.Game.navTo(GameState.Menu);
    },
    kill: (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.Game.endGame(this.Game.getConfig().endGameDelay);
    },
    nextShip: (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      /*  */
    },
    shipImmune: (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (
        this._shipImtSwpTmp &&
        Date.now() - this._shipImtSwpTmp < this._shipImtCd
      )
        return;
      else this._shipImtSwpTmp = Date.now();

      this.Game.ship!.immune = !this.Game.ship!.immune;

      this.Game.createPopup({
        duration: 3000,
        text: `Immunity: ${this.Game.ship!.immune}`,
      });
    },
  };

  private _renderAsteroid(asteroid: Asteroid) {
    const obj = document.createElement("div");

    obj.style.cssText = `
      top: ${asteroid.initialY}px;
      left: ${this.View.availWidth + 50}px;
      height: ${asteroid.radius}px;
      width: ${asteroid.radius}px;
      background-image: url(../../assets/img/${asteroid.texture});
      transition-duration: ${this.View.availWidth / asteroid.velocity}s;
    `;

    obj.className = "asteroid";
    this._gameElement!.append(obj);

    setTimeout(() => {
      this._moveAsteroid(obj, asteroid);
      if (asteroid.rotation) this._rotateAsteroid(obj, asteroid);
    }, 50);
  }

  private _moveAsteroid(obj: HTMLDivElement, asteroid: Asteroid) {
    obj.style.top = asteroid.finalY + "px";
    obj.style.left = 0 - asteroid.radius * 2 + "px";

    obj.ontransitionend = function transitionEnd(this: GameComponent) {
      if (parseInt(getComputedStyle(obj).left) <= 0) this._removeAsteroid(obj);
    }.bind(this);
  }

  private _rotateAsteroid(obj: HTMLDivElement, asteroid: Asteroid) {
    obj.style.transform = `rotateZ(${asteroid.rotation!.degrees}deg)`;
    obj.style.transition = `tranform ${asteroid.rotation?.transitionSpeed} ${
      TransitionType[asteroid.rotation!.type]
    }`;
  }

  private _removeAsteroid(obj: HTMLDivElement) {
    this.Game.emitters.countAsteroid.emit(null);
    obj.remove();
  }

  endGame() {
    this._shipElement.style.top = getComputedStyle(this._shipElement).top;

    const asteroids = document.getElementsByClassName("asteroid");

    let len = asteroids.length;
    for (let i = 0; i < len; i++) {
      const obj = <HTMLDivElement>asteroids[i];
      const { top, left, transform } = getComputedStyle(obj);

      obj.classList.add("no-transition");
      obj.style.top = top;
      obj.style.left = left;
      obj.style.transform = transform;
    }

    this.shipBlink(3000);

    this._keyDown.unsubscribe();
    this._keyUp.unsubscribe();
  }

  shipBlink(duration: number) {
    let timePassed = 0;
    const intervalId = setInterval(() => {
      this.shipIsHidden = !this.shipIsHidden;
      timePassed += duration / 20;

      if (timePassed >= duration) {
        clearInterval(intervalId);
        this.shipIsHidden = false;
      }
    }, duration / 20);
  }

  ngOnInit() {
    this._keyDown = fromEvent<KeyboardEvent>(window, "keydown").subscribe(
      this.Game.track.keyDown(this)
    );

    this._keyUp = fromEvent<KeyboardEvent>(window, "keyup").subscribe(
      this.Game.track.keyUp(this)
    );

    this.Game.emitters.asteroid.subscribe((asteroid) => {
      this._renderAsteroid(asteroid);
    });

    this.Game.emitters.endGame.subscribe((NULL) => {
      this.endGame();
    });

    this.Game.emitters.position.subscribe((pos) => {
      if (
        pos.x <= this.statusWd.width + this.statusWd.margin &&
        pos.y >=
          this.Game.gameField.height() -
            (this.statusWd.height +
              this.statusWd.margin +
              this.Game.shipRadius * 2)
      )
        this.statusWd.opacity = this.statusWd.transparentOpacity;
      else this.statusWd.opacity = this.statusWd.defaultOpacity;
    });

    this.Game.emitters.shipBlink.subscribe((duration) => {
      this.shipBlink(duration);
    });

    this.Game.emitters.hitPoints.subscribe((val) => {
      this.shipHp = val;
    });

    this.Game.emitters.maxHitPoints.subscribe((val) => {
      this.shipMaxHp = val;
    });
  }

  ngAfterViewInit() {
    this._gameElement = <HTMLDivElement>document.getElementById("game");
    this._shipElement = <HTMLDivElement>document.getElementById("ship");
    this._statusWdPos = document
      .getElementById("status-window")!
      .getBoundingClientRect();

    const { x, y } = this._shipElement.getBoundingClientRect();

    this._shipPosition = { x, y };
    this._shipRadius = parseInt(getComputedStyle(this._shipElement).height) / 2;

    this.Game.set
      .ship({
        element: this._shipElement,
        pos: this._shipPosition,
        speed: this.View.availHeight / 25,
      })
      .asteroidRadius(40)
      .asteroidSpeed(450, 50)
      .shipPosition({
        x: 150,
        y: this.View.availHeight / 2 - this._shipRadius,
      });

    this.Game.launch();
  }

  ngOnDestroy() {
    this._keyUp.unsubscribe();
    this._keyDown.unsubscribe();
  }
}
