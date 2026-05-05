import { BillingType } from './service.model';
import { MeterType } from './meter.model';

export interface Bill {
  id: number;
  meterReadingId?: number | null;
  meterId?: number | null;
  parentMeterId: number | null;
  serviceId: number;
  serviceName: string;
  serviceUnit?: string | null;
  meterType: MeterType;
  registerCode: string | null;
  displayName: string | null;
  billingType: BillingType;
  previousValue?: number | null;
  currentValue?: number | null;
  consumption?: number | null;
  tariffRate: number;
  amount: number;
  periodMonth: number;
  periodYear: number;
  calculatedAt: string;
}
