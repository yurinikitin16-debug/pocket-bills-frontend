import { AppLanguage } from './language.model';

export const ERROR_TRANSLATIONS: Record<string, Record<AppLanguage, string>> = {
  INVALID_CREDENTIALS: {
    EN: 'Invalid email or password',
    UK: 'Невірний email або пароль'
  },

  ACCOUNT_DISABLED: {
    EN: 'Your account is disabled',
    UK: 'Ваш обліковий запис вимкнено'
  },

  VALIDATION_ERROR: {
    EN: 'Please check the form fields',
    UK: 'Перевірте правильність заповнення полів'
  },

  UNKNOWN_ERROR: {
    EN: 'Something wENt wrong',
    UK: 'Щось пішло не так'
  },
  USER_ALREADY_EXISTS: {
    EN: 'User with this email already exists',
    UK: 'Користувач з таким email вже існує'
  },
  PROFILE_LOAD_FAILED: {
    EN: 'Failed to load profile',
    UK: 'Не вдалося завантажити профіль'
  }
};
