import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, enableProdMode, NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { AmpParamsModule } from './components/amp-params';


if (environment.production) {
    enableProdMode();
}

@NgModule({
    imports: [
        AmpParamsModule,
        BrowserAnimationsModule,
        BrowserModule,
        CommonModule,
        HttpClientModule,
        MatButtonModule,
        MatIconModule,
        MatSidenavModule,
        MatToolbarModule,
        NoopAnimationsModule,
        routing
    ],
    declarations: [AppComponent],
    bootstrap: [AppComponent],
    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ]
})
export class AppModule { }
