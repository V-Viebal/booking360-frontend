import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-settings.page.html',
  styleUrl: './admin-settings.page.css'
})
export class AdminSettingsPageComponent {
  protected readonly kicker = 'Settings';
  protected readonly title = 'Platform settings';
  protected readonly description = 'Configure platform settings.';
}