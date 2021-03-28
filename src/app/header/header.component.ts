import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit {
  attributes = {
    hidden: false,
    height: 50,
    bg: "#00000030",
    color: "#333"
  };

  @Input("score") currentScore!: number;
  @Input("best-score") bestScore!: number;
  @Input("app-title") title!: string;

  constructor() {}

  ngOnInit(): void {}
}
