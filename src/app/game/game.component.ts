import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { Router } from "@angular/router";
import {
  GameService,
  Asteroid,
  Position,
  Difficulty,
  TransitionType,
} from "../services/game.service";
import { ViewComputingService } from "../services/viewComputing.service";
import { fromEvent, Subscription } from "rxjs";

@Component({
  selector: "app-game",
  templateUrl: "./game.component.html",
  styleUrls: ["./game.component.scss"],
  host: {
    "(window:keydown.F1)": "_nextShip($event)",
  },
})
export class GameComponent implements OnInit, OnDestroy, AfterViewInit {
  private _shipElement!: HTMLDivElement;
  private _shipPosition!: Position;
  private _shipRadius = 20;
  private _keyDown!: Subscription;
  private _keyUp!: Subscription;
  private _gameElement!: HTMLDivElement;

  asteroids = new Map<number, Asteroid>();
  height!: string;

  @Input() difficulty!: Difficulty;
  @Input() shipTexture!: string;

  constructor(
    private Router: Router,
    private View: ViewComputingService,
    public Game: GameService
  ) {
    this.height = View.availHeight + "px";

    this.Game.launch();
  }

  private _renderAsteroid(asteroid: Asteroid) {
    const obj = document.createElement("div");

    obj.style.cssText = `
      top: ${asteroid.initialY}px;
      left: ${this.View.availWidth - 50}px;
      height: ${asteroid.radius}px;
      width: ${asteroid.radius}px;
      background-image: url(../../assets/img/${asteroid.texture});
      transition-duration: ${this.View.availWidth / asteroid.velocity}s;
    `;

    obj.className = "asteroid";
    this._gameElement!.append(obj);

    setTimeout(() => {
      asteroid.rotation && this._rotateAsteroid(obj, asteroid);
      this._moveAsteroid(obj, asteroid);
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

    this._keyDown.unsubscribe();
    this._keyUp.unsubscribe();
  }

  private _nextShip(event: KeyboardEvent) {
    // Has to change ship texture during gameplay on F1 press
    event.preventDefault();
    alert();
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this._gameElement = <HTMLDivElement>document.getElementById("game");
    this._shipElement = <HTMLDivElement>document.getElementById("ship");

    const { left, top } = this._shipElement.getBoundingClientRect();

    this._shipPosition = {
      x: left,
      y: top,
    };

    this._shipRadius = parseInt(getComputedStyle(this._shipElement).height) / 2;

    this.Game.set
      .ship({
        element: this._shipElement,
        pos: this._shipPosition,
        speed: this.View.availHeight / 25,
      })
      .asteroidRadius(40)
      .asteroidSpeed(500, 0)
      .shipPosition({
        x: 0,
        y: this.View.availHeight / 2 - this._shipRadius,
      });

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
  }

  ngOnDestroy() {}
}
