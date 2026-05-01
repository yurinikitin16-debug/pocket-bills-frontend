import { Injectable, signal } from '@angular/core';
import { AppLanguage } from '../i18n/language.model';
@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private readonly languageKey = 'app_language';

  language = signal<AppLanguage>(
    (localStorage.getItem(this.languageKey) as AppLanguage) || 'UK'
  );

  setLanguage(language: AppLanguage) {
    localStorage.setItem(this.languageKey, language);
    this.language.set(language);
  }

  setLanguageFromUser(user: { lang?: AppLanguage | null }) {
    if (!user.lang) return;

    this.setLanguage(user.lang);
  }
}
