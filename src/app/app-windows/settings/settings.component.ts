import { Component, OnInit } from "@angular/core";
import { GameService, GameConfigObject } from "src/app/services/game.service";

@Component({
  selector: "app-settings-window",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"],
})
export class SettingsWindowComponent implements OnInit {
  title = "Settings";
  soundIsActive!: boolean;
  volume!: number;
  config!: GameConfigObject;

  constructor(private Game: GameService) {
    this.config = Game.getConfig();

    this.soundIsActive = !Game.isSoundDisabled;
    this.volume = this.config.sound.masterVolume;
  }

  switchSound(fromSwitch?: boolean) {
    let timer: () => void;
    const interval = 300 / this.volume;

    this.soundIsActive = !this.soundIsActive;

    if (this.soundIsActive) {
      this.Game.enableSound();
      if (fromSwitch)
        setTimeout(
          (timer = () => {
            if (++this.volume < 50) setTimeout(timer, interval);
          }),
          interval
        );
    } else {
      this.Game.disableSound();
      if (fromSwitch)
        setTimeout(
          (timer = () => {
            if (--this.volume > 0) setTimeout(timer, interval);
          }),
          interval
        );
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

  resetGame(): void {
    this.Game.emitters.reset.emit(null);
  }

  ngOnInit() {}
}
