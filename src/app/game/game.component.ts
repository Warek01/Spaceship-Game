import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { GameService, Asteroid, Position } from "../services/game.service";
import { ViewComputingService } from "../services/viewComputing.service";
import { fromEvent, Subscription } from "rxjs";

@Component({
  selector: "app-game",
  templateUrl: "./game.component.html",
  styleUrls: ["./game.component.scss"],
  host: {
    "(window:keydown.F1)": "_events.nextShip($event)",
    "(window:keydown.F2)": "_events.kill($event)",
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

  statusWd = {
    opacity: 1,
    width: 300,
    height: 200,
  };
  asteroids = new Map<number, Asteroid>();
  height!: string;
  shipIsHidden = false;
  shipHp = 3;
  shipMaxHp = 3;

  @Input() difficulty!: GameService.Difficulty;
  @Input() shipTexture!: string;

  constructor(private View: ViewComputingService, public Game: GameService) {
    this.height = View.availHeight + "px";
  }

  private readonly _events = {
    kill: (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.Game.endGame(0);
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
      GameService.TransitionType[asteroid.rotation!.type]
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

  private _nextShip(event: KeyboardEvent) {
    // Has to change ship texture during gameplay on F1 press
    event.preventDefault();
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

    this.Game.emitters.shipMove.subscribe((move) => {
      if (
        (move.direction === "down" &&
          move.from <= this._statusWdPos.y - this.Game.shipRadius * 2 &&
          move.to >= this._statusWdPos.y - this.Game.shipRadius * 2 &&
          this.Game.ship!.pos.x <= this._statusWdPos.x + this.statusWd.width) ||
        (move.direction === "left" &&
          move.from >= this._statusWdPos.x + this.statusWd.width &&
          move.to <= this._statusWdPos.x + this.statusWd.width &&
          this.Game.ship!.pos.y >=
            this._statusWdPos.y - this.Game.shipRadius * 2)
      )
        this.statusWd.opacity = 0.25;
      else if (
        (move.direction === "up" &&
          move.from >= this._statusWdPos.y - this.Game.shipRadius * 2 &&
          move.to <= this._statusWdPos.y - this.Game.shipRadius * 2) ||
        (move.direction === "right" &&
          move.from <= this._statusWdPos.x + this.statusWd.width &&
          move.to >= this._statusWdPos.x + this.statusWd.width)
      )
        this.statusWd.opacity = 1;
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

  ngOnDestroy() {}
}
