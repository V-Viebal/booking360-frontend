import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  templateUrl: './callback.page.html',
  styleUrl: './callback.page.css'
})
export class CallbackPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly kicker = 'Auth callback';
  protected readonly title = 'Signing you into Booking360';
  protected readonly description = 'The workspace is restoring your authenticated operator session.';

  async ngOnInit(): Promise<void> {
    try {
      const completed = await this.auth.completeLogin();
      if (!completed) {
        await this.router.navigateByUrl('/');
      }
    } catch (error) {
      console.error('Auth callback failed', error);
      await this.router.navigateByUrl('/');
    }
  }
}