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
        protected nowPlayingService: NowPlayingService
    ) {
        super();
    }

    protected openInNewTab(url: string): void {
        void window.open(url, '_blank')?.focus();
    }

    protected trackBy(_index: number, webSite: WebSite): string {
        return webSite.url;
    }

    protected hasArtistInfos(artist: Artist): boolean {
        return !!artist.intFormedYear || !!artist.intDiedYear || !!artist.strMood || !!artist.intBornYear || !!artist.strStyle || !!artist.strGenre || !!artist.strCountry || !!artist.strCountryCode;
    }
}
