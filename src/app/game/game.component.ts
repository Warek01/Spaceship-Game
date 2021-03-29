import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GameService } from "../services/game.service";

@Component({
  selector: "app-game",
  templateUrl: "./game.component.html",
  styleUrls: ["./game.component.scss"],
})
export class GameComponent implements OnInit {
  constructor(public Game: GameService, private Router: Router) {}

  ngOnInit() {}
}
