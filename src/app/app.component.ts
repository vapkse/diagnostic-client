import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenavContainer } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatestWith, debounceTime, Subject, takeUntil, withLatestFrom } from 'rxjs';

import { DestroyDirective } from './components/destroy/destroy.directive';
import { AmpService, NavigationService } from './services';
import { AppConfigService } from './services/app-config.service';
import { NowPlayingService } from './services/now-playing.service';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent extends DestroyDirective {
    @ViewChild(MatSidenavContainer, { static: false })
    public sideNav?: MatSidenavContainer;

    public socketIoScript?: HTMLScriptElement;
    public select$ = new Subject<number | undefined>();

    public constructor(
        public ampService: AmpService,
        public navigationService: NavigationService,
        private ngLocation: Location,
        private router: Router,
        route: ActivatedRoute,
        nowPlayingService: NowPlayingService,
        appConfigService: AppConfigService
    ) {
        super();

        route.queryParams.pipe(
            combineLatestWith(appConfigService.appConfig$),
            debounceTime(300),
            takeUntil(this.destroyed$)
        ).subscribe(([queryParams, appConfig]) => {
            // Port +1 is HTTPS, port +2 is HTTP
            const serverUrlParam = queryParams.serverurl as string;
            let serverUrl = serverUrlParam || appConfig.serverUrl || 'http://localhost:890';
            console.log('serverUrl', serverUrl);

            if (!serverUrl.endsWith('/')) {
                serverUrl = `${serverUrl}/`;
            }

            ampService.serverUrl$.next(serverUrl);
            nowPlayingService.serverUrl$.next(serverUrl);

            const noAdminUrlParam = queryParams.noadmin as string;
            const noAdmin = noAdminUrlParam === '' || noAdminUrlParam === 'true' || appConfig.noAdmin;
            ampService.noAdmin$.next(noAdmin);

            const head = document.getElementsByTagName('head')[0];

            if (this.socketIoScript) {
                head.removeChild(this.socketIoScript);
            }

            try {
                this.socketIoScript = document.createElement('script');
                this.socketIoScript.type = 'text/javascript';
                this.socketIoScript.src = `${serverUrl}socket.io/socket.io.js`;
                head.appendChild(this.socketIoScript);
            } catch (e) {
                console.error(e);
            }
        });

        this.select$.pipe(
            debounceTime(100),
            withLatestFrom(ampService.selectedId$),
            takeUntil(this.destroyed$)
        ).subscribe(([id, selectedId]) => {
            const url = id ? `amp/${id}` : 'home';
            const urlTree = this.router.createUrlTree([url], { queryParamsHandling: 'preserve' });
            if (selectedId && id) {
                this.ngLocation.go(this.router.serializeUrl(urlTree));
                this.ampService.selectedId$.next(id);
            } else {
                void this.router.navigateByUrl(urlTree);
            }

            void this.sideNav?.start?.close();
        });
    }
}
