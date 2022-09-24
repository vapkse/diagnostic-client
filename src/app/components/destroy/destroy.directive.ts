import { Directive, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Directive()
export class DestroyDirective implements OnDestroy {

    protected destroyed$ = new Subject<void>();
    private destroyed = false;

    public ngOnDestroy(): void {
        if (this.destroyed) {
            // Observable already unsubscribed
            // eslint-disable-next-line no-debugger
            debugger;
            return;
        }

        this.destroyed$.next();
        this.destroyed$.unsubscribe();
        this.destroyed = true;
    }
}
