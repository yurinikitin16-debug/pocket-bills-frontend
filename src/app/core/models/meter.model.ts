import { MeterReading } from './reading.model';

export interface Meter {
  id: number;
  serviceId: number;
  serviceName: string;
  serviceUnit: string;
  isActive: boolean;
}

export interface MeterTariffCreateRequest {
  rate: number;
  establishedDate: string;
}

export interface MeterInitialReadingRequest {
  value: number;
  periodMonth: number;
  periodYear: number;
}

export interface MeterCreateRequest {
  serviceId: number;
  initialTariff: MeterTariffCreateRequest;
  initialReading?: MeterInitialReadingRequest | null;
}

export interface MeterUpdateRequest {
  serviceId: number;
  isActive: boolean;
}

export interface MeterTariff {
  id: number;
  meterId: number;
  serviceId: number;
  serviceName: string;
  serviceUnit: string;
  rate: number;
  establishedDate: string;
  endDate?: string | null;
  active: boolean;
}
