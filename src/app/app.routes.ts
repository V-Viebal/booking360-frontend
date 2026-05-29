import { Routes } from '@angular/router';

import { PublicLandingPageComponent } from './public/public-landing.page';
import { ShopsListPageComponent } from './public/shops-list.page';
import { ShopDetailPageComponent } from './public/shop-detail.page';
import { ShopRegisterPageComponent } from './public/shop-register.page';
import { BookingByTokenPageComponent } from './public/booking-by-token.page';
import { ShopManagePageComponent } from './shop-manage/shop-manage.page';

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
  // --- Public Booking360 (Wave 1, vi-VN) ---
  {
    path: '',
    component: PublicLandingPageComponent,
    data: { kicker: 'Booking360', title: 'Đặt chỗ trước, không còn cảnh chờ', description: 'Trang chủ Booking360' }
  },
  {
    path: 'shops',
    component: ShopsListPageComponent,
    data: { kicker: 'Quán', title: 'Tìm quán có chỗ trống', description: 'Danh sách quán Booking360' }
  },
  {
    path: 'shops/register',
    component: ShopRegisterPageComponent,
    data: { kicker: 'Đăng ký', title: 'Đăng ký quán lên Booking360', description: 'Tự đăng ký barbershop của bạn' }
  },
  {
    path: 'shops/:slug',
    component: ShopDetailPageComponent,
    data: { kicker: 'Quán', title: 'Chi tiết quán', description: 'Đặt chỗ tại quán' }
  },
  {
    path: 'b/:token',
    component: BookingByTokenPageComponent,
    data: { kicker: 'Đặt chỗ', title: 'Lịch đặt của bạn', description: 'Xem hoặc huỷ đặt chỗ' }
  },
  {
    path: 'm/:token',
    component: ShopManagePageComponent,
    data: { kicker: 'Quản lý', title: 'Trang quản lý quán', description: 'Quản lý lịch đặt và cấu hình quán' }
  },

  // --- Operator workspace (legacy, login required) ---
  {
    path: 'callback',
    component: CallbackPageComponent,
    data: { kicker: 'Auth callback', title: 'Đang đăng nhập Booking360', description: 'Khôi phục phiên đăng nhập' }
  },
  {
    path: 'workspace',
    component: WorkspacePageComponent,
    canActivate: [authGuard],
    data: { kicker: 'Workspace', title: 'Trang điều phối', description: 'Bảng điều khiển nội bộ' }
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    data: { kicker: 'Admin', title: 'Quản trị hệ thống', description: 'Khu vực quản trị' },
    children: [
      { path: '', component: AdminPageComponent, data: { kicker: 'Tổng quan', title: 'Tổng quan quản trị', description: 'Tóm tắt hoạt động' } },
      { path: 'resources', component: AdminResourcesPageComponent, data: { kicker: 'Resources', title: 'Quản lý tài nguyên', description: 'Tài nguyên đặt chỗ' } },
      { path: 'users', component: AdminUsersPageComponent, data: { kicker: 'Users', title: 'Quản lý người dùng', description: 'Người dùng và phân quyền' } },
      { path: 'settings', component: AdminSettingsPageComponent, data: { kicker: 'Settings', title: 'Cấu hình nền tảng', description: 'Tuỳ chọn hệ thống' } }
    ]
  },
  {
    path: 'resources',
    component: ResourcesPageComponent,
    canActivate: [authGuard],
    data: { kicker: 'Inventory', title: 'Tài nguyên', description: 'Danh sách tài nguyên' }
  },
  {
    path: 'resources/:id',
    component: ResourceDetailPageComponent,
    canActivate: [authGuard],
    data: { kicker: 'Resource detail', title: 'Chi tiết tài nguyên', description: 'Thông tin tài nguyên' }
  },
  {
    path: 'bookings',
    component: BookingsPageComponent,
    canActivate: [authGuard],
    data: { kicker: 'Bookings', title: 'Quản lý lịch đặt', description: 'Danh sách lịch đặt nội bộ' }
  },
  {
    path: 'bookings/:id',
    component: BookingDetailPageComponent,
    canActivate: [authGuard],
    data: { kicker: 'Booking detail', title: 'Chi tiết lịch đặt', description: 'Xem lịch đặt' }
  },
  {
    path: 'calendar',
    component: CalendarPageComponent,
    canActivate: [authGuard],
    data: { kicker: 'Calendar', title: 'Lịch điều phối', description: 'Lịch ngày/tuần/tháng' }
  },
  {
    path: 'reports',
    component: ReportsPageComponent,
    canActivate: [authGuard],
    data: { kicker: 'Reports', title: 'Báo cáo vận hành', description: 'Số liệu lịch đặt' }
  },

  { path: '**', redirectTo: '' }
];