import { Component, OnInit } from "@angular/core";
import { GameService } from "../services/game.service";

@Component({
  selector: "app-background",
  templateUrl: "./background.component.html",
  styleUrls: ["./background.component.scss"],
})
export class BackgroundComponent implements OnInit {
  private readonly _length!: number;
  readonly bgUrls: string[] = [];
  bgIndex = 1;

  constructor(public Game: GameService) {
    Game.textures.bg.forEach((url) => {
      this.bgUrls.push(Game.getTextureUrl(url));
    });

    this._length = this.bgUrls.length;
  }

  disableBgImg() {
    document.body.style.backgroundImage = "none";
  }

  private _next() {
    if (this.bgIndex < this._length) this.bgIndex++;
    else this.bgIndex = 1;
  }

  private _prev() {
    if (this.bgIndex > 1) this.bgIndex--;
    else this.bgIndex = this.bgUrls.length;
  }

  ngOnInit() {
    this.Game.emitters.nextBg.subscribe((val) => this._next());
    this.Game.emitters.prevBg.subscribe((val) => this._prev());

    /* De scos ultimul bg din localstorage */
  }
}