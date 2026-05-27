import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-users.page.html',
  styleUrl: './admin-users.page.css'
})
export class AdminUsersPageComponent {
  protected readonly kicker = 'Users';
  protected readonly title = 'User management';
  protected readonly description = 'Manage users and roles.';
}