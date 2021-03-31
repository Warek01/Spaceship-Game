import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class SizingService {
  fontSize = 16;
  headerHeight = 50;

  get availHeight() {
    return document.body.clientHeight - this.headerHeight;
  }

  get availWidth() {
    return document.body.clientWidth;
  }

  constructor() {}
}
