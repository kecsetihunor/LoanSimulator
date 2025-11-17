import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '@layout/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, SidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Loan Simulator';

  sidebarCollapsed = false;
  sidebarOpen = false; // mobile overlay state

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
