import { Component, OnInit } from "@angular/core";
import { GameService } from "src/app/services/game.service";

@Component({
  selector: "app-settings-window",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"],
})
export class SettingsWindowComponent implements OnInit {
  title = "Settings";
  soundIsActive!: boolean;
  volume!: number;

  constructor(private Game: GameService) {
    this.soundIsActive = Game.settings.sound.isActive;
    this.volume = Game.settings.sound.masterVolume;
  }

  switchSound() {
    this.soundIsActive = !this.soundIsActive;
    if (this.soundIsActive) {
      this.Game.enableSound();
      this.volume = 50;
    } else {
      this.Game.disableSound();
      this.volume = 0;
    }
  }

  changeVolume(value: number) {
    if (
      (value === 0 && this.soundIsActive) ||
      (value > 0 && !this.soundIsActive)
    )
      this.switchSound();

    this.Game.set.masterVolume(value);
    this.playSample();
  }

  playSample() {
    this.Game.playSound("notification");
  }

  int(str: string | null): number {
    return str ? parseInt(str) : 0;
  }

  parseVolume(num: string): string {
    return parseInt(num) > 100 ? "100" : parseInt(num) < 0 ? "0" : num;
  }

  ngOnInit() {}
}
