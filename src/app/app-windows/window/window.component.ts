import { Component, Input, OnInit } from "@angular/core";
import { WindowsService } from "../../services/windows.service";

@Component({
  selector: "app-window",
  templateUrl: "./window.component.html",
  styleUrls: ["./window.component.scss"],
  host: {
    "(document:keydown.escape)": "close()",
  }
})
export class WindowComponent implements OnInit {
  @Input("window-title") title!: string;
  @Input("window-id") id!: string;

  constructor(private WinService: WindowsService) {}

  close() {
    this.WinService.close(this.id);
  }

  ngOnInit() {}
}
