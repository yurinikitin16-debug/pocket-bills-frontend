import {AppLanguage} from '../i18n/language.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone?: string;
  fullName?: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: UserProfile;
}

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  enabled: boolean;
  lang: AppLanguage;
}

export interface UserUpdateRequest {
  fullName?: string;
  phone?: string;
  lang?: AppLanguage;
}
