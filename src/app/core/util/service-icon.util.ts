import { BillingType } from '../models/service.model';

export interface ServiceIconSource {
  serviceName?: string | null;
  serviceCode?: string | null;
  billingType?: BillingType | null;
}

export function getServiceIcon(source: ServiceIconSource): string {
  const value = `${source.serviceName ?? ''} ${source.serviceCode ?? ''}`.toLowerCase();

  if (value.includes('електро') || value.includes('electric')) {
    return 'bolt';
  }

  if (value.includes('вод') || value.includes('water')) {
    return 'water_drop';
  }

  if (value.includes('газ') || value.includes('gas')) {
    return 'local_fire_department';
  }

  if (value.includes('сміт') || value.includes('garbage')) {
    return 'delete_outline';
  }

  if (value.includes('інтернет') || value.includes('internet')) {
    return 'language';
  }

  if (value.includes('опален') || value.includes('heat')) {
    return 'thermostat';
  }

  if (source.billingType === 'FIXED') {
    return 'receipt_long';
  }

  return 'speed';
}
