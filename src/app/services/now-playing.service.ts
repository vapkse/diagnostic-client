import { Injectable } from '@angular/core';
import { combineLatest, filter, interval, map, Observable, ReplaySubject, Subject, switchMap, take, tap } from 'rxjs';

import { shareReplayLast } from '../common/custom-operators';
import { Artist, NowPlayingResponse } from '../common/now-playing';

export interface WebSite {
    name: string;
    url: string;
}

declare let io: (url: string) => {
    on: (event: string, fn: (message: NowPlayingResponse) => void) => void;
};

@Injectable({
    providedIn: 'root'
})
export class NowPlayingService {
    public serverUrl$ = new ReplaySubject<string>(1);

    public nowPlaying$: Observable<NowPlayingResponse>;

    public constructor() {

        // Create socketio stream
        const socketIo$ = interval(100).pipe(
            filter(() => typeof io !== 'undefined'),
            take(1),
            map(() => io),
            tap(socketIo => this.consolelog(socketIo ? 'Socket io ready.' : 'Socket io fail.'))
        );

        // Create socket stream
        this.nowPlaying$ = combineLatest([this.serverUrl$, socketIo$]).pipe(
            take(1),
            map(([serverUrl, socketIo]) => {
                const socket = socketIo(serverUrl);
                const nowPlaying$ = new Subject<NowPlayingResponse>();
                socket.on('nowplaying', (response: NowPlayingResponse) => {
                    nowPlaying$.next(response);
                });
                return nowPlaying$;
            }),
            shareReplayLast(),
            switchMap(nowPlaying$ => nowPlaying$.asObservable())
        );
    }

    public getPictureUrls(artist: Artist): ReadonlyArray<string> {
        const urls = new Array<string>();
        const thumb = artist.strArtistWideThumb || artist.strArtistThumb;
        if (thumb) {
            urls.push(thumb);
        }
        if (artist.strArtistFanart) {
            urls.push(artist.strArtistFanart);
        }
        if (artist.strArtistFanart2) {
            urls.push(artist.strArtistFanart2);
        }
        if (artist.strArtistFanart3) {
            urls.push(artist.strArtistFanart3);
        }
        if (artist.strArtistFanart4) {
            urls.push(artist.strArtistFanart4);
        }
        if (artist.strArtistClearart) {
            urls.push(artist.strArtistClearart);
        }
        if (artist.strArtistLogo) {
            urls.push(artist.strArtistLogo);
        }
        return urls;
    }

    public getBiography(artist: Artist): string {
        return artist.strBiographyFR || artist.strBiographyEN || artist.strBiography || artist.strBiographyDE || artist.strBiographyIT || artist.strBiographyJP || artist.strBiographyRU || artist.strBiographyES || artist.strBiographyPT || artist.strBiographySE || artist.strBiographyNL || artist.strBiographyHU || artist.strBiographyNO || artist.strBiographyIL || artist.strBiographyCN || artist.strBiographyPL;
    }

    public getWebSites(artist: Artist): ReadonlyArray<WebSite> {
        return [
            { name: 'Official', url: artist.strWebsite },
            { name: 'AudioDB', url: artist.strAudioDB },
            { name: 'Facebook', url: artist.strFacebook },
            { name: 'Twitter', url: artist.strTwitter },
            { name: 'MusicBrainz', url: artist.strMusicBrainz }
        ].filter(webSite => !!webSite.url);
    }

    private consolelog = (_message?: unknown, ..._optionalParams: ReadonlyArray<unknown>): void => {
        console.log(_message, _optionalParams?.length ? _optionalParams : '');
    };
}
