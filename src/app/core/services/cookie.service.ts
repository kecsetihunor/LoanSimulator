import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  private readonly isBrowser: boolean;
  private readonly consentCookieName = 'user-consent';

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Gives consent by setting a consent cookie.
   */
  public giveConsent(): void {
    this.setCookie(this.consentCookieName, 'true', 365);
  }

  /**
   * Checks if the user has given consent.
   */
  public hasConsent(): boolean {
    return this.getCookie(this.consentCookieName) === 'true';
  }

  /**
   * Retrieves a cookie by name.
   */
  public getCookie(name: string): string | null {
    if (!this.isBrowser) {
      return null;
    }
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /**
   * Sets a cookie.
   */
  public setCookie(name: string, value: string, days: number): void {
    if (!this.isBrowser) {
      return;
    }
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
  }
}
