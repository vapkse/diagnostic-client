import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';

import { AmpDataHeader, AmpErrors as ampErrors, AmpInfo } from '../../common/amp';
import { AmpService } from '../../services';
import { AmpDataService } from '../../services/amp-data.service';

@Component({
    selector: 'amp-data',
    templateUrl: './amp-data.component.html',
    styleUrls: ['./amp-data.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        AmpDataService
    ]
})
export class AmpDataComponent {
    private _ampInfo?: AmpInfo;

    @Input()
    public set ampInfo(value: AmpInfo | undefined) {
        this.ampDataService.ampInfo$.next(this._ampInfo = value);
    }

    public get ampInfo(): AmpInfo | undefined {
        return this._ampInfo;
    }

    public constructor(
        protected ampService: AmpService,
        protected ampDataService: AmpDataService
    ) { }

    protected getStepError(datas: AmpDataHeader): string | undefined {
        const currentStep = datas && this.ampInfo?.stepMap.get(datas.step);
        if (currentStep?.isError) {
            if (datas.errorNumber && !isNaN(datas.errorNumber)) {
                const error = ampErrors.get(datas.errorNumber);
                if (error) {
                    return error.descr;
                }
            }
        }

        return undefined;
    }

    protected hasStepInfo(datas: AmpDataHeader): boolean {
        const currentStep = datas && this.ampInfo?.stepMap.get(datas.step);
        return currentStep?.isError || !!currentStep?.label;
    }

    protected getVal(datas: AmpDataHeader, i: number): number {
        return datas?.val?.[i] || 0;
    }

    protected getOut(datas: AmpDataHeader, i: number): number {
        return datas?.out?.[i] || 0;
    }

    protected getRef(datas: AmpDataHeader, i: number): number {
        return this.ampInfo?.tubes?.[i].ref || (typeof datas.ref === 'number' ? datas.ref : datas.ref?.[i] || 0);
    }

    protected getMin(datas: AmpDataHeader, i: number): number {
        return this.ampInfo?.tubes?.[i].min || (typeof datas.min === 'number' ? datas.min : datas.min?.[i] || 0);
    }

    protected getMax(datas: AmpDataHeader, i: number): number {
        return this.ampInfo?.tubes?.[i].max || (typeof datas.max === 'number' ? datas.max : datas.max?.[i] || 0);
    }
}
