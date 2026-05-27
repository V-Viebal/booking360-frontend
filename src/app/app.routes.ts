import { Routes } from '@angular/router';

import { HomePageComponent } from './home.page';
import { ResourcesPageComponent } from './resources.page';
import { ResourceDetailPageComponent } from './resource-detail.page';
import { BookingsPageComponent } from './bookings.page';
import { BookingDetailPageComponent } from './booking-detail.page';
import { CalendarPageComponent } from './calendar.page';
import { CallbackPageComponent } from './callback.page';
import { WorkspacePageComponent } from './workspace.page';
import { AdminPageComponent } from './admin.page';
import { AdminResourcesPageComponent } from './admin-resources.page';
import { AdminUsersPageComponent } from './admin-users.page';
import { AdminSettingsPageComponent } from './admin-settings.page';
import { ReportsPageComponent } from './reports.page';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    data: {
      kicker: 'Mission control',
      title: 'Booking360 dashboard',
      description: 'Live foundation status, resource availability, and operator entry points.'
    }
  },
  {
    path: 'callback',
    component: CallbackPageComponent,
    data: {
      kicker: 'Auth callback',
      title: 'Signing you into Booking360',
      description: 'The workspace is restoring your authenticated operator session.'
    }
  },
  {
    path: 'workspace',
    component: WorkspacePageComponent,
    canActivate: [authGuard],
    data: {
      kicker: 'Control hub',
      title: 'Workspace cockpit',
      description: 'Session state, quick actions, and the next operator workflows.'
    }
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    data: {
      kicker: 'Admin boundary',
      title: 'Admin operations overview',
      description: 'Role-gated admin panel'
    },
    children: [
      { path: '', component: AdminPageComponent, data: { kicker: 'Overview', title: 'Admin overview', description: 'Workspace activity and sync status' } },
      { path: 'resources', component: AdminResourcesPageComponent, data: { kicker: 'Resources', title: 'Resource management', description: 'Manage bookable resources' } },
      { path: 'users', component: AdminUsersPageComponent, data: { kicker: 'Users', title: 'User management', description: 'Manage users and roles' } },
      { path: 'settings', component: AdminSettingsPageComponent, data: { kicker: 'Settings', title: 'Platform settings', description: 'Configure platform settings' } }
    ]
  },
  {
    path: 'resources',
    component: ResourcesPageComponent,
    canActivate: [authGuard],
    data: { kicker: 'Inventory', title: 'Resources browser', description: 'Browse bookable resources, filter by type and availability.' }
  },
  {
    path: 'resources/:id',
    component: ResourceDetailPageComponent,
    canActivate: [authGuard],
    data: { kicker: 'Resource detail', title: 'Resource details', description: 'View resource details, availability, and booking history.' }
  },
  {
    path: 'bookings',
    component: BookingsPageComponent,
    canActivate: [authGuard],
    data: { kicker: 'Booking ops', title: 'Bookings management', description: 'View and manage bookings.' }
  },
  {
    path: 'bookings/:id',
    component: BookingDetailPageComponent,
    canActivate: [authGuard],
    data: { kicker: 'Booking detail', title: 'Booking review', description: 'View booking details, customer info, and resource assignment.' }
  },
  {
    path: 'calendar',
    component: CalendarPageComponent,
    canActivate: [authGuard],
    data: { kicker: 'Schedule', title: 'Calendar workspace', description: 'Daily, weekly, and monthly booking calendar views.' }
  },
  {
    path: 'reports',
    component: ReportsPageComponent,
    canActivate: [authGuard],
    data: { kicker: 'Reporting', title: 'Operations reporting', description: 'Booking metrics and revenue summaries.' }
  },
  { path: '**', redirectTo: '' }
];