import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { GameService } from "../services/game.service";

@Component({
  selector: "app-popup",
  templateUrl: "./popup.component.html",
  styleUrls: ["./popup.component.scss"],
})
export class PopupComponent implements OnInit, OnDestroy {
  @Input() dataText!: string;
  @Input() duration!: number;
  createdOn!: number;
  hide = false;

  constructor() {
    this.createdOn = Date.now();
  }

  ngOnDestroy() {
    if (GameService.GAME_MODE === "debug") {
      const endedOn = Date.now();
      console.log(`Popup lasted ${(endedOn - this.createdOn) / 1000} seconds`);
    }
  }

  ngOnInit() {
    setTimeout(() => {
      this.hide = true;
    }, this.duration);
  }
}
