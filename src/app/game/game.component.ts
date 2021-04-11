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
} from "../services/game.service";
import { ViewComputingService } from "../services/viewComputing.service";
import { fromEvent, Subscription } from "rxjs";

@Component({
  selector: "app-game",
  templateUrl: "./game.component.html",
  styleUrls: ["./game.component.scss"],
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
      this._moveAsteroid(obj, asteroid);
    }, 50);
  }

  private _moveAsteroid(obj: HTMLDivElement, asteroid: Asteroid) {
    obj.style.top = asteroid.finalY + "px";
    obj.style.left = 0 - asteroid.radius * 2 + "px";

    obj.ontransitionend = function transitionEnd(this: GameComponent) {
      this._removeAsteroid(obj);
    }.bind(this);
  }

  private _removeAsteroid(obj: HTMLDivElement) {
    this.Game.emitters.countAsteroid.emit(null);
    obj.remove();
  }

  endGame() {
    const asteroids = document.getElementsByClassName("asteroid");

    let len = asteroids.length;
    for (let i = 0; i < len; i++) {
      const obj = <HTMLDivElement>asteroids[i];
      obj.classList.add("no-transition");
      obj.style.top = getComputedStyle(obj).top;
      obj.style.left = getComputedStyle(obj).left;
    }

    this._keyDown.unsubscribe();
    this._keyUp.unsubscribe();
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
    
    this._shipRadius = parseFloat(getComputedStyle(this._shipElement).height) / 2;

    this.Game.set
      .ship({
        element: this._shipElement,
        pos: this._shipPosition,
        speed: 50,
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
