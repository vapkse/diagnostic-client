import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, combineLatestWith, filter, interval, map, mergeWith, Observable, of, ReplaySubject, startWith, Subject, switchMap, take, tap, throwError, timeout, withLatestFrom } from 'rxjs';

import { AmpInfo, AmpInfoInterface, AmpRequestResponse, AmpStatus } from '../common/amp';
import { shareReplayLast } from '../common/custom-operators';

declare let io: (url: string) => {
    on: (event: string, fn: (response: AmpRequestResponse) => void) => void;
};

// eslint-disable-next-line no-shadow
export enum Statuses {
    OFFLINE = 0,
    MAYBE = 1,
    ONLINE = 2,
}

@Injectable({
    providedIn: 'root'
})
export class AmpService {
    public serverUrl$ = new ReplaySubject<string>(1);
    public selectedId$ = new BehaviorSubject<number | undefined>(undefined);
    public currentParamsAmpInfo$ = new Subject<AmpInfo | undefined>();
    public noAdmin$ = new BehaviorSubject<boolean>(false);

    public selectedAmp$: Observable<AmpInfo | undefined>;
    public amplifiers$: Observable<ReadonlyArray<AmpInfo>>;
    public amplifierMap$: Observable<Map<number, AmpInfo>>;
    public isAdmin$: Observable<boolean>;

    public onlineAmps$: Observable<ReadonlyArray<AmpInfo>>;

    public ampStatusMap$: Observable<Map<number, AmpStatus>>;

    public ampData$: Observable<AmpRequestResponse>;

    public constructor(private httpClient: HttpClient) {
        this.isAdmin$ = this.serverUrl$.pipe(
            combineLatestWith(this.noAdmin$),
            map(([serverUrl, noAdmin]) => !serverUrl.startsWith('https://') && !noAdmin)
        );

        this.amplifierMap$ = this.httpClient.get<{ amplist: Record<string, AmpInfoInterface> }>('assets/amplist.json').pipe(
            filter(json => !!json?.amplist),
            map(json => Object.keys(json.amplist).reduce((m, key) => m.set(+key, new AmpInfo(json.amplist[key])), new Map<number, AmpInfo>())),
            tap(amps => {
                amps.forEach(amp => {
                    // Merge values with inherits if exists
                    if (amp.inherits) {
                        const baseSection = amps.get(amp.inherits);
                        if (baseSection) {
                            amp.merge(baseSection);
                        }
                    }
                });
            }),
            shareReplayLast()
        );

        this.amplifiers$ = this.amplifierMap$.pipe(
            map(amps => {
                const amplifiers = Array.from(amps.values());
                this.consolelog(`ampInfos loaded ${amplifiers.length}`, amplifiers);
                return amplifiers;
            }),
            shareReplayLast()
        );

        // Create selected amp stream
        this.selectedAmp$ = combineLatest([this.selectedId$, this.amplifierMap$]).pipe(
            map(([selectedId, amps]) => selectedId && amps.get(selectedId) || undefined)
        );

        // Create socketio stream
        const socketIo$ = interval(100).pipe(
            filter(() => typeof io !== 'undefined'),
            take(1),
            map(() => io),
            tap(() => this.consolelog('Socket io ready.'))
        );

        // Create socket stream
        this.ampData$ = combineLatest([this.serverUrl$, socketIo$]).pipe(
            map(([serverUrl, socketIo]) => {
                const socket = socketIo(serverUrl);
                const ampData$ = new Subject<AmpRequestResponse>();
                socket.on('ampdata', (response: AmpRequestResponse) => {
                    ampData$.next(response);
                });
                return ampData$;
            }),
            shareReplayLast(),
            switchMap(ampData$ => ampData$.asObservable())
        );

        const getTick = (tick: number): string => {
            // Transform tick in seconds
            let tk;
            if (tick >= 120) {
                tk = 3600 * (tick - 119);
            } else if (tick >= 60) {
                tk = 60 * (tick - 59);
            } else {
                tk = tick;
            }
            return this.getInterval(tk);
        };

        this.ampStatusMap$ = this.ampData$.pipe(
            mergeWith(interval(5000).pipe(
                map(() => ({} as AmpRequestResponse))
            )),
            switchMap(ampData => this.ampStatusMap$.pipe(
                withLatestFrom(this.amplifierMap$),
                take(1),
                map(([ampStatusMap, amplifierMap]) => {
                    let statusUpdated = false;
                    if (ampData?.id) {
                        const amp = amplifierMap.get(ampData.id);

                        const status = {
                            id: ampData.id,
                            step: ampData.datas?.step,
                            status: Statuses.ONLINE,
                            statusText: 'online',
                            port: ampData.port,
                            lastseen: Date.now(),
                            interval: ampData.datas?.tick ? getTick(ampData.datas.tick) : undefined,
                            flags: ampData.datas?.ctrlflags && ampData.datas.ctrlflags === 3,
                            master: amp?.master,
                            inherits: amp?.inherits
                        } as AmpStatus;

                        const previousStatus = ampStatusMap.get(ampData.id);
                        if (previousStatus?.status !== status.status || previousStatus?.interval !== status.interval) {
                            statusUpdated = true;
                        }

                        if (status.master) {
                            const master = amplifierMap.get(status.master);
                            if (master) {
                                master.isMaster = true;
                            }
                            ampStatusMap.set(status.master, status);
                        }

                        ampStatusMap.set(ampData.id, status);
                    }

                    // Check timeout
                    const time = Date.now();
                    const newStatusMap = [...ampStatusMap.entries()].reduce((m, entry) => {
                        const status = entry[1];
                        if (status.status === Statuses.ONLINE && time - status.lastseen > 5000) {
                            status.status = Statuses.MAYBE;
                            status.statusText = 'maybe';
                            statusUpdated = true;
                            m.set(entry[0], status);

                        } else if (status.status === Statuses.MAYBE && time - status.lastseen > 10000) {
                            // Status removed (not added to new map)
                            statusUpdated = true;

                        } else {
                            m.set(entry[0], status);
                        }

                        return m;
                    }, new Map<number, AmpStatus>());

                    return statusUpdated ? newStatusMap : undefined;
                })
            )),
            filter(Boolean),
            startWith(new Map<number, AmpStatus>()),
            shareReplayLast()
        );

        // Create online amps stream with timeout
        this.onlineAmps$ = this.ampStatusMap$.pipe(
            withLatestFrom(this.amplifiers$),
            map(([ampStatusMap, amplifiers]) => amplifiers.filter(amp => {
                const status = ampStatusMap.get(amp.id);
                const isOnline = status && status.status !== Statuses.OFFLINE;
                return isOnline;
            })),
            map(ampInfos => ampInfos.sort((ampInfo1, ampInfo2) => (ampInfo1.order || ampInfo1.id) - (ampInfo2.order || ampInfo2.id))),
            startWith(new Array<AmpInfo>()),
            shareReplayLast()
        );
    }

    public sendRequest$(id: number, request: number, value?: number): Observable<AmpRequestResponse> {
        return this.serverUrl$.pipe(
            withLatestFrom(this.ampStatusMap$),
            take(1),
            switchMap(([serverUrl, ampStatusMap]) => {
                const port = ampStatusMap.get(id)?.port;

                console.log(`amprequest on port ${port}, msg: ${id}, request: ${request}, value: ${value}`);

                const params = {
                    port,
                    id,
                    request,
                    value: value || 0
                };

                const host = serverUrl;
                return this.httpClient.post<AmpRequestResponse>(`${host}amprequest`, params).pipe(
                    timeout(15000),
                    take(1)
                );
            }),
            switchMap(response => {
                if (response.error) {
                    // Validation Errors
                    return throwError(() => new Error(response.error));
                }

                if (!response?.datas) {
                    return throwError(() => new Error('Time out'));
                }

                return of(response);
            })
        );
    }

    protected getInterval(sec: number): string {
        const numberEnding = (number: number): string => (number > 1) ? 's' : '';

        const years = Math.floor(sec / 31536000);
        if (years) {
            return `${years} year${numberEnding(years)}`;
        }
        const days = Math.floor((sec %= 31536000) / 86400);
        if (days) {
            return `${days} day${numberEnding(days)}`;
        }
        const hours = Math.floor((sec %= 86400) / 3600);
        if (hours) {
            return `${hours} hour${numberEnding(hours)}`;
        }
        const minutes = Math.floor((sec %= 3600) / 60);
        if (minutes) {
            return `${minutes} minute${numberEnding(minutes)}`;
        }
        const seconds = sec % 60;
        if (seconds) {
            return `${seconds} second${numberEnding(seconds)}`;
        }
        return 'less than a second';
    }

    private consolelog = (_message?: unknown, ..._optionalParams: ReadonlyArray<unknown>): void => {
        console.log(_message, _optionalParams?.length ? _optionalParams : '');
    };
}
