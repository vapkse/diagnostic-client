import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FSliderComponent } from './fslider.component';

@NgModule({
    declarations: [FSliderComponent],
    exports: [FSliderComponent],
    imports: [
        CommonModule,
        FormsModule
    ]
})
export class FSliderModule { }
