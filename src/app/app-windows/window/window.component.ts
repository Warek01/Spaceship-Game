import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ViewComputingService } from "src/app/services/viewComputing.service";
import { WindowsService } from "../../services/windows.service";

@Component({
  selector: "app-window",
  templateUrl: "./window.component.html",
  styleUrls: ["./window.component.scss"],
  host: {
    "(document:keydown.escape)": "close()",
  },
})
export class WindowComponent implements OnInit {
  readonly options = {
    isExtended: false,
    width: "60%",
    height: "80%",
    initialWidth: "60%",
    initialHeight: "80%",
    top: "0",
    left: "0",
  };

  @Input("window-title") title!: string;
  @Input("window-id") id!: string;
  @Output("on-extend") Extend = new EventEmitter<null>();
  @Output("on-shrink") Shrink = new EventEmitter<null>();

  constructor(
    private WinService: WindowsService,
    private View: ViewComputingService
  ) {}

  close() {
    this.WinService.close(this.id);
  }

  extend() {
    this.Extend.emit(null);
    this.options.isExtended = true;
    this.options.width = this.View.availWidth + "px";
    this.options.height = this.View.availHeight + "px";
    this.options.top = this.View.headerHeight / 2 + "px";
  }

  shrink() {
    this.Shrink.emit(null);
    this.options.isExtended = false;
    this.options.width = this.options.initialWidth;
    this.options.height = this.options.initialHeight;
    this.options.top = "0";
  }

  ngOnInit() {}
}
