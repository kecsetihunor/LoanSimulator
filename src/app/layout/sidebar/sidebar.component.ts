import { Component, LOCALE_ID, Inject, EventEmitter, Output, Input, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CurrencyPickerComponent } from '@layout/currency/currency-picker/currency-picker.component';
import { CurrencyService, Currency } from '@core/services/currency.service';

interface MenuItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPickerComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Output() sidebarToggled = new EventEmitter<boolean>();
  @Input() mobileShow = false;

  private _collapsed = false
  @Input()
  set collapsed(value: boolean) {
    this._collapsed = value;
  }
  get collapsed(): boolean {
    return this._collapsed;
  }

  currentLocale: string;
  selectedCurrency: Currency | null = null;
  private currencyService = inject(CurrencyService);

  menuItems: MenuItem[] = [
    { label: 'Simple Calculator', route: '/simple' },
    { label: 'Advanced Calculator', route: '/advanced' }
    // { label: 'Compare Loans', route: '/compare' },
    // { label: 'Settings', route: '/settings' }
  ];

  locales = [
    { code: 'ro', label: 'Română', flag: '🇷🇴' },
    { code: 'en', label: 'English', flag: '🇺🇸' }
  ];

  constructor(
    @Inject(LOCALE_ID) locale: string,
    @Inject(DOCUMENT) private document: Document
  ) {
    // Normalize locale: 'en-US' or 'en' both map to 'en', 'ro' stays 'ro'
    this.currentLocale = locale.startsWith('en') ? 'en' : 'ro';
  }

  toggleSidebar() {
    this._collapsed = !this._collapsed;
    this.sidebarToggled.emit(this._collapsed);
  }

  switchLanguage(locale: string) {
    const currentPath = this.document.location.pathname;
    console.log('[switchLanguage] clicked locale=', locale, 'currentPath=', currentPath);

    // Remove existing locale prefix from the path (handles both /en/ and / prefixes)
    // This regex removes /en or /ro prefix if present at the start
    let newPath = currentPath.replace(/^\/(en|ro)\/?/, '');
    
    // Ensure path starts with /
    if (!newPath.startsWith('/')) {
      newPath = '/' + newPath;
    }

    // If switching to English, prefix with /en/
    // Note: locale codes can be 'en' or 'en-US' etc., so check if it starts with 'en'
    if (locale.startsWith('en')) {
      newPath = '/en' + newPath;
    }
    // For Romanian (locale code 'ro'), just use the path as-is (already has leading /)

    // Redirect to new URL
    this.document.location.href = newPath;
  }

  ngOnInit(): void {
    this.currencyService.selectedCurrency$.subscribe(cur => {
      this.selectedCurrency = cur;
    });
  }
}
