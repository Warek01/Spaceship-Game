import { Component, HostBinding, HostListener, OnInit } from "@angular/core";
import { WindowsService } from "../services/windows.service";

@Component({
  selector: "app-help-window",
  templateUrl: "./help-window.component.html",
  styleUrls: ["./help-window.component.scss"],
})
export class HelpWindowComponent implements OnInit {
  title = "Help";

  @HostListener("document:keydown.escape") onEscPress() {
    this.close();
  }

  constructor(private WinService: WindowsService) {}

  close() {
    this.WinService.close("help");
  }

  ngOnInit() {}
}
