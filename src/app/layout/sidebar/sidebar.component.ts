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
    { label: 'Advanced Calculator', route: '/advanced' },
    { label: 'Compare Loans', route: '/compare' },
    { label: 'Settings', route: '/settings' }
  ];

  locales = [
    { code: 'en-US', label: 'English', flag: '🇺🇸' },
    { code: 'ro', label: 'Română', flag: '🇷🇴' }
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
    const currentUrl = this.document.location.pathname;
    let newUrl = currentUrl.replace(/^\/(en-US|ro)\//, '/');
    
    if (locale !== 'en-US') {
      newUrl = `/${locale}${newUrl}`;
    }
    
    this.document.location.href = newUrl;
  }

  ngOnInit(): void {
    this.currencyService.selectedCurrency$.subscribe(cur => {
      this.selectedCurrency = cur;
    });
  }
}
