import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ModulationGaugeComponent } from './modulation-gauge.component';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        ModulationGaugeComponent
    ],
    exports: [
        ModulationGaugeComponent
    ]
})
export class ModulationGaugeModule { }
