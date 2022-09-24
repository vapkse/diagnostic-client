import { Component, Input, OnChanges, OnInit, SimpleChange } from '@angular/core';

import { AmpInfo, Tubeinfo } from '../../../../common/amp';
import { GaugeBase, GaugeOptions } from '../gauge';

export class RegulatorGaugeOptions extends GaugeOptions {
    public unit: string;

    public constructor() {
        super();
        this.titleTextSize = 16;
        this.titleTextColor = '#ccc';
        this.valueLineWidth = 15;
        this.valueTextSize = 35;
        this.refColor = '#ccc';
        this.refLineWidth = 8;
        this.refTextSize = 14;
        this.limitsColor = 'red';
        this.speed = 5;
        this.unit = 'mA';
    }
}

// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
    selector: 'regulator-gauge',
    template: '<canvas class="gauge"></canvas>'
})
export class RegulatorGaugeComponent extends GaugeBase<RegulatorGaugeOptions> implements OnChanges, OnInit {
    @Input() public value = 0;
    @Input() public tube?: Tubeinfo;
    @Input() public ref = 0;
    @Input() public min = 0;
    @Input() public max = 0;
    @Input() public ampinfos?: AmpInfo;
    @Input() public error = false;

    protected options = new RegulatorGaugeOptions();

    private valueKey = 'value';
    private titleKey = 'title';
    private refKey = 'ref';
    private minKey = 'min';
    private maxKey = 'max';
    private unitKey = 'unit';
    private errorKey = 'error';

    public refresh(): void {
        this.options.valueColor = [{
            max: 0.1,
            color: '#ccc'
        }, {
            min: 0.1,
            max: this.options.limits[0] - 10,
            h: 195,
            s: 53,
            l: 79
        }, {
            min: this.options.limits[0] - 10,
            max: this.options.reference - 10,
            h1: 195,
            s1: 53,
            l1: 79,
            h2: 120,
            s2: 73,
            l2: 75
        }, {
            min: this.options.reference - 10,
            max: this.options.reference + 10,
            h: 120,
            s: 73,
            l: 75
        }, {
            min: this.options.reference + 10,
            max: this.options.limits[1] + 1,
            h1: 120,
            s1: 73,
            l1: 75,
            h2: 0,
            s2: 79,
            l2: 32
        }, {
            min: this.options.limits[1] + 1,
            h: 0,
            s: 79,
            l: 32
        }];

        this.startAnimation();
    }

    public ngOnChanges(changes: { [propertyName: string]: SimpleChange }): void {
        const options = this.options;

        if (changes[this.valueKey]) {
            options.value = changes[this.valueKey].currentValue * 100 / 255;
        }
        if (changes[this.titleKey]) {
            options.title = changes[this.titleKey].currentValue as string;
        }
        if (changes[this.refKey]) {
            options.reference = changes[this.refKey].currentValue * 100 / 255;
        }
        if (changes[this.minKey]) {
            options.limits = [changes[this.minKey].currentValue * 100 / 255, ...options.limits.slice(1)];
        }
        if (changes[this.maxKey]) {
            options.limits = [options.limits[0], changes[this.maxKey].currentValue * 100 / 255];
        }
        if (changes[this.unitKey]) {
            options.unit = changes[this.unitKey].currentValue as string;
        }
        if (changes[this.errorKey]) {
            options.error = changes[this.errorKey].currentValue as boolean;
        }
        this.refresh();
    }

    public ngOnInit(): void {
        if (!this.tube || !this.ampinfos) {
            console.error('ampinfos or tube not available');
            return;
        }

        const options = this.options;
        options.value = this.value * 100 / 255;
        options.title = this.tube.name;
        options.reference = this.ref * 100 / 255;
        options.unit = this.tube.valueUnit || this.ampinfos.valueUnit || 'mA';
        options.limits = [this.min * 100 / 255, this.max * 100 / 255];
        options.error = this.error;
        this.refresh();
    }

    protected getText(textName: string, value?: number): string {
        if (!this.tube || !this.ampinfos) {
            console.error('ampinfos or tube not available');
            return '';
        }

        const options = this.options;
        const valueOffset = this.tube.valueOffset || this.ampinfos.valueOffset || 0;
        const valueFactor = this.tube.valueFactor || this.ampinfos.valueFactor || 1;
        const refFactor = this.tube.refFactor || this.ampinfos.refFactor || 1;
        const refOffset = this.tube.refOffset || this.ampinfos.refOffset || 0;
        const unit = this.tube.valueUnit || this.ampinfos.valueUnit || 'mA';

        if (textName === 'valueText') {
            if (valueFactor && !isNaN(this.options.value)) {
                return `${Math.round((options.value * valueFactor + valueOffset) * 10) / 10} ${unit}`;
            } else {
                return 'n.c.';
            }
        } else if (textName === 'refText') {
            if (refFactor && !isNaN(this.options.reference)) {
                return `${Math.round((options.reference * refFactor + refOffset) * 10) / 10} ${unit}`;
            } else {
                return '';
            }
        } else if (textName === 'title') {
            return options.title;
        } else {
            return super.getText(textName, value);
        }
    }
}
