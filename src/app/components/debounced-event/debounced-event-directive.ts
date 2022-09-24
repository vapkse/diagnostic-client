import { coerceNumberProperty } from '@angular/cdk/coercion';
import { ChangeDetectorRef, Directive, HostListener, Input } from '@angular/core';
import { filter, map, Observable, of, Subject, switchMap, take, takeUntil, throttleTime } from 'rxjs';

import { DestroyDirective } from '../destroy/destroy.directive';

export const asyncMap = <T>(funct: () => T): Observable<T> => of(null).pipe(
    map(() => funct())
);

export const asyncSwitchMap = <T>(funct$: () => Observable<T>): Observable<T> => of(null).pipe(
    switchMap(() => funct$())
);

@Directive({
    selector: '[debounced-event]'
})
export class DebouncedEventDirective extends DestroyDirective {

    @Input('debounced-event') public action$?: Observable<unknown>;

    @Input() public set throttleTime(value: string | number) {
        this._throttleTime = coerceNumberProperty(value);
    }

    private _throttleTime = 1000;
    private click$ = new Subject<void>();

    public constructor(changeDetectorRef: ChangeDetectorRef) {
        super();

        this.click$.pipe(
            throttleTime(this._throttleTime),
            map(() => this.action$),
            filter(Boolean),
            switchMap(action$ => action$.pipe(take(1))),
            takeUntil(this.destroyed$)
        ).subscribe(() => {
            changeDetectorRef.markForCheck();
        });
    }

    @HostListener('click', ['$event'])
    public onClick(event: Event): boolean {
        this.click$.next();

        const openingButton = event.currentTarget as HTMLElement;
        if (openingButton) {
            openingButton.blur();
        }
        event.stopPropagation();
        event.preventDefault();
        return false;
    }
}
