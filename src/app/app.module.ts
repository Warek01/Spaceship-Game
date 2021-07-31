import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { MenuComponent } from "./menu/menu.component";
import { HeaderComponent } from "./header/header.component";
import { EndScreenComponent } from "./end-screen/end-screen.component";
import { GameComponent } from "./game/game.component";
import { HttpClientModule } from "@angular/common/http";
import { HelpWindowComponent } from "./app-windows/help/help.component";
import { BackgroundComponent } from "./background/background.component";
import { GameAudioComponent } from "./game-audio/game-audio.component";
import { SettingsWindowComponent } from "./app-windows/settings/settings.component";
import { WindowComponent } from "./app-windows/window/window.component";
import { FormsModule } from "@angular/forms";
import { EffectsComponent } from './effects/effects.component';
import { PopupComponent } from './popup/popup.component';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    HeaderComponent,
    EndScreenComponent,
    GameComponent,
    HelpWindowComponent,
    BackgroundComponent,
    GameAudioComponent,
    SettingsWindowComponent,
    WindowComponent,
    EffectsComponent,
    PopupComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule],
  providers: [HttpClientModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
