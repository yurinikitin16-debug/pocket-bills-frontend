import { Component, inject } from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/auth/auth.service';
import {TranslationService} from '../../../core/i18n/translation.service';
import {APP_ROUTES, getAfterAuthRoute} from '../../../core/constants/app-routes';
import {UserPreferencesService} from '../../../core/preferences/user-preferences.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private translation = inject(TranslationService);
  private preferences = inject(UserPreferencesService);

  hidePassword = true;
  loading = false;
  errorMessage = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.authService.saveAuth(response);
        this.preferences.setLanguageFromUser(response.user);
        this.router.navigateByUrl(getAfterAuthRoute(response.user));
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 0) {
          this.errorMessage = this.translation.error('SERVER_UNAVAILABLE');
        } else {
          const errorCode = error.error?.errorCode;
          this.errorMessage = this.translation.error(errorCode);
        }
        this.loading = false;
      }
    });
  }
}
