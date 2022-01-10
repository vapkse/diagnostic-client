import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

import { shareReplayLast } from '../common/custom-operators';

export interface AppConfig {
    serverUrl: string;
    noAdmin: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AppConfigService {
    public appConfig$: Observable<AppConfig>;

    public constructor(
        httpClient: HttpClient
    ) {
        this.appConfig$ = httpClient.get<AppConfig>('assets/config.json').pipe(
            catchError(() => of(null as AppConfig)),
            shareReplayLast()
        );
    }
}
