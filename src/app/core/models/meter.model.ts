import { BillingType } from './service.model';
import { MeterReading } from './reading.model';

export type MeterType = 'SINGLE' | 'GROUP' | 'REGISTER';
export type MeterCreateType = 'SINGLE' | 'MULTI_ZONE';

export interface Meter {
  id: number;
  parentMeterId: number | null;
  serviceId: number;
  serviceName: string;
  serviceUnit: string | null;
  defaultTariff: number | null;
  meterType: MeterType;
  registerCode: string | null;
  displayName: string | null;
  billingType: BillingType;
  isActive: boolean;
  children: Meter[];
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

export interface MeterZoneCreateRequest {
  code: string;
  name: string;
  initialTariff: MeterTariffCreateRequest;
  initialReading?: MeterInitialReadingRequest | null;
}

export interface MeterCreateRequest {
  serviceId: number;
  meterType?: MeterCreateType;
  displayName?: string | null;
  initialTariff?: MeterTariffCreateRequest;
  initialReading?: MeterInitialReadingRequest | null;
  zones?: MeterZoneCreateRequest[];
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
  serviceUnit: string | null;
  rate: number;
  establishedDate: string;
  endDate?: string | null;
  active: boolean;
}
