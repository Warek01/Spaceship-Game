import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { GameService, Interval, Position } from "src/app/services/game.service";

@Component({
  selector: "app-explosion",
  template: ` 
    <img 
      alt="" 
      class="explosion" 
      [src]="currentSrc" 
      [style.left]="position.x"
      [style.top]="position.y"
    /> 
    `,
  styles: [
    `
      .explosion {
        position: absolute:
        width: 300px;
        height: 300px;
        z-index: 100;
      }
    `,
  ],
})
export class ExplosionComponent implements OnInit, OnDestroy {
  @Input() position!: Position;
  @Input() duration!: number;

  URL!: string;
  current: number = 1;
  currentSrc!: string;
  start!: number;

  constructor(public Game: GameService) {
    this.URL = this.Game.IMG_URL + "explosions";
    this.currentSrc = this.getTexture(this.current);

    if (Game.isDebug()) {
      this.start = Date.now();
    }
  }

  ngOnInit() {
    const delay = Math.floor(this.duration / 16);

    const interval: Interval = setInterval(() => {
      if (this.current === 16) return clearInterval(interval);
      this.currentSrc = this.getTexture(++this.current);
    }, delay);
  }

  ngOnDestroy() {
    if (this.Game.isDebug()) {
      const end = Date.now();
      console.log("Explosion lasted", Math.fround(end - this.start));
    }
  }

  getTexture(index: number): string {
    return this.URL + `/${index.toString()}.png`;
  }
}
