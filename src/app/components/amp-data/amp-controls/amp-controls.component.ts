import { ChangeDetectionStrategy, Component, Input, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, debounceTime, delay, filter, map, mergeWith, Observable, of, startWith, Subject, switchMap, take, takeUntil } from 'rxjs';

import { AmpInfo, AmpParamsRequest } from '../../../common/amp';
import { shareReplayLast } from '../../../common/custom-operators';
import { AmpService } from '../../../services';
import { DestroyDirective } from '../../destroy/destroy.directive';

class Message {
    public constructor(public content: string, public duration: number, public type?: string) { }
}

@Component({
    selector: 'amp-controls',
    templateUrl: './amp-controls.component.html',
    styleUrls: ['./amp-controls.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AmpControlsComponent extends DestroyDirective {
    @Input() public ampInfo?: AmpInfo;

    @ViewChild('snackBarTemplate', { static: false })
    private snackBarTemplate?: TemplateRef<unknown>;

    public reset$ = new Subject<void>();
    public action$ = new Subject<string>();

    public onReset$: Observable<boolean>;

    public constructor(public ampService: AmpService, private snackBar: MatSnackBar) {
        super();

        const reset$ = this.reset$.pipe(
            debounceTime(100),
            map(() => true)
        );

        const sendReset$ = reset$.pipe(
            switchMap(() => this.onReset$.pipe(
                take(1),
                filter(Boolean)
            )),
            map(() => 'reset')
        );

        const timeOut$ = reset$.pipe(
            filter(Boolean),
            delay(3000),
            mergeWith(sendReset$),
            map(() => false)
        );

        this.onReset$ = reset$.pipe(
            mergeWith(timeOut$),
            delay(1),
            startWith(false),
            shareReplayLast()
        );

        this.action$.pipe(
            mergeWith(sendReset$),
            switchMap(action => {
                if (!this.ampInfo) {
                    this.showMessage(new Message('AmpInfos not available', 30000, 'danger'));
                    return of(undefined);
                }

                const request = AmpParamsRequest.get(action);
                if (!request) {
                    this.showMessage(new Message('Invalid request', 30000, 'danger'));
                    return of(undefined);
                }

                return this.ampService.sendRequest$(this.ampInfo.id, request).pipe(
                    take(1),
                    catchError((err: unknown) => {
                        let message: string;
                        const error = err as Record<string, unknown>;
                        if (typeof error === 'object') {
                            message = Object.keys(error)
                                .filter(key => typeof error[key] === 'string')
                                .map(key => `${key}: ${error[key] as string}`)
                                .join('\n');
                        } else {
                            message = err as string;
                        }

                        this.showMessage(new Message(message, 30000, 'danger'));
                        return of(undefined);
                    })
                );
            }),
            takeUntil(this.destroyed$)
        ).subscribe(response => {
            if (response) {
                this.showMessage(new Message('Success', 2000));
            }
        });
    }

    private showMessage(message: Message): void {
        if (!this.snackBarTemplate) {
            console.error(message);
            return;
        }

        this.snackBar.openFromTemplate(this.snackBarTemplate, {
            duration: message.duration,
            data: message,
            panelClass: message.type ? ['message-template', message.type] : ['message-template']
        });
    }
}
