import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BulkMeterReadingRequest,
  BulkMeterReadingResponse,
  MeterReading,
  ReadingFormData
} from '../models/reading.model';
import {environment} from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReadingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/meter-readings`;

  getFormData(periodMonth: number, periodYear: number) {
    const params = new HttpParams()
      .set('periodMonth', periodMonth)
      .set('periodYear', periodYear);

    return this.http.get<ReadingFormData>(`${this.apiUrl}/form-data`, { params });
  }

  submitBulk(request: BulkMeterReadingRequest) {
    return this.http.post<BulkMeterReadingResponse>(`${this.apiUrl}/bulk`, request);
  }

  getHistory(periodYear: number, periodMonth?: number) {
    let params = new HttpParams().set('periodYear', periodYear);

    if (periodMonth) {
      params = params.set('periodMonth', periodMonth);
    }

    return this.http.get<MeterReading[]>(this.apiUrl, { params });
  }
}
