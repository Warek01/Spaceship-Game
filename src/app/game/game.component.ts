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
import $ from "jquery";

@Component({
  selector: "app-game",
  templateUrl: "./game.component.html",
  styleUrls: ["./game.component.scss"],
})
export class GameComponent implements OnInit, OnDestroy, AfterViewInit {
  private _shipElement!: JQuery<HTMLDivElement>;
  private _shipPosition!: Position;
  private _shipRadius = 20;

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
    $(window)
      .keydown(this.Game.trackKeyDown(this))
      .keyup(this.Game.trackKeyUp(this));
  }

  private renderAsteroid(asteroid: Asteroid) {
    const obj = $(document.createElement("div"));

    obj
      .css({
        top: asteroid.initialY,
        left: this.View.availWidth - 50,
        height: asteroid.radius,
        width: asteroid.radius,
        backgroundImage: `url(../../assets/img/${asteroid.texture})`,
        transitionDuration: this.View.availWidth / asteroid.velocity + "s",
      })
      .addClass("asteroid");

    $("#game").append(obj);

    setTimeout(() => {
      this.moveAsteroid(obj, asteroid);
    }, 50);
  }

  private moveAsteroid(
    asteroidObject: JQuery<HTMLDivElement>,
    asteroid: Asteroid
  ) {
    asteroidObject
      .css({
        top: asteroid.finalY,
        left: 0 - asteroid.radius * 2,
      })
      .on("transitionend", (e) => {
        this.removeAsteroid(asteroidObject);
      });
  }

  private removeAsteroid(asteroidObject: JQuery<HTMLDivElement>) {
    this.Game.CountAsteroid.emit(null);
    asteroidObject.remove();
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this._shipElement = $("#ship");
    this._shipPosition = {
      x: this._shipElement.offset()!.left,
      y: this._shipElement.offset()!.top,
    };
    this._shipRadius = parseFloat(this._shipElement.css("height")) / 2;

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

    this.Game.Asteroid.subscribe((asteroid) => {
      this.renderAsteroid(asteroid);
    });
  }

  ngOnDestroy() {
    $(window).off({
      keydown: this.Game.trackKeyDown(this),
      keyup: this.Game.trackKeyUp(this),
    });
  }
}
