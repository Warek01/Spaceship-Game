import { Component, OnInit } from "@angular/core";
import { WindowsService } from "../../services/windows.service";

@Component({
  selector: "app-help-window",
  templateUrl: "./help.component.html",
  styleUrls: ["./help.component.scss"],
})
export class HelpWindowComponent implements OnInit {
  title = "Help";

  constructor(private WinService: WindowsService) {}

  ngOnInit() {}
}
