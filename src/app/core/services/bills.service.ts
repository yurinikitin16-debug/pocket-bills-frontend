import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Bill } from '../models/bill.model';
import {environment} from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BillsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/bills`;

  getBills(periodYear: number, periodMonth?: number) {
    let params = new HttpParams().set('periodYear', periodYear);

    if (periodMonth) {
      params = params.set('periodMonth', periodMonth);
    }

    return this.http.get<Bill[]>(this.apiUrl, { params });
  }
}
