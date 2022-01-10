import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AmpDataModule } from '../components/amp-data';
import { NowPlayingModule } from '../components/now-playing/now-playing.module';
import { HomeComponent } from './home.component';
import { routing } from './home.routing';

@NgModule({
    imports: [
        AmpDataModule,
        CommonModule,
        FormsModule,
        NowPlayingModule,
        routing
    ],
    declarations: [
        HomeComponent
    ]
})
export class HomeModule { }
