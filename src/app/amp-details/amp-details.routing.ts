import { RouterModule, Routes } from '@angular/router';

import { AmpDetailsComponent } from './amp-details.component'; // './' => Outlet is not activated error

export const routes: Routes = [
    { path: '', component: AmpDetailsComponent },
    { path: ':id', component: AmpDetailsComponent }
];

export const routing = RouterModule.forChild(routes);
