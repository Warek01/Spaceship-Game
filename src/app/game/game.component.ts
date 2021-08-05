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
  PickupItemId,
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
    "(window:keydown.F2)":
      GameService.GAME_MODE === "debug"
        ? "_events.nextShip($event)"
        : "_events.PREVENT($event)",
    "(window:keydown.F3)":
      GameService.GAME_MODE === "debug"
        ? "_events.endGame($event)"
        : "_events.PREVENT($event)",
    "(window:keydown.F4)":
      GameService.GAME_MODE === "debug"
        ? "_events.shipImmune($event)"
        : "_events.PREVENT($event)",
  },
})
export class GameComponent implements OnInit, OnDestroy, AfterViewInit {
  private _shipElement!: HTMLDivElement;
  private _keyDown!: Subscription;
  private _keyUp!: Subscription;
  private _gameElement!: HTMLDivElement;
  private _statusWdPos!: DOMRect;
  private _shipImtCd = 250;
  private _shipImtSwpTmp!: number;

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
  hp!: number;
  maxHp!: number;

  @Input() difficulty!: Difficulty;
  @Input() shipTexture!: string;

  constructor(private View: ViewComputingService, public Game: GameService) {
    this.height = View.availHeight + "px";
  }

  private readonly _events = {
    PREVENT(e: Event) {
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    endGame: (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.Game.endGame(0);
      this.Game.navTo(GameState.Menu);
    },
    kill: (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.Game.endGame(this.Game.getConfig().endGameDelay);
    },
    nextShip: (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    shipImmune: (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (
        this._shipImtSwpTmp &&
        Date.now() - this._shipImtSwpTmp < this._shipImtCd
      )
        return;
      else this._shipImtSwpTmp = Date.now();

      this.Game.ship!.immune = !this.Game.ship.immune;

      this.Game.createPopup({
        duration: 3000,
        text: `Immunity: ${this.Game.ship.immune}`,
      });
    },
  };

  private _renderPickup(pickup: PickupItem) {
    const obj = document.createElement("div");

    obj.classList.add("pickup", "entity", pickup.type);

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
    const obj = document.createElement("div");

    obj.style.cssText = `
      top: ${asteroid.initialY}px;
      left: ${this.View.availWidth + 50}px;
      height: ${asteroid.radius}px;
      width: ${asteroid.radius}px;
      background-image: url(../../assets/img/${asteroid.texture});
      transition-duration: ${this.View.availWidth / asteroid.velocity}s;
    `;

    obj.classList.add("asteroid", "entity");
    this._gameElement.append(obj);

    setTimeout(() => {
      if (asteroid.rotation) this._rotateObject(obj, asteroid.rotation);

      this._moveObject(obj, { y: asteroid.finalY, x: -asteroid.radius * 2 });
    }, 50);

    obj.ontransitionend = function transitionEnd(this: GameComponent) {
      if (parseInt(getComputedStyle(obj).left) <= 0) this._removeAsteroid(obj);
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
    events.pickupGererated.subscribe((item) => this._renderPickup(item));
    events.shipBlink.subscribe((duration) => this.shipBlink(duration));

    events.position.subscribe((pos) => {
      if (
        pos.x <= this.statusWd.width + this.statusWd.margin &&
        pos.y >=
          this.Game.gameField.height() -
            (this.statusWd.height + this.statusWd.margin + this.Game.ship.size)
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
    });
  }

  ngOnDestroy() {
    this._keyUp.unsubscribe();
    this._keyDown.unsubscribe();
  }
}
