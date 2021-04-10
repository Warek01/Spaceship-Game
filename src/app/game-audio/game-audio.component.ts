import { Component, OnInit } from "@angular/core";
import { SoundNotFoundError } from "../classes/Errors";
import { GameService, GameSound } from "../services/game.service";

@Component({
  selector: "app-game-audio",
  templateUrl: "./game-audio.component.html",
  styleUrls: ["./game-audio.component.scss"],
})
export class GameAudioComponent implements OnInit {
  constructor(public Game: GameService) {}

  private _play(sound: GameSound) {
    if (!this.Game.sounds.has(sound.id)) throw new SoundNotFoundError(sound.id);
    
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
