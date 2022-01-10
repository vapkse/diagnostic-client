import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter, map, take, takeUntil } from 'rxjs';

import { DestroyDirective } from '../components/destroy/destroy.directive';
import { AmpService } from '../services';

@Component({
    selector: 'amp-view',
    templateUrl: './amp-details.html',
    styleUrls: ['./amp-details.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AmpDetailsComponent extends DestroyDirective {
    public constructor(public ampService: AmpService, route: ActivatedRoute) {
        super();

        route.params.pipe(
            filter(params => !!params.id),
            map(params => +params.id),
            take(1),
            takeUntil(this.destroyed$)
        ).subscribe(id => {
            ampService.selectedId$.next(id);
        });
    }
}
