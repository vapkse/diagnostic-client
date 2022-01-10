import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { StepIndicatorComponent } from './step-indicator.component';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        StepIndicatorComponent
    ],
    exports: [
        StepIndicatorComponent
    ]
})
export class StepIndicatorModule { }
