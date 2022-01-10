import { RouterModule, Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', loadChildren: (): Promise<unknown> => import('./home/home.module').then(m => m.HomeModule) },
    { path: 'amp', loadChildren: (): Promise<unknown> => import('./amp-details/amp-details.module').then(m => m.AmpDetailsModule) },
    { path: '**', redirectTo: 'home', pathMatch: 'full' }
];

export const routing = RouterModule.forRoot(routes, { useHash: true, relativeLinkResolution: 'legacy' });
