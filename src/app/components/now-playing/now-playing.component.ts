import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { NowPlayingResponse } from '../../common/now-playing';

@Component({
    selector: 'now-playing',
    templateUrl: './now-playing.component.html',
    styleUrls: ['./now-playing.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NowPlayingComponent {
    @Input()
    public nowPlaying: NowPlayingResponse;
}
