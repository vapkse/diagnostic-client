import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SliderComponent } from './slider.component';
import { SliderItemDirective } from './slider-item.directive';

@NgModule({
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule
    ],
    declarations: [
        SliderComponent,
        SliderItemDirective
    ],
    exports: [
        SliderComponent,
        SliderItemDirective
    ]
})
export class SliderModule { }
