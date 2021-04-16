import { Component, OnInit } from "@angular/core";
import { GameService, Position } from "../services/game.service";

@Component({
  selector: "game-effects",
  templateUrl: "./effects.component.html",
  styleUrls: ["./effects.component.scss"],
})
export class EffectsComponent implements OnInit {
  explosions: Explosions = {
    urlArr: [],
    currentIndex: 0,
    pos: { x: 0, y: 0 },
  };

  constructor(private Game: GameService) {
    for (let i = 1; i <= 16; i++)
      this.explosions.urlArr.push(this._getExplosionUrl(i + ".png"));
  }

  explode(pos: Position, duration: number) {
    this.explosions.currentIndex = 1;
    console.log(pos);

    const delay = duration / 16;
    let timer: () => void,
      timerId = setTimeout(
        (timer = () => {
          this.explosions.pos = pos;

          if (this.explosions.currentIndex < 16) {
            this.explosions.currentIndex++;
            setTimeout(timer, delay);
          } else {
            this.explosions.pos = { x: 0, y: 0 };
            this.explosions.currentIndex = 0;
          }
        }),
        delay
      );
  }

  private _getExplosionUrl(src: string): string {
    return this.Game.imgUrl + "explosions/" + src;
  }

  ngOnInit() {
    this.Game.emitters.explosion.subscribe((obj) => {
      this.explode(obj.pos, obj.duration);
    });
  }
}

export interface Explosions {
  urlArr: string[];
  currentIndex: number;
  pos: Position;
}
