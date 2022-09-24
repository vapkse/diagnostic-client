import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, debounceTime, filter, map, Observable, of, ReplaySubject, switchMap, take, tap, throwError, withLatestFrom } from 'rxjs';

import { AmpDataHeader, AmpInfo, AmpParamsRequest } from '../common/amp';
import { shareReplayLast } from '../common/custom-operators';
import { AmpService } from './amp.service';


class CacheInfo {
    public constructor(public timeStamp: number, public params: Map<string, unknown>) { }
}

@Injectable()
export class AmpParamsService {
    public ampInfo$ = new ReplaySubject<AmpInfo | undefined>(1);
    public refresh$ = new BehaviorSubject<boolean>(false);

    public currentParams$: Observable<Map<string, unknown> | undefined>;

    public lastError?: Error;
    private cache = new Map<number, CacheInfo>();

    public constructor(private ampService: AmpService) {

        const sendRequest$ = (id: number): Observable<Map<string, unknown> | undefined> => {
            const request = AmpParamsRequest.get('getParams');
            if (request === undefined) {
                return of(undefined);
            }

            return this.ampService.sendRequest$(id, request, 0).pipe(
                map(response => {
                    if (!response?.datas) {
                        return undefined;
                    }

                    const keys = Object.keys(response.datas) as Array<keyof AmpDataHeader>;
                    return keys.reduce((m, key) => {
                        const data = response.datas?.[key];
                        return data !== undefined ? m.set(key, data) : m;
                    }, new Map<string, unknown>());
                })
            );
        };

        this.currentParams$ = combineLatest([this.ampInfo$, this.refresh$]).pipe(
            debounceTime(5),
            withLatestFrom(this.ampService.ampStatusMap$),
            switchMap(([[ampInfo, forceRefresh], ampStatusMap]) => {
                if (!ampInfo) {
                    return of(undefined);
                }

                const now = Date.now();
                const status = ampStatusMap.get(ampInfo.id);
                const ignoreCache = !status || status.step < 3;
                const cacheEntry = !forceRefresh && !ignoreCache && this.cache.get(ampInfo.id);
                if (cacheEntry) {
                    const cacheIsTooOld = now - cacheEntry.timeStamp < 120000;
                    if (!cacheIsTooOld) {
                        return of(cacheEntry.params);
                    }
                }
                // Ensure obsolete cache is deleted
                this.cache.delete(ampInfo.id);
                return sendRequest$(ampInfo.id).pipe(
                    take(1),
                    catchError(err => {
                        this.lastError = err as Error;
                        console.log('Error in param service: ', err);
                        return of(undefined);
                    }),
                    tap(params => {
                        if (params) {
                            this.cache.set(ampInfo.id, new CacheInfo(Date.now(), params));
                        }
                    })
                );
            }),
            shareReplayLast()
        );
    }

    public sendRequest$(action: string, val?: number): Observable<number | undefined> {
        const request = AmpParamsRequest.get(action);
        if (request === undefined) {
            return throwError(() => new Error(`request for action ${action} not found`));
        }

        return this.ampInfo$.pipe(
            filter(Boolean),
            switchMap(ampInfo => this.ampService.sendRequest$(ampInfo.id, request, val).pipe(
                map(response => {
                    if ('resetParams' === action) {
                        this.refresh$.next(true);
                    }
                    return response.datas?.extraValue;
                })
            )),
            take(1)
        );
    }
}
