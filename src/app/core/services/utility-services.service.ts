import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  ServiceCreateRequest,
  ServiceUpdateRequest,
  UtilityService
} from '../models/service.model';
import {environment} from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UtilityServicesService {
  private http = inject(HttpClient);
  private apiUrl =  `${environment.apiBaseUrl}/services`;

  getAll() {
    return this.http.get<UtilityService[]>(this.apiUrl);
  }

  create(request: ServiceCreateRequest) {
    return this.http.post<UtilityService>(this.apiUrl, request);
  }

  update(id: number, request: ServiceUpdateRequest) {
    return this.http.put<UtilityService>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
