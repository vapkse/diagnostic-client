import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AmpDetailsComponent } from './amp-details.component';
import { routing } from './amp-details.routing';

@NgModule({
    imports: [
        CommonModule,
        routing
    ],
    declarations: [
        AmpDetailsComponent
    ]
})
export class AmpDetailsModule { }
