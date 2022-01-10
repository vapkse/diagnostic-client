import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NowPlayingArtistComponent } from './now-playing-artist.component';
import { SliderModule } from './slider/slider.module';

@NgModule({
    imports: [
        CommonModule,
        MatCardModule,
        MatTabsModule,
        MatTooltipModule,
        SliderModule
    ],
    declarations: [
        NowPlayingArtistComponent
    ],
    exports: [
        NowPlayingArtistComponent
    ]
})
export class NowPlayingArtistModule { }
