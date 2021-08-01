import { Component, OnInit } from "@angular/core";
import {
  GameService,
  GameConfigObject,
  Interval,
} from "src/app/services/game.service";

@Component({
  selector: "app-settings-window",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"],
})
export class SettingsWindowComponent implements OnInit {
  title = "Settings";
  soundIsActive!: boolean;
  volume!: number;
  defaultVolume = GameService.config.sound.initialVolumeValue;

  constructor(private Game: GameService) {
    this.soundIsActive = !Game.isSoundDisabled;
    this.volume = this.soundIsActive
      ? GameService.config.sound.masterVolume
      : 0;
  }

  switchSound() {
    this.soundIsActive = !this.soundIsActive;
    this.soundIsActive && this.Game.enableSound();

    if (this.soundIsActive) this.animateRange(0, this.defaultVolume);
    else this.animateRange(this.defaultVolume, 0);
  }

  animateRange(from: number, to: number) {
    let timerId: Interval;
    const interval = Math.round(300 / from - to);
    let current = from;

    timerId = setInterval(() => {
      if (current === to) {
        this.volume = current;
        return clearInterval(timerId);
      }
      if (from < to) this.volume = current++;
      else if (from > to) this.volume = current--;
    }, interval);
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

  ngOnInit() {
    this.Game.emitters.sound.subscribe((state) => {
      if (state !== this.soundIsActive) {
        this.switchSound();
        // this.Game.set.masterVolume(this.volume);
      }
    });
  }
}
