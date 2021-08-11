import {
  Component,
  ComponentFactoryResolver,
  OnInit,
  ViewContainerRef,
  ViewEncapsulation
} from "@angular/core";
import { GameService, Position } from "../services/game.service";
import { ViewComputingService } from "../services/viewComputing.service";

@Component({
  selector: "game-effects",
  templateUrl: "./effects.component.html",
  styleUrls: ["./effects.component.scss"],
  encapsulation: ViewEncapsulation.None
})
export class EffectsComponent implements OnInit {
  constructor(
    public Game: GameService,
    public View: ViewComputingService,
    private Factory: ComponentFactoryResolver,
    private ViewRef: ViewContainerRef
  ) {}

  explode(position: Position, duration: number) {
    const explosion = document.createElement("div");
    explosion.classList.add("explosion");

    const element = <HTMLDivElement>this.ViewRef.element.nativeElement;

    element.append(explosion);
    
    // const factory = this.Factory.resolveComponentFactory(ExplosionComponent);
    // const component = this.ViewRef.createComponent(factory);
    // const input = component.instance;

    // input.duration = duration;
    // input.position = position;
    // component.changeDetectorRef.detectChanges();

    // setTimeout(() => component.destroy(), duration);
  }

  ngOnInit() {
    this.Game.emitters.explosion.subscribe(({ position, duration }) =>
      this.explode(position, duration)
    );
  }
}
