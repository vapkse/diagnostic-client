import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { NowPlayingComponent } from './now-playing.component';
import { NowPlayingArtistModule } from './now-playing-artist/now-playing-artist.module';

@NgModule({
    imports: [
        CommonModule,
        NowPlayingArtistModule
    ],
    declarations: [
        NowPlayingComponent
    ],
    exports: [
        NowPlayingComponent
    ]
})
export class NowPlayingModule { }
