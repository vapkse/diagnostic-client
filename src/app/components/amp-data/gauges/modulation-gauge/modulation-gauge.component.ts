import { Component, Input, OnChanges, OnInit, SimpleChange } from '@angular/core';

import { AmpDataHeader } from '../../../../common/amp';
import { GaugeBase, GaugeOptions } from '../gauge';

export class ModulationGaugeOptions extends GaugeOptions {
    public constructor() {
        super();
        this.title = 'Modulation';
        this.titleTextSize = 16;
        this.titleTextColor = '#ccc';
        this.valueLineWidth = 22;
        this.valueTextSize = 30;
        this.limitsColor = '#888';
        this.speed = 0.4;
        this.limits = new Array<number>();
        this.valueColor = '#82A4B5';
    }
}

// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
    selector: 'mod-gauge',
    template: '<canvas class="gauge"></canvas>'
})
export class ModulationGaugeComponent extends GaugeBase<ModulationGaugeOptions> implements OnChanges, OnInit {
    @Input() public datas?: AmpDataHeader;
    @Input() public modFactor?: number;
    @Input() public tick = 0;

    protected options = new ModulationGaugeOptions();

    private tickKey = 'tick';
    private modKey = 'mod' as keyof AmpDataHeader;

    public refresh(): void {
        const datas = this.datas;
        const data = this.datas?.[this.modKey];
        if (!datas || data === undefined) {
            return;
        }

        const value = data as number;
        this.options.value = Math.min(100, value * 100 * (this.modFactor || 1) / 255);
        this.options.limits = datas.modlimits ? Object.keys(datas.modlimits).map(key => Math.min(100, (datas.modlimits?.[key] || 0) * 100 * (this.modFactor || 1) / 255)) : new Array<number>();
        this.startAnimation();
    }

    public ngOnChanges(changes: { [propertyName: string]: SimpleChange }): void {
        if (changes[this.tickKey]) {
            this.tick = changes[this.tickKey].currentValue as number;
        }
        this.refresh();
    }

    public ngOnInit(): void {
        this.refresh();
    }

    protected getText(textName: string, value?: number): string {
        if (textName === 'valueText') {
            if (!isNaN(this.options.value)) {
                return `${Math.round(this.options.value * 10) / 10}%`;
            } else {
                return 'n.c.';
            }
        } else if (textName === 'title') {
            return this.options.title;
        } else {
            return super.getText(textName, value);
        }
    }
}
