import { Injectable } from '@angular/core';
import { filter, map, Observable, switchMap, take, tap, toArray, withLatestFrom } from 'rxjs';

import { AmpStatus } from '../common/amp';
import { shareReplayLast } from '../common/custom-operators';
import { AmpService } from '../services/amp.service';

export class NavigationItem {
    public constructor(
        public id?: number,
        public label?: string,
        public isOnline?: boolean,
        public maybeOnline?: boolean,
        public selected?: boolean
    ) { }
}

@Injectable({
    providedIn: 'root'
})
export class NavigationService {
    public navList$: Observable<ReadonlyArray<NavigationItem>>;

    public constructor(private ampService: AmpService) {

        this.navList$ = this.ampService.amplifiers$.pipe(
            take(1),
            map(amps => amps.filter(amp => !amp.baseSection)),
            switchMap(amps => amps),
            filter(amp => amp.visible || amp.visible === undefined),
            map(amp => new NavigationItem(amp.id, amp.name, false, false)),
            toArray(),
            tap(items => console.log(`menu items loaded ${items.length}`)),
            shareReplayLast(),
            switchMap(items => this.ampService.ampStatusMap$.pipe(
                withLatestFrom(this.ampService.amplifierMap$),
                map(([ampStatusMap, amplifierMap]) => {
                    // Extend status map with inherits id's
                    const extendedStatusMap = new Map<number, AmpStatus>(ampStatusMap);
                    [...extendedStatusMap].forEach(([id, status]) => {
                        const ampInfo = amplifierMap.get(id);
                        if (ampInfo.inherits) {
                            extendedStatusMap.set(ampInfo.inherits, status);
                        }
                    });

                    items.forEach(item => {
                        const status = extendedStatusMap.get(item.id);
                        item.isOnline = status?.statusText === 'online';
                        item.maybeOnline = status?.statusText === 'maybe';
                    });
                    return [...items];
                }),
                shareReplayLast()
            ))
        );
    }
}
