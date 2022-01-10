import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, debounceTime, map, Observable, of, ReplaySubject, switchMap, take, tap, withLatestFrom } from 'rxjs';

import { AmpDataHeader, AmpInfo, AmpParamsRequest } from '../common/amp';
import { shareReplayLast } from '../common/custom-operators';
import { AmpService } from './amp.service';


class CacheInfo {
    public constructor(public timeStamp: number, public params: Map<string, unknown>) { }
}

@Injectable()
export class AmpParamsService {
    public ampInfo$ = new ReplaySubject<AmpInfo>(1);
    public refresh$ = new BehaviorSubject<boolean>(false);

    public currentParams$: Observable<Map<string, unknown>>;

    public lastError: Error;
    private cache = new Map<number, CacheInfo>();

    public constructor(private ampService: AmpService) {

        const sendRequest$ = (id: number): Observable<Map<string, unknown>> => this.ampService.sendRequest$(id, AmpParamsRequest.get('getParams'), 0).pipe(
            switchMap(response => of(Object.keys(response.datas)
                .map(key => key as keyof AmpDataHeader)
                .reduce((m, key) => m.set(key, response.datas[key]), new Map<string, unknown>()))
            )
        );

        this.currentParams$ = combineLatest([this.ampInfo$, this.refresh$]).pipe(
            debounceTime(5),
            withLatestFrom(this.ampService.ampStatusMap$),
            switchMap(([[ampInfo, forceRefresh], ampStatusMap]) => {
                if (!ampInfo) {
                    return of(new Map<string, unknown>());
                }

                const now = Date.now();
                const status = ampStatusMap.get(ampInfo.id);
                const ignoreCache = status?.step < 3;
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
                        return of(null);
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

    public sendRequest$ = (action: string, val?: number): Observable<number> => this.ampInfo$.pipe(
        switchMap(ampInfo => this.ampService.sendRequest$(ampInfo.id, AmpParamsRequest.get(action), val)),
        take(1),
        map(response => {
            if ('resetParams' === action) {
                this.refresh$.next(true);
            }
            return response.datas?.extraValue;
        })
    );
}
