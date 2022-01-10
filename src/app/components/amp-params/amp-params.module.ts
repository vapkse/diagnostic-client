import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { DebouncedEventModule } from '../debounced-event/debounced-event.module';
import { AmpParamsComponent } from './amp-params.component';
import { FSliderModule } from './fslider/index';

@NgModule({
    imports: [
        CommonModule,
        DebouncedEventModule,
        FSliderModule,
        MatButtonModule,
        MatIconModule,
        MatSlideToggleModule,
        ReactiveFormsModule
    ],
    declarations: [
        AmpParamsComponent
    ],
    exports: [
        AmpParamsComponent
    ]
})
export class AmpParamsModule { }
