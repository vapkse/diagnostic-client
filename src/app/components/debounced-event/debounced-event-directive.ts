import { BooleanInput, coerceBooleanProperty, coerceNumberProperty, NumberInput } from '@angular/cdk/coercion';
import { ChangeDetectorRef, Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import { catchError, EMPTY, filter, finalize, map, Observable, of, Subject, switchMap, take, takeUntil, throttleTime, timeout } from 'rxjs';

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
export class DebouncedEventDirective extends DestroyDirective implements OnInit {

    @Input('debounced-event') public action$?: Observable<unknown>;

    @Input() public set showWaiter(value: BooleanInput) {
        this._showWaiter = coerceBooleanProperty(value);
    }

    @Input() public set throttleTime(value: NumberInput) {
        this._throttleTime = coerceNumberProperty(value);
    }

    private _throttleTime = 1000;
    private _showWaiter = false;

    private click$ = new Subject<void>();

    public constructor(private el: ElementRef, private changeDetectorRef: ChangeDetectorRef) {
        super();
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

    // Cannot access @input from the constructor so we use the onInit
    public ngOnInit(): void {
        const element = (this.el.nativeElement as HTMLElement).nodeName === 'BUTTON' ? (this.el.nativeElement as HTMLButtonElement) : null;

        this.click$.pipe(
            throttleTime(this._throttleTime),
            filter(() => !!this.action$),
            switchMap(() => {
                if (!this.action$) {
                    console.error('Action not defined');
                    return EMPTY;
                }

                if (this._showWaiter && element) {
                    element.disabled = true;
                    element.classList.add('mat-button-disabled');
                    element.setAttribute('waiter', 'true');

                    return this.action$.pipe(
                        take(1),
                        catchError(error => {
                            console.error(error);
                            return EMPTY;
                        }),
                        timeout(30000),
                        catchError(error => {
                            console.error(error);
                            return EMPTY;
                        }),
                        finalize(() => {
                            if (element) {
                                element.disabled = false;
                                element.classList.remove('mat-button-disabled');
                                element.removeAttribute('waiter');
                            }
                        })
                    );
                }

                return this.action$.pipe(take(1));
            }),
            takeUntil(this.destroyed$)
        ).subscribe(() => {
            this.changeDetectorRef.markForCheck();
        });
    }
}
