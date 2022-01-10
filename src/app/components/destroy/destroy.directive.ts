/*
 *  @license
 *  Copyright Hôpitaux Universitaires de Genève. All Rights Reserved.
 *
 *  Use of this source code is governed by an Apache-2.0 license that can be
 *  found in the LICENSE file at https://github.com/DSI-HUG/dejajs-components/blob/master/LICENSE
 */

import { Directive, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Directive()
export class DestroyDirective implements OnDestroy {

    protected destroyed$ = new Subject<void>();

    public ngOnDestroy(): void {
        if (!this.destroyed$) {
            // Observable already unsubscribed
            // eslint-disable-next-line no-debugger
            debugger;
            return;
        }

        this.destroyed$.next();
        this.destroyed$.unsubscribe();
        this.destroyed$ = null;
    }
}
