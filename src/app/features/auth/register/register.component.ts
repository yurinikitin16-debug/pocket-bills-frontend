import {CommonModule} from '@angular/common';
import {Component, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import {Router, RouterLink} from '@angular/router';

import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

import {AuthService} from '../../../core/auth/auth.service';
import {TranslationService} from '../../../core/i18n/translation.service';
import {getAfterAuthRoute} from '../../../core/constants/app-routes';
import {UserPreferencesService} from '../../../core/preferences/user-preferences.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  hidePassword = true;
  loading = false;
  errorMessage = '';
  private fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    fullName: ['', [Validators.required]],
    phone: ['']
  });
  private authService = inject(AuthService);
  private translation = inject(TranslationService);
  private router = inject(Router);
  private preferences = inject(UserPreferencesService);

  submit() {
    if (this.loading) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.authService.saveAuth(response);
        this.preferences.setLanguageFromUser(response.user);
        this.router.navigateByUrl(getAfterAuthRoute(response.user));

      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 0) {
          this.errorMessage = this.translation.error('SERVER_UNAVAILABLE');
        } else {
          this.errorMessage = this.translation.error(error.error?.errorCode);
        }

        this.loading = false;
      }
    });
  }
}
