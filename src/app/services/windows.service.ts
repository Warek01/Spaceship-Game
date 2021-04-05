import { ComponentRef, EventEmitter, Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class WindowsService {
  private _registeredWindows: AppWindow[] = [];
  private _openedWindows: AppWindow[] = [];

  OpenWindow = new EventEmitter<AppWindow>();
  CloseWindow = new EventEmitter<AppWindow>();

  constructor() {}

  registerWindow(wd: AppWindow) {
    this._registeredWindows.push(wd);
  }

  open(windowName: string) {
    this._registeredWindows.forEach((wd) => {
      if (wd.id === windowName) {
        this._openedWindows.push(wd);
        this.OpenWindow.emit(wd);
      }
    });
  }

  close(windowName: string) {
    this._openedWindows.forEach((wd, i) => {
      if (wd.id === windowName) {
        this.CloseWindow.emit(wd);
        this._openedWindows.splice(i, 1);
      }
    });
  }
}

export type WindowComponent = any;

export interface AppWindow {
  id: string;
  component: any;
}

export interface AppWindowRef extends AppWindow {
  ref: ComponentRef<unknown>;
}
