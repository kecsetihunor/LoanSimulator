import { Component, LOCALE_ID, Inject, EventEmitter, Output } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Output() sidebarToggled = new EventEmitter<boolean>();

  isCollapsed = false;
  currentLocale: string;

  menuItems: MenuItem[] = [
    { icon: '🧮', label: 'Simple Calculator', route: '/simple' },
    { icon: '⚡', label: 'Advanced Calculator', route: '/advanced', badge: 'New' },
    { icon: '📊', label: 'Compare Loans', route: '/compare' },
    { icon: '⚙️', label: 'Settings', route: '/settings' }
  ];

  locales = [
    { code: 'en-US', label: 'English', flag: '🇬🇧' },
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
}
