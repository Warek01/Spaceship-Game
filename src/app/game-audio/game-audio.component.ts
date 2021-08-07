import { Component, OnInit } from "@angular/core";
import { SoundNotFoundError } from "../classes/Errors";
import { GameService } from "../services/game.service";

@Component({
  selector: "game-audio",
  templateUrl: "./game-audio.component.html",
  styleUrls: ["./game-audio.component.scss"],
})
export class GameAudioComponent implements OnInit {
  /** Game sounds map */
  readonly sounds = new Map<SoundId, string>([
    ["explosion", "explosion_1.wav"],
    ["launch", "launch_1.wav"],
    ["click-1", "click_1.wav"],
    ["click-2", "click_2.wav"],
    ["shoot-1", "shoot_1.wav"],
    ["shoot-2", "shoot_2.wav"],
    ["shoot-3", "shoot_3.wav"],
    ["end-1", "end_1.wav"],
    ["end-2", "end_2.wav"],
    ["notification", "notification_1.wav"],
    ["regen", "health_recharge_1.wav"],
    ["item-pick-1", "item_pick_1.wav"],
    ["item-pick-2", "item_pick_2.wav"],
  ]);

  constructor(public Game: GameService) {}

  private _play(sound: GameSound) {
    if (!this.sounds.has(sound.id)) throw new SoundNotFoundError(sound.id);

    const element = document.getElementById(sound.id) as HTMLAudioElement;

    if (!element.paused) element.currentTime = 0;

    element.volume = sound.volume / 100;
    element.play();
  }

  ngOnInit() {
    this.Game.emitters.playSound.subscribe((sound) => {
      this._play(sound);
    });
  }
}

export type SoundId =
  | "click-1"
  | "click-2"
  | "launch"
  | "shoot-1"
  | "shoot-2"
  | "shoot-3"
  | "regen"
  | "notification"
  | "end-1"
  | "end-2"
  | "explosion"
  | "item-pick-1"
  | "item-pick-2";

export interface GameSound {
  id: SoundId;
  volume: number;
}
