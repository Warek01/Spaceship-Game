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
    elem1: HTMLElement | Element | HTMLDivElement,
    elem2: HTMLElement | Element | HTMLDivElement
  ): number {
    const a = elem1 as HTMLDivElement;
    const b = elem2 as HTMLDivElement;
    const a_center = parseFloat(a.style.width) / 2,
      b_center = parseFloat((b as any).style.width) / 2;

    return Math.hypot(
      a.getBoundingClientRect().top +
        a_center -
        (b!.getBoundingClientRect().top + b_center),
      a.getBoundingClientRect().left +
        a_center -
        (b!.getBoundingClientRect().left + b_center)
    );
  }

  constructor() {}
}
