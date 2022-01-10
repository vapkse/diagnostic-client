import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { OutputGaugeComponent } from './output-gauge.component';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        OutputGaugeComponent
    ],
    exports: [
        OutputGaugeComponent
    ]
})
export class OutputGaugeModule { }
