import { Component, LOCALE_ID, Inject, EventEmitter, Output, inject } from '@angular/core';
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

  isCollapsed = false;
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
    { code: 'en-US', label: 'English', flag: '🇺🇸' }
  ];

  constructor(
    @Inject(LOCALE_ID) locale: string,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.currentLocale = locale;
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggled.emit(this.isCollapsed);
  }

  switchLanguage(locale: string) {
    const currentPath = this.document.location.pathname;

    // Remove existing locale prefix from the path
    let newPath = currentPath.replace(/^\/(en|ro)(\/|$)/, '/');

    // If switching to English, prefix with /en/, else Romanian root is just /
    if (locale === 'en') {
      newPath = `/en${newPath}`;
    }

    // Redirect to new URL
    this.document.location.href = newPath;
  }

  ngOnInit(): void {
    this.currencyService.selectedCurrency$.subscribe(cur => {
      this.selectedCurrency = cur;
    });
  }
}
