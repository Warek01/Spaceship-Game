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
  GameState,
  PickupItem,
  RotationZ,
} from "../services/game.service";

import { ViewComputingService } from "../services/viewComputing.service";
import { fromEvent, Subscription } from "rxjs";
import { Difficulty, GameDifficulties } from "../Difficulties";

@Component({
  selector: "app-game",
  templateUrl: "./game.component.html",
  styleUrls: ["./game.component.scss"],
  host: {
    "(window:keydown.F1)": "_events.kill($event)",
    "(window:keydown.F2)": "_events.nextShip($event)",
    "(window:keydown.F3)": "_events.endGame($event)",
    "(window:keydown.F4)": "_events.shipImmune($event)",
  },
})
export class GameComponent implements OnInit, OnDestroy, AfterViewInit {
  private _shipElement!: HTMLDivElement;
  private _keyDown!: Subscription;
  private _keyUp!: Subscription;
  private _gameElement!: HTMLDivElement;
  private _shipImtCd = 250;
  private _shipImtSwpTmp!: number;
  private _asteroidObject!: HTMLDivElement;
  private _pickupObject!: HTMLDivElement;

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
  ammo!: number;
  maxAmmo!: number;
  hp!: number;
  maxHp!: number;

  @Input() difficulty!: Difficulty;
  @Input() shipTexture!: string;

  constructor(private View: ViewComputingService, public Game: GameService) {
    this.height = View.availHeight + "px";

    this._asteroidObject = document.createElement("div");
    this._asteroidObject.classList.add("entity", "asteroid");

    this._pickupObject = document.createElement("div");
    this._pickupObject.classList.add("entity", "pickup");

    if (GameService.GAME_MODE === "debug") {
      this._asteroidObject.classList.add("debug");
      this._pickupObject.classList.add("debug");
    }
  }
  
  private _isImmune = this.Game.getConfig().ship.immune;
  private readonly _events = {
    PREVENT(e: Event) {
      e.preventDefault();
      e.stopImmediatePropagation();
    },

    endGame: (e: KeyboardEvent) => {
      if (!this.Game.isDebug()) return;
      this._events.PREVENT(e);

      this.Game.endGame(0);
      this.Game.navTo(GameState.Menu);
    },

    kill: (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.Game.endGame(this.Game.getConfig().endGameDelay);
    },

    nextShip: (e: KeyboardEvent) => {
      this._events.PREVENT(e);
      if (!this.Game.isDebug()) return;
    },
    
    shipImmune: (e: KeyboardEvent) => {
      this._events.PREVENT(e);
      if (!this.Game.isDebug()) return;

      if (
        this._shipImtSwpTmp &&
        Date.now() - this._shipImtSwpTmp < this._shipImtCd
      )
        return;
      else this._shipImtSwpTmp = Date.now();

      this.Game.ship.immune = !this._isImmune;
      this._isImmune = !this._isImmune;

      this.Game.createPopup({
        duration: 3000,
        text: `Immunity: ${this._isImmune}`,
      });
    },
  };

  private _renderPickup(pickup: PickupItem) {
    const obj = <HTMLDivElement>this._pickupObject.cloneNode();

    obj.dataset.type = pickup.type;
    obj.style.cssText = `
      top: ${pickup.initialY}px;
      left: ${this.Game.gameField.width()}px;
      width: ${pickup.radius}px;
      height: ${pickup.radius}px;
      background-color: red;
      transition: all linear ${pickup.speed}ms;
    `;

    this._gameElement.append(obj);

    setTimeout(() => {
      this._moveObject(obj, { x: -pickup.radius, y: pickup.finalY });
    }, 50);

    obj.ontransitionend = function transitionEnd(this: GameComponent) {
      if (parseInt(getComputedStyle(obj).left) <= 0) obj.remove();
    }.bind(this);
  }

  private _renderAsteroid(asteroid: Asteroid) {
    const obj = <HTMLDivElement>this._asteroidObject.cloneNode();

    obj.style.cssText = `
      top: ${asteroid.initialY}px;
      left: ${this.View.availWidth + 50}px;
      height: ${asteroid.radius}px;
      width: ${asteroid.radius}px;
      background-image: url(../../assets/img/${asteroid.texture});
      transition-duration: ${this.View.availWidth / asteroid.velocity}s;
    `;

    this._gameElement.append(obj);

    setTimeout(() => {
      if (asteroid.rotation) this._rotateObject(obj, asteroid.rotation);

      this._moveObject(obj, { y: asteroid.finalY, x: -asteroid.radius * 2 });
    }, 50);

    obj.ontransitionend = function transitionEnd(this: GameComponent) {
      if (obj.offsetLeft <= 0) this._removeAsteroid(obj);
    }.bind(this);
  }

  private _moveObject(obj: HTMLDivElement, pos: Position) {
    obj.style.top = pos.y + "px";
    obj.style.left = pos.x + "px";
  }

  private _rotateObject(obj: HTMLDivElement, rotation: RotationZ) {
    obj.style.transform = `rotateZ(${rotation.degrees}deg)`;
    obj.style.transition = `tranform ${rotation.transitionSpeed} ${rotation.type}`;
  }

  private _removeAsteroid(obj: HTMLDivElement) {
    this.Game.emitters.countAsteroid.emit(null);
    obj.remove();
  }

  endGame() {
    const entities = document.getElementsByClassName("entity");

    for (let i = 0; i < entities.length; i++) {
      const obj = <HTMLDivElement>entities[i];
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
    const events = this.Game.emitters;

    this._keyDown = fromEvent<KeyboardEvent>(window, "keydown").subscribe(
      this.Game.track.keyDown(this)
    );

    this._keyUp = fromEvent<KeyboardEvent>(window, "keyup").subscribe(
      this.Game.track.keyUp(this)
    );

    events.asteroid.subscribe((asteroid) => this._renderAsteroid(asteroid));
    events.endGame.subscribe((NULL) => this.endGame());
    events.hitPoints.subscribe((val) => (this.hp = val));
    events.maxHitPoints.subscribe((val) => (this.maxHp = val));
    events.ammo.subscribe((val) => (this.ammo = val));
    events.maxAmmo.subscribe((val) => (this.maxAmmo = val));
    events.pickupGererated.subscribe((item) => this._renderPickup(item));
    events.shipBlink.subscribe((duration) => this.shipBlink(duration));

    events.position.subscribe((pos) => {
      if (
        pos.x <= this.statusWd.width + this.statusWd.margin &&
        pos.y >=
          this.Game.gameField.height() -
            (this.statusWd.height +
              this.statusWd.margin +
              this.Game.ship.size * 2)
      )
        this.statusWd.opacity = this.statusWd.transparentOpacity;
      else this.statusWd.opacity = this.statusWd.defaultOpacity;
    });
  }

  ngAfterViewInit() {
    this._gameElement = document.querySelector<HTMLDivElement>("#game")!;
    this._shipElement = document.querySelector<HTMLDivElement>("#ship")!;

    this.Game.setShipElement(this._shipElement);
    this.Game.launch(GameDifficulties.get(this.difficulty)!);

    setTimeout(() => {
      this.hp = this.Game.ship.hp;
      this.maxHp = this.Game.ship.maxHp;
      this.ammo = this.Game.ship.ammo;
      this.maxAmmo = this.Game.ship.maxAmmo;
    });
  }

  ngOnDestroy() {
    this._keyUp.unsubscribe();
    this._keyDown.unsubscribe();
  }
}
