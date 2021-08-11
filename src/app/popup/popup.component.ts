import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { GameService } from "../services/game.service";

@Component({
  selector: "app-popup",
  templateUrl: "./popup.component.html",
  styleUrls: ["./popup.component.scss"],
})
export class PopupComponent implements OnInit, OnDestroy {
  @Input() text!: string;
  @Input() duration!: number;
  createdOn!: number;
  hide = false;

  constructor() {}

  ngOnDestroy() {
    if (GameService.GAME_MODE === "debug") {
      const endedOn = Date.now();
      console.log(`Popup lasted ${(endedOn - this.createdOn) / 1000} seconds`);
    }
  }

  ngOnInit() {
    this.createdOn = Date.now();

    setTimeout(() => {
      this.hide = true;
    }, this.duration);
  }
}
