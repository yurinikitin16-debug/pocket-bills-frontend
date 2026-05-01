import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import {TranslationService} from '../../core/i18n/translation.service';
import {AuthService} from '../../core/auth/auth.service';
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private translation = inject(TranslationService);
  private auth = inject(AuthService);

  user = this.auth.getUser();
  t = this.translation.translate.bind(this.translation);
  isMobile = signal(false);

  navItems = [
    { labelKey: 'NAV_DASHBOARD', icon: 'dashboard', route: '/dashboard' },
    { labelKey: 'NAV_READINGS', icon: 'speed', route: '/readings' },
    { labelKey: 'NAV_BILLS', icon: 'receipt_long', route: '/bills' },
    { labelKey: 'NAV_SERVICES', icon: 'home_repair_service', route: '/services', role: 'ADMIN' },
    { labelKey: 'NAV_METERS', icon: 'electric_meter', route: '/meters' },
    { labelKey: 'NAV_PROFILE', icon: 'person', route: '/profile' }
  ];

  visibleNavItems() {
    return this.navItems.filter(item => {
      if (!item.role) return true;
      return this.user?.role === item.role;
    });
  }

  constructor() {
    this.breakpointObserver
      .observe('(max-width: 768px)')
      .subscribe(result => {
        this.isMobile.set(result.matches);
      });
  }
}
