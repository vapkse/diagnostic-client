import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { catchError, combineLatestWith, debounceTime, delay, filter, map, Observable, of, switchMap, take, tap, withLatestFrom } from 'rxjs';

import { AmpInfo, FieldInfo, Slider, Toggle } from '../../common/amp';
import { shareReplayLast, subscribeWith } from '../../common/custom-operators';
import { AmpService } from '../../services/amp.service';
import { AmpParamsService } from '../../services/amp-params.service';
import { asyncSwitchMap } from '../debounced-event/debounced-event-directive';

interface SendRequestParams {
    action: string;
    value?: number;
}

interface AmpParamsFormControls {
    toggles: FormArray<FormControl<boolean | null>>;
    sliders: FormArray<FormControl<number | null>>;
}

@Component({
    selector: 'amp-params',
    templateUrl: './amp-params.component.html',
    styleUrls: ['./amp-params.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        AmpParamsService
    ]
})
export class AmpParamsComponent {
    @HostBinding('class.waiter')
    public waiter = true;

    public message?: string;
    public sliders$: Observable<ReadonlyArray<Slider>>;
    public toggles$: Observable<ReadonlyArray<Toggle>>;
    public params$: Observable<Map<string, unknown>>;
    public title$: Observable<string>;

    public form$: Observable<FormGroup<AmpParamsFormControls>>;

    private _ampInfo?: AmpInfo;

    @Input()
    public set ampInfo(value: AmpInfo | undefined) {
        this.waiter = true;
        this.changeDetectorRef.markForCheck();

        this.ampParamsService.ampInfo$.next(this._ampInfo = value);
    }

    public get ampInfo(): AmpInfo | undefined {
        return this._ampInfo;
    }

    public constructor(
        public ampParamsService: AmpParamsService,
        public ampService: AmpService,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        this.title$ = this.ampParamsService.ampInfo$.pipe(
            filter(Boolean),
            combineLatestWith(ampService.isAdmin$),
            map(([ampInfo, isAdmin]) => ampInfo.paramsPanelTitle || `${(ampInfo.name || '')} parameters${isAdmin ? '' : ' (read only)'}`),
            shareReplayLast()
        );

        const getValue = (params: Map<string, unknown>, name: string, factor: number): number => {
            const param = params.get(name);
            if (param === undefined || typeof param !== 'number') {
                console.log('Invalid name for getValue', name);
                return 0;
            }
            const value = +param;
            return value ? (factor !== 1 && Math.round(value * factor)) || value : 0;
        };

        this.params$ = this.ampParamsService.currentParams$.pipe(
            filter(Boolean),
            shareReplayLast()
        );

        this.sliders$ = ampParamsService.ampInfo$.pipe(
            filter(Boolean),
            map(ampInfo => {
                const createSlider = (info: FieldInfo): Slider => {
                    const sliderInfo = info.slider as Slider;
                    sliderInfo.name = info.name;
                    return sliderInfo;
                };

                return ampInfo.paramsInfos
                    .filter(info => info.slider)
                    .map(createSlider);
            }),
            shareReplayLast()
        );

        this.toggles$ = ampParamsService.ampInfo$.pipe(
            filter(Boolean),
            map(ampInfo => {
                const createToggles = (info: FieldInfo): ReadonlyArray<Toggle> => (info.toggles || new Array<Toggle>()).map(t => {
                    const toggleInfo = t as Toggle;
                    toggleInfo.name = info.name;
                    return toggleInfo;
                });

                return ampInfo.paramsInfos
                    .filter(info => info.toggles)
                    .reduce((o, info) => [...o, ...createToggles(info)], new Array<Toggle>());
            }),
            shareReplayLast()
        );

        const form$ = this.ampParamsService.currentParams$.pipe(
            filter(Boolean),
            combineLatestWith(this.sliders$, this.toggles$, ampService.isAdmin$),
            map(([params, sliders, toggles, isAdmin]) => {
                this.waiter = true;
                this.message = undefined;

                const toogleFormArray = toggles.map(toggle => new FormControl(params.size && this.getFlag(params, toggle.name, toggle.flag) || false));
                const sliderFormArray = sliders.map(slider => new FormControl(params.size && getValue(params, slider.name, slider.factor || 1) || null));

                sliderFormArray.forEach((formControl, index) => {
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
                    if (sliders[index].enabled === false) {
                        formControl.disable();
                    }
                });

                const formParams = new FormGroup<AmpParamsFormControls>({
                    toggles: new FormArray(toogleFormArray),
                    sliders: new FormArray(sliderFormArray)
                });

                if (!isAdmin) {
                    formParams.disable({ onlySelf: false, emitEvent: false });
                }

                return formParams;
            }),
            shareReplayLast()
        );

        const toogleFormArrayChange$ = form$.pipe(
            switchMap(formParams => formParams.controls.toggles.valueChanges),
            withLatestFrom(this.params$, this.toggles$),
            switchMap(([values, params, toggles]) => {
                const setFlag$ = (index: number): Observable<void> => {
                    if (index >= values.length) {
                        return of(undefined);
                    }

                    const toggle = toggles[index];
                    const value = values[index];
                    const currentValue = params.get(toggle.name);

                    if (typeof currentValue !== 'number') {
                        console.log('Invalid name for setFlag', toggle.name);
                        return setFlag$(index + 1);
                    }
                    const flags = params.get(toggle.name) as number;
                    // eslint-disable-next-line no-bitwise
                    const nextValue = value ? flags | toggle.flag : flags & ~toggle.flag;

                    if (nextValue === currentValue) {
                        // No changes
                        return setFlag$(index + 1);
                    }

                    params.set(toggle.name, nextValue);
                    return this.sendRequest$({ action: toggle.name, value: nextValue }).pipe(
                        switchMap(() => setFlag$(index + 1))
                    );
                };

                return setFlag$(0);
            })
        );

        const sliderFormArrayChange$ = form$.pipe(
            switchMap(formParams => formParams.controls.sliders.valueChanges),
            withLatestFrom(this.params$, this.sliders$),
            switchMap(([values, params, sliders]) => {
                const setFlag$ = (index: number): Observable<void> => {
                    if (index >= values.length) {
                        return of(undefined);
                    }

                    const slider = sliders[index];
                    const value = values[index] || 0;
                    const currentValue = params.get(slider.name);

                    let nextValue = value;
                    if (slider.factor !== 1) {
                        nextValue = Math.round(nextValue / (slider.factor || 1));
                    }

                    if (nextValue === currentValue) {
                        // No changes
                        return setFlag$(index + 1);
                    }

                    return this.sendRequest$({ action: slider.name, value: nextValue }).pipe(
                        switchMap(() => setFlag$(index + 1))
                    );
                };

                return setFlag$(0);
            })
        );

        this.form$ = form$.pipe(
            subscribeWith(sliderFormArrayChange$, toogleFormArrayChange$),
            tap(() => {
                this.waiter = false;
                this.changeDetectorRef.markForCheck();
            }),
            shareReplayLast()
        );
    }

    public getFlag(params: Map<string, unknown>, name: string, flag: number): boolean {
        if (typeof params.get(name) !== 'number') {
            console.log('Invalid name for getFlag', name);
            return false;
        }
        const flags = params.get(name) as number;
        // eslint-disable-next-line no-bitwise
        return !!(flags & flag);
    }

    public sendRequest$(request: SendRequestParams): Observable<void> {
        return asyncSwitchMap(() => {
            this.waiter = true;
            this.changeDetectorRef.markForCheck();

            const ensureStates$ = (): Observable<void> => this.sliders$.pipe(
                combineLatestWith(this.toggles$, this.params$),
                debounceTime(1),
                take(1),
                map(([sliders, toggles, params]) => {
                    const workingPoint = sliders.find(sl => sl.name === 'workingPoint' || sl.name === 'finaleWorkingPoint');
                    const workingPointAuto = workingPoint && toggles.find(to => to.flagName === 'workingPointAuto');
                    if (workingPointAuto) {
                        workingPoint.enabled = !this.getFlag(params, workingPointAuto.name, workingPointAuto.flag);
                    }
                })
            );

            return ensureStates$().pipe(
                debounceTime(300),
                switchMap(() => this.ampParamsService.sendRequest$(request.action, request.value || 0)),
                catchError((err: unknown) => {
                    if (typeof err === 'object') {
                        const error = err as Record<string, unknown>;
                        this.message = error.message as string || JSON.stringify(err);
                    } else {
                        this.message = err as string;
                    }
                    return of(undefined);
                }),
                withLatestFrom(this.params$),
                switchMap(([newValue, params]) => {
                    if (newValue !== undefined) {
                        if (params?.has(request.action)) {
                            params.set(request.action, newValue);
                        }
                    }
                    return ensureStates$();
                }),
                take(1),
                delay(1),
                tap(() => {
                    this.waiter = false;
                    this.changeDetectorRef.markForCheck();
                })
            );
        });
    }
}
