import { ChangeDetectionStrategy, Component, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { delay, Observable, of, startWith } from 'rxjs';

import { AmpDataComponent } from '../components/amp-data/index';
import { AmpService } from '../services';
import { NowPlayingService } from '../services/now-playing.service';

@Component({
    selector: 'home-page',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
    @ViewChildren(AmpDataComponent) public ampDataComponents?: QueryList<AmpDataComponent>;

    protected loading$: Observable<boolean>;

    public constructor(
        protected ampService: AmpService,
        protected nowPlayingService: NowPlayingService
    ) {

        this.loading$ = of(false).pipe(
            delay(5000),
            startWith(true)
        );

        ampService.selectedId$.next(undefined);
    }
}
