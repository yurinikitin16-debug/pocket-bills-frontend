import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Meter,
  MeterCreateRequest, MeterInitialReadingRequest,
  MeterTariff,
  MeterTariffCreateRequest,
  MeterUpdateRequest
} from '../models/meter.model';
import {environment} from '../../../environments/environment';
import {MeterReading} from '../models/reading.model';

@Injectable({ providedIn: 'root' })
export class MetersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/meters`;

  getAll() {
    return this.http.get<Meter[]>(this.apiUrl);
  }

  create(request: MeterCreateRequest) {
    return this.http.post<Meter>(this.apiUrl, request);
  }

  update(id: number, request: MeterUpdateRequest) {
    return this.http.put<Meter>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getTariffs(meterId: number) {
    return this.http.get<MeterTariff[]>(`${this.apiUrl}/${meterId}/tariffs`);
  }

  createTariff(meterId: number, request: MeterTariffCreateRequest) {
    return this.http.post<MeterTariff>(`${this.apiUrl}/${meterId}/tariffs`, request);
  }

  getCurrentTariff(meterId: number) {
    return this.http.get<MeterTariff>(`${this.apiUrl}/${meterId}/tariffs/current`);
  }

  createInitialReading(meterId: number, request: MeterInitialReadingRequest) {
    return this.http.post<MeterReading>(
      `${this.apiUrl}/${meterId}/initial-reading`,
      request
    );
  }
}
