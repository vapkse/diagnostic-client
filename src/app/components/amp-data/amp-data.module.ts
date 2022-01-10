import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { AmpControlsModule } from './amp-controls';
import { AmpDataComponent } from './amp-data.component';
import { ModulationGaugeModule } from './gauges/modulation-gauge';
import { OutputGaugeModule } from './gauges/output-gauge';
import { RegulatorGaugeModule } from './gauges/regulator-gauge';
import { StepIndicatorModule } from './gauges/step-indicator';
import { TempGaugeModule } from './gauges/temp-gauge';

@NgModule({
    imports: [
        AmpControlsModule,
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatSlideToggleModule,
        ModulationGaugeModule,
        OutputGaugeModule,
        RegulatorGaugeModule,
        StepIndicatorModule,
        TempGaugeModule
    ],
    declarations: [
        AmpDataComponent
    ],
    exports: [
        AmpDataComponent
    ]
})
export class AmpDataModule { }
