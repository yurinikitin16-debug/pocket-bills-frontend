import { Bill } from './bill.model';

export interface ReadingFormData {
  periodMonth: number;
  periodYear: number;
  meters: ReadingFormMeter[];
}

export type BillingType = 'METERED' | 'FIXED';

export interface ReadingFormMeter {
  meterId: number;
  serviceId: number;
  serviceName: string;
  serviceUnit: string;
  billingType: BillingType;
  previousValue?: number | null;
  currentTariffRate: number;
  alreadySubmitted: boolean;
  submittedReading?: SubmittedReading | null;
}

export interface SubmittedReading {
  id: number;
  value: number;
  consumption: number;
}

export interface BulkMeterReadingRequest {
  periodMonth: number;
  periodYear: number;
  readings: MeterReadingSubmitItem[];
}

export interface MeterReadingSubmitItem {
  meterId: number;
  value?: number | null;
  consumption?: number | null;
}

export interface MeterReading {
  id: number;
  meterId: number;
  serviceId: number;
  serviceName: string;
  serviceUnit: string;
  previousValue?: number | null;
  value: number;
  consumption: number;
  periodMonth: number;
  periodYear: number;
  readingDate: string;
}

export interface BulkMeterReadingResponse {
  periodMonth: number;
  periodYear: number;
  readings: MeterReading[];
  bills: Bill[];
}
