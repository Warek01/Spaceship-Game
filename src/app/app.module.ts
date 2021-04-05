import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { MenuComponent } from "./menu/menu.component";
import { HeaderComponent } from "./header/header.component";
import { EndScreenComponent } from "./end-screen/end-screen.component";
import { GameComponent } from "./game/game.component";
import { HttpClientModule } from "@angular/common/http";
import { HelpWindowComponent } from './help-window/help-window.component';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    HeaderComponent,
    EndScreenComponent,
    GameComponent,
    HelpWindowComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule],
  providers: [HttpClientModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
