import { Injectable } from '@angular/core';
import { filter, map, Observable, ReplaySubject, startWith, withLatestFrom } from 'rxjs';

import { AmpDataHeader, AmpInfo, AmpStatus, FieldInfo } from '../common/amp';
import { shareReplayLast } from '../common/custom-operators';
import { AmpService } from './amp.service';

@Injectable()
export class AmpDataService {
    public ampInfo$ = new ReplaySubject<AmpInfo | undefined>(1);

    public tempInfos$: Observable<ReadonlyArray<FieldInfo>>;
    public ampData$: Observable<AmpDataHeader>;
    public ampStatus$: Observable<AmpStatus>;

    public constructor(ampService: AmpService) {
        const ampInfo$ = this.ampInfo$.pipe(
            filter(Boolean),
            shareReplayLast()
        );

        const dataInfos$ = ampInfo$.pipe(
            map(ampInfo => ampInfo?.dataInfos),
            filter(Boolean),
            shareReplayLast()
        );

        this.tempInfos$ = dataInfos$.pipe(
            filter(Boolean),
            map(dataInfos => dataInfos.find(f => f.name === 'temp')?.fields || new Array<FieldInfo>()),
            shareReplayLast()
        );

        this.ampData$ = ampService.ampData$.pipe(
            withLatestFrom(ampInfo$),
            map(([ampData, ampInfo]) => ampData.id === ampInfo.id ? ampData.datas : undefined),
            filter(Boolean),
            shareReplayLast()
        );

        this.ampStatus$ = ampService.ampStatusMap$.pipe(
            withLatestFrom(ampInfo$),
            map(([ampStatusMap, ampInfo]) => ampStatusMap.get(ampInfo.id)),
            filter(Boolean),
            startWith({} as AmpStatus),
            shareReplayLast()
        );
    }
}
