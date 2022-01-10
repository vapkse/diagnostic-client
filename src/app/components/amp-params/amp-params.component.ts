import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { IFormBuilder, IFormGroup } from '@rxweb/types';
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

interface SliderForm extends Slider {
    value: number;
}

interface ToogleForm extends Toggle {
    value: boolean;
}

interface AmpParamsForm {
    toggles: Array<ToogleForm>;
    sliders: Array<SliderForm>;
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

    public message = null as string;
    public sliders$: Observable<ReadonlyArray<Slider>>;
    public toggles$: Observable<ReadonlyArray<Toggle>>;
    public params$: Observable<Map<string, unknown>>;
    public title$: Observable<string>;

    public formParams$: Observable<IFormGroup<AmpParamsForm>>;
    private formBuilder: IFormBuilder;

    private _ampInfo: AmpInfo;

    @Input()
    public set ampInfo(value: AmpInfo) {
        this.waiter = true;
        this.changeDetectorRef.markForCheck();

        this.ampParamsService.ampInfo$.next(this._ampInfo = value);
    }

    public get ampInfo(): AmpInfo {
        return this._ampInfo;
    }

    public constructor(
        public ampParamsService: AmpParamsService,
        public ampService: AmpService,
        private changeDetectorRef: ChangeDetectorRef,
        formBuilder: FormBuilder
    ) {
        this.formBuilder = formBuilder;

        this.title$ = this.ampParamsService.ampInfo$.pipe(
            filter(ampInfo => !!ampInfo),
            combineLatestWith(ampService.isAdmin$),
            map(([ampInfo, isAdmin]) => ampInfo.paramsPanelTitle || `${(ampInfo.name || '')} parameters${isAdmin ? '' : ' (read only)'}`),
            shareReplayLast()
        );

        const getValue = (params: Map<string, unknown>, name: string, factor: number): unknown => {
            if (typeof params.get(name) !== 'number') {
                console.log('Invalid name for getValue', name);
                return 0;
            }
            const value = params.get(name) as number;
            return (factor !== 1 && Math.round(value * factor)) || params.get(name);
        };

        this.params$ = this.ampParamsService.currentParams$.pipe(
            shareReplayLast()
        );

        this.sliders$ = ampParamsService.ampInfo$.pipe(
            filter(ampInfo => !!ampInfo),
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
            filter(ampInfo => !!ampInfo),
            map(ampInfo => {
                const createToggles = (info: FieldInfo): ReadonlyArray<Toggle> => info.toggles.map(t => {
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

        const formParams$ = this.ampParamsService.currentParams$.pipe(
            combineLatestWith(this.sliders$, this.toggles$, ampService.isAdmin$),
            map(([params, sliders, toggles, isAdmin]) => {
                this.waiter = true;
                this.message = null;

                const toogleFormArray = toggles.map(toggle => this.formBuilder.group<ToogleForm>({ ...toggle, value: params.size && this.getFlag(params, toggle.name, toggle.flag) } as ToogleForm));
                const sliderFormArray = sliders.map(slider => this.formBuilder.group<SliderForm>({ ...slider, value: params.size && getValue(params, slider.name, slider.factor) } as SliderForm));

                // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
                sliderFormArray.filter(formGroup => formGroup.value.enabled === false).forEach(formGroup => formGroup.disable());

                const formParams = this.formBuilder.group<AmpParamsForm>({
                    toggles: this.formBuilder.array(toogleFormArray),
                    sliders: this.formBuilder.array(sliderFormArray)
                });

                if (!isAdmin) {
                    formParams.disable({ onlySelf: false, emitEvent: false });
                }

                return formParams;
            }),
            shareReplayLast()
        );

        const toogleFormArrayChange$ = formParams$.pipe(
            switchMap(formParams => formParams.controls.toggles.valueChanges),
            map(toogleFormGroup => Array.from(toogleFormGroup)),
            withLatestFrom(this.params$),
            switchMap(([toogleFormGroup, params]) => {
                const setFlag$ = (index: number): Observable<IFormGroup<AmpParamsForm>> => {
                    if (index >= toogleFormGroup.length) {
                        return of(undefined as IFormGroup<AmpParamsForm>);
                    }

                    const toggle = toogleFormGroup[index];
                    const currentValue = params.get(toggle.name);

                    if (typeof currentValue !== 'number') {
                        console.log('Invalid name for setFlag', toggle.name);
                        return setFlag$(index + 1);
                    }
                    const flags = params.get(toggle.name) as number;
                    // eslint-disable-next-line no-bitwise
                    const nextValue = toggle.value ? flags | toggle.flag : flags & ~toggle.flag;

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
        const sliderFormArrayChange$ = formParams$.pipe(
            switchMap(formParams => formParams.controls.sliders.valueChanges),
            map(sliderFormGroup => Array.from(sliderFormGroup)),
            withLatestFrom(this.params$),
            switchMap(([sliderFormGroup, params]) => {
                const setFlag$ = (index: number): Observable<IFormGroup<AmpParamsForm>> => {
                    if (index >= sliderFormGroup.length) {
                        return of(undefined as IFormGroup<AmpParamsForm>);
                    }

                    const slider = sliderFormGroup[index];
                    const currentValue = params.get(slider.name);

                    let nextValue = slider.value;
                    if (slider.factor !== 1) {
                        nextValue = Math.round(nextValue / slider.factor);
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

        this.formParams$ = formParams$.pipe(
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
                take(1),
                catchError((err: unknown) => {
                    if (typeof err === 'object') {
                        const error = err as Record<string, unknown>;
                        this.message = error.message as string || JSON.stringify(err);
                    } else {
                        this.message = err as string;
                    }
                    return of(undefined as number);
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
                delay(1),
                tap(() => {
                    this.waiter = false;
                    this.changeDetectorRef.markForCheck();
                })
            );
        });
    }
}
