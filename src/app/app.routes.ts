import {Routes} from '@angular/router';
import {LoginComponent} from './features/auth/login/login.component';
import {authGuard} from './core/auth/auth.guard';
import {ShellComponent} from './layout/shell/shell.component';
import {DashboardComponent} from './features/dashboard/dashboard/dashboard.component';
import {RegisterComponent} from './features/auth/register/register.component';
import {ProfileComponent} from './features/profile/profile/profile.component';
import {roleGuard} from './core/auth/role.guard';
import {ServicesComponent} from './features/services/services/services.component';
import {MetersComponent} from './features/meters/meters/meters.component';
import {ReadingsComponent} from './features/readings/readings/readings.component';
import {BillsComponent} from './features/bills/bills/bills.component';

export const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {path: 'dashboard', component: DashboardComponent},
      {path: 'profile', component: ProfileComponent},
      {path: 'bills', component: BillsComponent},
      {path: 'meters', component: MetersComponent},
      {path: 'readings', component: ReadingsComponent},
      {path: 'services', component: ServicesComponent, canActivate: [authGuard, roleGuard], data: {role: 'ADMIN'}}
    ]
  },
  {path: '**', redirectTo: 'login'}
];
