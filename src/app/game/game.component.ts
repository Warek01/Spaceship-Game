import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GameService, Asteroid } from "../services/game.service";
import { SizingService } from "../services/sizing.service";
import $ from "jquery";

@Component({
  selector: "app-game",
  templateUrl: "./game.component.html",
  styleUrls: ["./game.component.scss"],
})
export class GameComponent implements OnInit {
  asteroids = new Map<number, Asteroid>();
  height!: string;

  constructor(
    private Router: Router,
    private Sizing: SizingService,
    public Game: GameService
  ) {
    this.height = Sizing.availHeight + "px";
  }

  private renderAsteroid(asteroid: Asteroid) {
    const obj = $(document.createElement("div"));

    obj
      .css({
        top: asteroid.initialY,
        left: this.Sizing.availWidth - 50,
        height: asteroid.radius,
        width: asteroid.radius,
        backgroundImage: `url(../../assets/img/${asteroid.texture})`,
        transitionDuration: this.Sizing.availWidth / asteroid.velocity + "s"
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
    const obj = asteroidObject;

    obj.css({
      top: asteroid.finalY,
      left: 0,
    });

    obj.on("transitionend", (e) => {
      this.removeAsteroid(obj);
    });
  }

  private removeAsteroid(asteroidObject: JQuery<HTMLDivElement>) {
    asteroidObject.remove();
  }

  ngOnInit() {
    this.Game.Asteroid.subscribe((asteroid) => {
      this.renderAsteroid(asteroid);
    });

    $(window).blur((e) => {});
  }
}
