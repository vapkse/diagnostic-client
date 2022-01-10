import { Component, Input, OnChanges, OnInit, SimpleChange } from '@angular/core';

import { AmpInfo, Tubeinfo } from '../../../../common/amp';
import { GaugeBase, GaugeOptions } from '../gauge';

export class OutputGaugeOptions extends GaugeOptions {
    public constructor() {
        super();
        this.style = 'horizontal';
        this.titleTextSize = 16;
        this.valueTextSize = 16;
        this.limitsColor = null;
        this.speed = 0.4;
        this.limits = [2, 20, 80, 98];
    }
}

// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
    selector: 'output-gauge',
    template: '<canvas class="gauge"></canvas>'
})
export class OutputGaugeComponent extends GaugeBase<OutputGaugeOptions> implements OnChanges, OnInit {
    @Input() public ampinfos: AmpInfo;
    @Input() public tube: Tubeinfo;

    protected options = new OutputGaugeOptions();

    private valueKey = 'value';
    private _value = 0;

    public get value(): number {
        return this._value;
    }

    @Input()
    public set value(val: number) {
        this._value = val || 0;
        this.options.value = this._value * 100 / 255;
        this.refresh();
    }

    public refresh(): void {
        if (this.ampinfos.outputLimits) {
            this.options.limits = this.ampinfos.outputLimits;
        }

        this.options.valueColor = [{
            max: 0.1,
            color: '#222'
        }, {
            min: 0.1,
            max: this.options.limits[0],
            h: 0,
            s: 79,
            l: 32
        }, {
            min: this.options.limits[0],
            max: this.options.limits[1],
            h1: 0,
            s1: 79,
            l1: 32,
            h2: 120,
            s2: 73,
            l2: 75
        }, {
            min: this.options.limits[1],
            max: this.options.limits[2],
            h: 120,
            s: 73,
            l: 75
        }, {
            min: this.options.limits[2],
            max: this.options.limits[3],
            h1: 120,
            s1: 73,
            l1: 75,
            h2: 0,
            s2: 79,
            l2: 32
        }, {
            min: this.options.limits[3],
            h: 0,
            s: 79,
            l: 32
        }];

        this.startAnimation();
    }

    public ngOnInit(): void {
        this.refresh();
    }

    public ngOnChanges(changes: { [propertyName: string]: SimpleChange }): void {
        if (changes[this.valueKey]) {
            this.options.value = changes[this.valueKey].currentValue * 100 / 255;
        }
        this.refresh();
    }

    protected getText(textName: string, value?: number): string {
        if (textName === 'valueText') {
            const valueFactor = this.tube.valueFactor || this.ampinfos.valueFactor || 1;
            if (valueFactor && !isNaN(this.options.value)) {
                return `${Math.floor(value * 10) / 10}%`;
            } else {
                return 'n.c.';
            }
        } else {
            return super.getText(textName, value);
        }
    }
}
