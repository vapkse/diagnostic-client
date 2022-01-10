import { Component, Input, OnChanges, OnInit, SimpleChange } from '@angular/core';

import { TempSensorInfo } from '../../../../common/amp';
import { GaugeBase, GaugeOptions } from '../gauge';

export class TempGaugeOptions extends GaugeOptions {
    public constructor() {
        super();
        this.titleTextSize = 16;
        this.titleTextColor = '#ccc';
        this.valueLineWidth = 22;
        this.valueTextSize = 30;
        this.limitsColor = null;
        this.speed = 0.4;
        this.limits = [45, 80];
    }
}

// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
    selector: 'temp-gauge',
    template: '<canvas class="gauge"></canvas>'
})
export class TempGaugeComponent extends GaugeBase<TempGaugeOptions> implements OnChanges, OnInit {
    @Input() public value = 0;
    @Input() public sensorInfos: TempSensorInfo;

    protected options = new TempGaugeOptions();

    private valueKey = 'value';

    public refresh(): void {
        this.options.valueColor = [{
            max: 0.1,
            color: '#ccc'
        }, {
            min: 0.1,
            max: this.options.limits[0],
            h: 120,
            s: 73,
            l: 75
        }, {
            min: this.options.limits[0],
            max: this.options.limits[1],
            h1: 120,
            s1: 73,
            l1: 75,
            h2: 0,
            s2: 79,
            l2: 32
        }, {
            min: this.options.limits[1],
            h: 0,
            s: 79,
            l: 32
        }];

        this.startAnimation();
    }

    public ngOnChanges(changes: { [propertyName: string]: SimpleChange }): void {
        if (changes[this.valueKey]) {
            this.options.value = changes[this.valueKey].currentValue * (this.sensorInfos.factor || 1) + (this.sensorInfos.offset || 0);
        }
        this.refresh();
    }

    public ngOnInit(): void {
        this.options.value = this.value * (this.sensorInfos.factor || 1) + (this.sensorInfos.offset || 0);
        this.refresh();
    }

    protected getText(textName: string, value?: number): string {
        if (textName === 'valueText') {
            return !isNaN(this.options.value) ? `${Math.round(value)}${String.fromCharCode(0xB0, 0x43)}` : 'n.c.';
        } else if (textName === 'title') {
            return this.sensorInfos.name;
        } else {
            return super.getText(textName, value);
        }
    }
}
