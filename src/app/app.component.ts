import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '@layout/sidebar/sidebar.component';
import { CookieConsentComponent } from '@core/components/cookie-consent.component'
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, SidebarComponent, CommonModule, CookieConsentComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('pageTitleRef', { static: true }) pageTitleRef!: ElementRef<HTMLElement>;

  sidebarCollapsed = false;
  sidebarOpen = false; // mobile overlay state

  constructor(private title: Title) {}

  ngAfterViewInit(): void {
    const translatedTitle = this.pageTitleRef.nativeElement.textContent?.trim() || '';
    if (translatedTitle) {
      this.title.setTitle(translatedTitle);
    }
  }

  onClick() {
    this.sidebarOpen = !this.sidebarOpen;
    if (this.sidebarOpen && this.sidebarCollapsed) {
      this.sidebarCollapsed = false;
    }
  }

  onSidebarToggle(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
    // ensure mobile overlay is closed when collapsing from inside sidebar
    if (this.sidebarOpen && collapsed) {
      this.sidebarOpen = false;
    }
  }
}
