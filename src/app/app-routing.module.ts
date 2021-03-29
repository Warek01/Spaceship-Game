import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { EndScreenComponent } from "./end-screen/end-screen.component";
import { GameComponent } from "./game/game.component";
import { MenuComponent } from "./menu/menu.component";

const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "/menu",
  },
  {
    path: "menu",
    pathMatch: "full",
    component: MenuComponent,
  },
  {
    path: "game",
    pathMatch: "full",
    component: GameComponent,
  },
  {
    path: "end-screen",
    pathMatch: "full",
    component: EndScreenComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
