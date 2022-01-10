import './polyfills.ts';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}

void platformBrowserDynamic().bootstrapModule(AppModule);
