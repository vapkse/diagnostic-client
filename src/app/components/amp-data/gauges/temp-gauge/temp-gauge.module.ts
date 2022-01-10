import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TempGaugeComponent } from './temp-gauge.component';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        TempGaugeComponent
    ],
    exports: [
        TempGaugeComponent
    ]
})
export class TempGaugeModule { }
