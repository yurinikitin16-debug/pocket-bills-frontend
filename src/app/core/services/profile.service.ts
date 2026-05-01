import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {UserProfile, UserUpdateRequest} from '../auth/auth.models';
import {environment} from '../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private apiUrl =  `${environment.apiBaseUrl}/users`;

  getMe() {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  updateMe(request: UserUpdateRequest) {
    return this.http.put<UserProfile>(`${this.apiUrl}/me`, request);
  }
}
