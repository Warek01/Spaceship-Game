import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-settings-window",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"],
})
export class SettingsWindowComponent implements OnInit {
  title = "Settings";
  
  constructor() {}

  ngOnInit(): void {}
}
