import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ViewComputingService {
  fontSize = 16;
  headerHeight = 50;

  get availHeight() {
    return document.body.clientHeight - this.headerHeight;
  }

  get availWidth() {
    return document.body.clientWidth;
  }

  /** Distance in px between centerf of a and center of b */
  distanceBetween(
    elem1: HTMLElement | HTMLDivElement,
    elem2: HTMLElement | HTMLDivElement
  ): number {
    const a = elem1;
    const b = elem2;

    const a_center = a.offsetWidth / 2,
      b_center = b.offsetWidth / 2;

    return Math.hypot(
      a.offsetTop + a_center - (b.offsetTop + b_center),
      a.offsetLeft + a_center - (b.offsetLeft + b_center)
    );
  }

  constructor() {
    window.addEventListener("resize", (e) => {});
  }
}
