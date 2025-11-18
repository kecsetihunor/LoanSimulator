import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CookieService } from '@core/services/cookie.service';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookie-consent.component.html',
  styleUrls: ['./cookie-consent.component.css']
})
export class CookieConsentComponent {
  private cookieService = inject(CookieService);
  private readonly sessionCookieName = 'cookie-consent-dismissed';
  showBanner = false;

  constructor() {
    this.showBanner = !this.cookieService.hasConsent();
  }

  acceptCookies(): void {
    this.cookieService.giveConsent();
    this.showBanner = false;
  }

  dismissForSession(): void {
    // Set a session cookie to hide the banner until the browser is closed
    sessionStorage.setItem(this.sessionCookieName, 'true');
    this.showBanner = false;
  }


}
