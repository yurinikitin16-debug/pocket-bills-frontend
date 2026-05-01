import { CommonModule } from '@angular/common';
import {Component, inject, OnInit} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProfileService } from '../../../core/services/profile.service';
import {UserProfile} from '../../../core/auth/auth.models';
import {TranslationService} from '../../../core/i18n/translation.service';
import {UserPreferencesService} from '../../../core/preferences/user-preferences.service';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {AppLanguage} from '../../../core/i18n/language.model';
import {APP_ROUTES} from '../../../core/constants/app-routes';
import {Router} from '@angular/router';
import {AuthService} from '../../../core/auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private translation = inject(TranslationService);
  private preferences = inject(UserPreferencesService);
  t = this.translation.translate.bind(this.translation);

  private auth = inject(AuthService);
  private router = inject(Router);


  user: UserProfile | null = null;
  loading = true;
  errorMessage = '';

  private fb = inject(FormBuilder);

  editMode = false;
  saving = false;

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.maxLength(255)]],
    phone: ['', [Validators.maxLength(50)]],
    lang: ['uk' as AppLanguage, [Validators.maxLength(2)]]
  });

  ngOnInit() {
    this.profileService.getMe().subscribe({
      next: (user) => {
        this.user = user;
        this.preferences.setLanguageFromUser(user);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 0) {
          this.errorMessage = this.translation.error('SERVER_UNAVAILABLE');
        } else {
          const code = error.error?.errorCode || 'PROFILE_LOAD_FAILED';
          this.errorMessage = this.translation.error(code);
        }

        this.loading = false;
      }
    });
  }

  startEdit() {
    if (!this.user) return;

    this.editMode = true;

    this.form.patchValue({
      fullName: this.user.fullName || '',
      phone: this.user.phone || '',
      lang: this.user.lang || 'uk'
    });
  }

  cancelEdit() {
    this.editMode = false;
    this.errorMessage = '';
  }

  save() {
    if (!this.user || this.saving) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.profileService.updateMe(this.form.getRawValue()).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.preferences.setLanguageFromUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        this.editMode = false;
        this.saving = false;
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 0) {
          this.errorMessage = this.translation.error('SERVER_UNAVAILABLE');
        } else {
          this.errorMessage = this.translation.error(error.error?.errorCode || 'PROFILE_UPDATE_FAILED');
        }

        this.saving = false;
      }
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl(APP_ROUTES.LOGIN);
  }
}
