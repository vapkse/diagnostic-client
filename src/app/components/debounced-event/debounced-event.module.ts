import { NgModule } from '@angular/core';

import { DebouncedEventDirective } from './debounced-event-directive';

@NgModule({
    declarations: [
        DebouncedEventDirective
    ],
    exports: [
        DebouncedEventDirective
    ]
})
export class DebouncedEventModule { }
