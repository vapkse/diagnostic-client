import { Injectable } from '@angular/core';
import { filter, map, Observable, ReplaySubject, startWith, withLatestFrom } from 'rxjs';

import { AmpDataHeader, AmpInfo, AmpStatus, FieldInfo } from '../common/amp';
import { shareReplayLast } from '../common/custom-operators';
import { AmpService } from './amp.service';

@Injectable()
export class AmpDataService {
    public ampInfo$ = new ReplaySubject<AmpInfo>(1);

    public tempInfos$: Observable<ReadonlyArray<FieldInfo>>;
    public ampData$: Observable<AmpDataHeader>;
    public ampStatus$: Observable<AmpStatus>;

    public constructor(ampService: AmpService) {
        const dataInfos$ = this.ampInfo$.pipe(
            map(ampInfo => ampInfo?.dataInfos),
            filter(ampInfo => !!ampInfo),
            shareReplayLast()
        );

        this.tempInfos$ = dataInfos$.pipe(
            map(dataInfos => dataInfos.find(f => f.name === 'temp')?.fields || new Array<FieldInfo>()),
            shareReplayLast()
        );

        this.ampData$ = ampService.ampData$.pipe(
            withLatestFrom(this.ampInfo$),
            filter(([ampData, ampInfo]) => ampData.id === ampInfo.id),
            map(([ampData]) => ampData.datas),
            shareReplayLast()
        );

        this.ampStatus$ = ampService.ampStatusMap$.pipe(
            withLatestFrom(this.ampInfo$),
            map(([ampStatusMap, ampInfo]) => ampStatusMap.get(ampInfo.id)),
            startWith(undefined as AmpStatus),
            shareReplayLast()
        );
    }
}
