import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';

import { Artist } from '../../../common/now-playing';
import { NowPlayingService, WebSite } from '../../../services/now-playing.service';
import { DestroyDirective } from '../../destroy/destroy.directive';

@Component({
    selector: 'now-playing-artist',
    templateUrl: './now-playing-artist.component.html',
    styleUrls: ['./now-playing-artist.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class NowPlayingArtistComponent extends DestroyDirective {
    @Input()
    public artist?: Artist;

    public constructor(
        public nowPlayingService: NowPlayingService
    ) {
        super();
    }

    public openInNewTab(url: string): void {
        void window.open(url, '_blank')?.focus();
    }

    public trackBy(_index: number, webSite: WebSite): string {
        return webSite.url;
    }

    public hasArtistInfos(artist: Artist): boolean {
        return !!artist.intFormedYear || !!artist.intDiedYear || !!artist.strMood || !!artist.intBornYear || !!artist.strStyle || !!artist.strGenre || !!artist.strCountry || !!artist.strCountryCode;
    }
}
