import { Injectable, inject } from '@angular/core';
import { ERROR_TRANSLATIONS } from './error-translations';
import { UserPreferencesService } from '../preferences/user-preferences.service';
import {UI_TRANSLATIONS} from './ui-translations';
@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  constructor() { }

  private preferences = inject(UserPreferencesService);

  error(code?: string): string {
    const language = this.preferences.language();
    if (!code) {
      return ERROR_TRANSLATIONS['UNKNOWN_ERROR'][language];
    }
    return (
      ERROR_TRANSLATIONS[code]?.[language] ||
      ERROR_TRANSLATIONS['UNKNOWN_ERROR'][language]
    );
  }

  translate(key: string): string {
    const language = this.preferences.language();

    return (
      UI_TRANSLATIONS[key]?.[language] ||
      ERROR_TRANSLATIONS[key]?.[language] ||
      key
    );
  }
}
