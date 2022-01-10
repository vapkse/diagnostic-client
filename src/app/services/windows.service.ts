import { Injectable } from '@angular/core';
import { debounceTime, fromEvent, Observable } from 'rxjs';

import { shareReplayLast } from '../common/custom-operators';

@Injectable({
    providedIn: 'root'
})
export class WindowService {
    public windowResized$: Observable<Event>;

    public constructor() {
        this.windowResized$ = fromEvent(window, 'resize').pipe(
            debounceTime(20),
            shareReplayLast()
        );
    }
}
