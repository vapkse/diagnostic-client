import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { RegulatorGaugeComponent } from './regulator-gauge.component';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        RegulatorGaugeComponent
    ],
    exports: [
        RegulatorGaugeComponent
    ]
})
export class RegulatorGaugeModule { }
