import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { getServiceIcon } from '../../../core/util/service-icon.util';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { BillsService } from '../../../core/services/bills.service';
import { Bill } from '../../../core/models/bill.model';
import { TranslationService } from '../../../core/i18n/translation.service';

interface BillPeriodGroup {
  key: string;
  month: number;
  year: number;
  title: string;
  calculatedAt: string | null;
  total: number;
  bills: Bill[];
}

interface BillDisplayGroup {
  key: string;
  title: string;
  billingType: Bill['billingType'];
  isRegisterGroup: boolean;
  total: number;
  bills: Bill[];
}

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './bills.component.html',
  styleUrl: './bills.component.scss'
})
export class BillsComponent implements OnInit {
  private billsApi = inject(BillsService);
  private fb = inject(FormBuilder);
  private translation = inject(TranslationService);
  readonly getServiceIcon = getServiceIcon;

  t = this.translation.translate.bind(this.translation);

  loading = false;
  errorMessage = '';

  bills: Bill[] = [];
  groups: BillPeriodGroup[] = [];
  expandedPeriodKey: string | null = null;

  yearOptions = this.buildYearOptions();
  periodOptions = this.buildPeriodOptions();

  filterForm = this.fb.nonNullable.group({
    year: [new Date().getFullYear()],
    periodMonth: [0],
    serviceId: [0]
  });

  ngOnInit() {
    this.loadBills();
  }

  get serviceOptions() {
    const servicesById = new Map<number, string>();

    this.bills.forEach((bill) => {
      servicesById.set(bill.serviceId, bill.serviceName);
    });

    return Array.from(servicesById.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  loadBills() {
    const filters = this.filterForm.getRawValue();
    const periodMonth = filters.periodMonth || undefined;

    this.loading = true;
    this.errorMessage = '';

    this.billsApi.getBills(filters.year, periodMonth).subscribe({
      next: (bills) => {
        this.bills = bills;
        this.groups = this.buildGroups(bills);
        this.expandedPeriodKey = this.groups[0]?.key ?? null;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveError(error, 'BILLS_LOAD_FAILED');
        this.loading = false;
      }
    });
  }

  onFiltersChange() {
    if (this.loading) {
      return;
    }

    this.loadBills();
  }

  toggleGroup(group: BillPeriodGroup) {
    this.expandedPeriodKey = this.expandedPeriodKey === group.key ? null : group.key;
  }

  isExpanded(group: BillPeriodGroup): boolean {
    return this.expandedPeriodKey === group.key;
  }

  getVisibleBills(group: BillPeriodGroup): Bill[] {
    const serviceId = this.filterForm.controls.serviceId.value;

    if (!serviceId) {
      return group.bills;
    }

    return group.bills.filter((bill) => bill.serviceId === serviceId);
  }

  getVisibleTotal(group: BillPeriodGroup): number {
    return this.getVisibleBills(group).reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  }

  formatAmount(amount: number): string {
    return `${amount.toFixed(2)} ${this.t('CURRENCY_UAH')}`;
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '';
    }

    return new Intl.DateTimeFormat('uk-UA').format(new Date(value));
  }

  getBillDisplayName(bill: Bill): string {
    if (bill.meterType === 'REGISTER') {
      return bill.displayName || bill.registerCode || bill.serviceName;
    }

    return bill.displayName || bill.serviceName;
  }

  getBillDescription(bill: Bill): string {
    if (bill.billingType === 'FIXED') {
      return `${this.t('BILL_FIXED_TARIFF')} · ${bill.tariffRate} ${this.t('CURRENCY_UAH')}`;
    }

    const unit = bill.serviceUnit ? ` ${bill.serviceUnit}` : '';

    return `${bill.consumption ?? 0}${unit} · ${bill.tariffRate} ${this.t('CURRENCY_UAH')}`;
  }

  getGroupedVisibleBills(group: BillPeriodGroup): BillDisplayGroup[] {
    const bills = this.getVisibleBills(group);
    const groups = new Map<string, BillDisplayGroup>();

    bills.forEach((bill) => {
      const isRegister = bill.meterType === 'REGISTER' && bill.parentMeterId !== null;

      const key = isRegister
        ? `parent-${bill.parentMeterId}`
        : `bill-${bill.id}`;

      const title = isRegister
        ? bill.serviceName
        : this.getBillDisplayName(bill);

      const displayGroup = groups.get(key) ?? {
        key,
        title,
        billingType: bill.billingType,
        isRegisterGroup: isRegister,
        total: 0,
        bills: []
      };

      displayGroup.total += Number(bill.amount || 0);
      displayGroup.bills.push(bill);

      groups.set(key, displayGroup);
    });

    return Array.from(groups.values());
  }



  private buildGroups(bills: Bill[]): BillPeriodGroup[] {
    const groupsByPeriod = new Map<string, Bill[]>();

    bills.forEach((bill) => {
      const key = `${bill.periodYear}-${bill.periodMonth}`;
      const groupBills = groupsByPeriod.get(key) ?? [];

      groupBills.push(bill);
      groupsByPeriod.set(key, groupBills);
    });

    return Array.from(groupsByPeriod.entries())
      .map(([key, groupBills]) => {
        const firstBill = groupBills[0];
        const total = groupBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);

        return {
          key,
          month: firstBill.periodMonth,
          year: firstBill.periodYear,
          title: `${this.getMonthName(firstBill.periodMonth)} ${firstBill.periodYear}`,
          calculatedAt: this.getLatestCalculatedAt(groupBills),
          total,
          bills: groupBills.sort((a, b) => a.serviceName.localeCompare(b.serviceName))
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year;
        }

        return b.month - a.month;
      });
  }

  private getLatestCalculatedAt(bills: Bill[]): string | null {
    return bills
      .map((bill) => bill.calculatedAt)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;
  }

  private buildYearOptions(): number[] {
    const currentYear = new Date().getFullYear();

    return [currentYear, currentYear - 1, currentYear - 2];
  }

  private buildPeriodOptions() {
    return [
      { value: 0, label: this.t('BILLS_ALL_PERIODS') },
      ...Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;

        return {
          value: month,
          label: this.getMonthName(month)
        };
      })
    ];
  }

  private getMonthName(month: number): string {
    const months: Record<number, string> = {
      1: this.t('MONTH_JANUARY'),
      2: this.t('MONTH_FEBRUARY'),
      3: this.t('MONTH_MARCH'),
      4: this.t('MONTH_APRIL'),
      5: this.t('MONTH_MAY'),
      6: this.t('MONTH_JUNE'),
      7: this.t('MONTH_JULY'),
      8: this.t('MONTH_AUGUST'),
      9: this.t('MONTH_SEPTEMBER'),
      10: this.t('MONTH_OCTOBER'),
      11: this.t('MONTH_NOVEMBER'),
      12: this.t('MONTH_DECEMBER')
    };

    return months[month];
  }

  private resolveError(error: HttpErrorResponse, fallbackCode: string): string {
    if (error.status === 0) {
      return this.translation.error('SERVER_UNAVAILABLE');
    }

    return this.translation.error(error.error?.errorCode || fallbackCode);
  }
}
