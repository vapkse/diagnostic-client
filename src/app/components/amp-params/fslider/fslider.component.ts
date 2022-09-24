import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostBinding, Input, Optional, Self, ViewChild } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { debounceTime, fromEvent, map, mergeWith, of, ReplaySubject, Subject, switchMap, takeUntil, tap, timer, withLatestFrom } from 'rxjs';

import { DestroyDirective } from '../../destroy/destroy.directive';

@Component({
    selector: 'fslider',
    templateUrl: './fslider.component.html',
    styleUrls: ['./fslider.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FSliderComponent extends DestroyDirective implements ControlValueAccessor {
    @Input() public min = 0;
    @Input() public max = 100;
    @Input() public step = 1;
    @Input() public decimal = 0;
    @Input() public title = '';

    @ViewChild('valuecontrol', { static: true })
    public set valueElementRef(elementRef: ElementRef<HTMLElement>) {
        this.valueElement$.next(this._valueElement = elementRef?.nativeElement);
    }

    @Input() @HostBinding('attr.disabled')
    private _disabled = false;

    public focus$ = new Subject<void>();

    private hasFocus = false;

    private selectAll$ = new Subject<void>();
    private _value?: number;
    private _valueElement?: HTMLElement;
    private valueElement$ = new ReplaySubject<HTMLElement>(1);

    public constructor(
        @Self() @Optional() public control: NgControl,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        super();

        if (this.control) {
            this.control.valueAccessor = this;
        }

        const blur$ = this.valueElement$.pipe(
            switchMap(element => fromEvent(element, 'blur').pipe(
                tap(() => {
                    this.hasFocus = false;
                    const number = +element.innerText;
                    if (!isNaN(number)) {
                        this.writeValue(number);
                    }
                    element.innerText = this.displayedValue;
                    this.onChangeCallback(this.value);
                })
            ))
        );

        const keyDown$ = this.valueElement$.pipe(
            switchMap(element => fromEvent<KeyboardEvent>(element, 'keydown')),
            switchMap(e => {
                const span = e.target as HTMLElement;

                e.cancelBubble = true;

                const writeValue = (v: number): void => {
                    this.writeValue(v);
                    span.innerText = this.displayedValue;
                    this.selectAll$.next();
                };

                let number: number;

                switch (e.key) {
                    case 'End':
                        writeValue(this.max);
                        break;

                    case 'Home':
                        writeValue(this.min);
                        break;

                    case 'ArrowUp':
                        if (this.value !== undefined && !isNaN(this.value)) {
                            writeValue(this.value + +this.step);
                        }
                        break;

                    case 'ArrowDown':
                        if (this.value !== undefined && !isNaN(this.value)) {
                            writeValue(this.value - +this.step);
                        }
                        break;

                    case 'Enter':
                        number = +span.innerText;
                        if (!isNaN(number)) {
                            this.writeValue(number);
                        }
                        return timer(0).pipe(
                            map(() => {
                                span.innerText = this.displayedValue;
                                this.onChangeCallback(this.value);
                                this.selectAll$.next();
                                return !e.cancelBubble;
                            })
                        );

                    // eslint-disable-next-line no-fallthrough
                    default:
                        return timer(10).pipe(
                            map(() => {
                                const val = +span.innerText;
                                if (!isNaN(val)) {
                                    this.writeValue(val);
                                }
                                return !e.cancelBubble;
                            })
                        );
                }

                return of(!e.cancelBubble);
            })
        );

        this.focus$.pipe(
            switchMap(() => {
                this.hasFocus = true;
                return keyDown$.pipe(
                    takeUntil(blur$)
                );
            }),
            takeUntil(this.destroyed$)
        ).subscribe();

        this.selectAll$.pipe(
            mergeWith(this.focus$),
            debounceTime(10),
            withLatestFrom(this.valueElement$),
            takeUntil(this.destroyed$)
        ).subscribe(([_, valueElement]) => {
            const range = document.createRange();
            range.selectNodeContents(valueElement);
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
    }

    /** Retourne ou definit si le selecteur est desactivé. */
    public get disabled(): boolean {
        return this.control ? this.control.disabled || false : this._disabled;
    }

    @Input()
    public set disabled(value: boolean) {
        this._disabled = coerceBooleanProperty(value);
        this.changeDetectorRef.markForCheck();
    }

    // get accessor
    public get value(): number | undefined {
        return this._value;
    }

    // ************* ControlValueAccessor Implementation **************
    // set accessor including call the onchange callback
    public set value(value: number | undefined) {
        if (value !== this._value) {
            this.writeValue(value);
            this.onChangeCallback(value);
        }
    }

    public onTouchedCallback = (): void => undefined as void;
    public onChangeCallback = (_: unknown): void => undefined as void;

    public writeValue(value: number | undefined): void {
        if (value === undefined || isNaN(value)) {
            return;
        }

        const newValue = this.round(value, +this.step, 0);
        if (isNaN(newValue)) {
            return;
        }

        this._value = Math.min(this.max, Math.max(this.min, newValue));
        if (!this.hasFocus && this._valueElement) {
            this._valueElement.innerText = this.displayedValue;
        }

        this.changeDetectorRef.markForCheck();
    }

    public registerOnChange(fn: (_: unknown) => void): void {
        this.onChangeCallback = fn;
    }

    public registerOnTouched(fn: () => void): void {
        this.onTouchedCallback = fn;
    }
    // ************* End of ControlValueAccessor Implementation **************

    public focus(): void {
        void this._valueElement?.focus();
    }

    public oninputchange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.writeValue(+input.value);
        this.onChangeCallback(this.value);
    }

    public oninput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.writeValue(+input.value);
    }

    private round(number: number, increment: number, offset: number): number {
        return Math.round((number - offset) / increment) * increment + offset;
    }

    private get displayedValue(): string {
        return this.value !== undefined && !isNaN(this.value) ? this.value.toFixed(this.decimal) : '';
    }
}
