import { Component, OnInit } from "@angular/core";
import { GameService } from "../services/game.service";

@Component({
  selector: "app-background",
  templateUrl: "./background.component.html",
  styleUrls: ["./background.component.scss"],
})
export class BackgroundComponent implements OnInit {
  private readonly _backgroundUrls: string[] = [];
  private _bgIndex = 0;
  private _nextBgUrl: string | null = null;
  private _currentBgUrl!: string;
  private _timeout = 200;
  private _isLocked = false;

  loaderShown = false;
  mainShown = true;
  mainBgUrl!: string;
  loaderBgUrl!: string;

  constructor(private Game: GameService) {
    Game.textures.bg.forEach((url, i) => {
      this._backgroundUrls.push(url);
    });

    this.mainBgUrl = this._currentBgUrl = this._getBgUrl(
      this._backgroundUrls[0]
    );
    document.body.style.backgroundImage = "none";
  }

  private _getBgUrl(src: string): string {
    return `url(${this.Game.getTextureUrl(src)})`;
  }

  private _next() {
    if (this._isLocked) return;
    this._isLocked = true;
    if (this._bgIndex < this._backgroundUrls.length - 1)
      this._nextBgUrl = this._getBgUrl(this._backgroundUrls[++this._bgIndex]);
    else
      this._nextBgUrl = this._getBgUrl(
        this._backgroundUrls[(this._bgIndex = 0)]
      );

    if (!this.loaderShown) {
      this.loaderBgUrl = this._nextBgUrl;
      this.loaderShown = true;
      setTimeout(() => {
        this.mainShown = false;
        this._isLocked = false;
      }, this._timeout);
    } else {
      this.mainBgUrl = this._nextBgUrl;
      setTimeout(() => {
        this.loaderShown = false;
        this._isLocked = false;
      }, this._timeout);
      this.mainShown = true;
    }
    this._currentBgUrl = this._nextBgUrl;
    this._nextBgUrl = null;
  }

  private _prev() {
    if (this._isLocked) return;
    this._isLocked = true;

    if (this._bgIndex === 0) {
      this._nextBgUrl = this._getBgUrl(
        this._backgroundUrls[(this._bgIndex = this._backgroundUrls.length - 1)]
      );
    } else
      this._nextBgUrl = this._getBgUrl(this._backgroundUrls[--this._bgIndex]);

    if (!this.loaderShown) {
      this.loaderBgUrl = this._nextBgUrl;
      this.loaderShown = true;
      setTimeout(() => {
        this.mainShown = false;
        this._isLocked = false;
      }, this._timeout);
    } else {
      this.mainBgUrl = this._nextBgUrl;
      setTimeout(() => {
        this.loaderShown = false;
        this._isLocked = false;
      }, this._timeout);
      this.mainShown = true;
    }
    this._currentBgUrl = this._nextBgUrl;
    this._nextBgUrl = null;
  }

  ngOnInit() {
    this.Game.NextBg.subscribe((val) => this._next());
    this.Game.PrevBg.subscribe((val) => this._prev());

    /* De scos ultimul bg din localstorage */
  }
}
