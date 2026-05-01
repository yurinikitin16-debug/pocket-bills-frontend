export type BillingType = 'METERED' | 'FIXED';

export interface UtilityService {
  id: number;
  code: string;
  name: string;
  unit?: string | null;
  billingType: BillingType;
}

export interface ServiceCreateRequest {
  code: string;
  name: string;
  unit?: string | null;
  billingType: BillingType;
}

export type ServiceUpdateRequest = ServiceCreateRequest;
