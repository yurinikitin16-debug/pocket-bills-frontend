import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { BillsService } from '../../../core/services/bills.service';
import { Bill } from '../../../core/models/bill.model';
import { TranslationService } from '../../../core/i18n/translation.service';
import { getServiceIcon } from '../../../core/util/service-icon.util';

Chart.register(...registerables);

interface DashboardPeriod {
  key: string;
  month: number;
  year: number;
  title: string;
  total: number;
  bills: Bill[];
}

interface ServiceComparisonRow {
  key: string;
  serviceId: number;
  serviceName: string;
  serviceUnit?: string | null;
  billingType: Bill['billingType'];
  amount: number;
  consumption: number | null;
  previousAmount: number;
  previousConsumption: number | null;
  difference: number;
  percentDifference: number | null;
  bills: Bill[];
  previousBills: Bill[];
  isRegisterGroup: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  private billsApi = inject(BillsService);
  private translation = inject(TranslationService);

  readonly getServiceIcon = getServiceIcon;
  t = this.translation.translate.bind(this.translation);

  loading = false;
  errorMessage = '';

  bills: Bill[] = [];
  periods: DashboardPeriod[] = [];
  selectedPeriodKey = '';

  currentPeriod: DashboardPeriod | null = null;
  previousPeriod: DashboardPeriod | null = null;
  details: ServiceComparisonRow[] = [];
  recentPeriods: DashboardPeriod[] = [];

  expensesChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: '',
        borderColor: '#2563eb',
        backgroundColor: '#dbeafe',
        tension: 0.35,
        pointRadius: 5,
        pointHoverRadius: 6,
        fill: false
      }
    ]
  };

  expensesChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value}`
        }
      }
    }
  };

  servicesChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: '',
        backgroundColor: '#2563eb',
        borderRadius: 8
      }
    ]
  };

  servicesChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  consumptionChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  consumptionChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    const year = new Date().getFullYear();

    this.loading = true;
    this.errorMessage = '';

    this.billsApi.getBills(year).subscribe({
      next: (bills) => {
        this.bills = bills;
        this.periods = this.buildPeriods(bills);
        this.recentPeriods = this.periods.slice(0, 4);

        if (this.periods.length > 0) {
          this.selectPeriod(this.periods[0]);
        }

        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveError(error, 'BILLS_LOAD_FAILED');
        this.loading = false;
      }
    });
  }

  selectPeriod(period: DashboardPeriod) {
    this.selectedPeriodKey = period.key;
    this.currentPeriod = period;

    const currentIndex = this.periods.findIndex((item) => item.key === period.key);
    this.previousPeriod = this.periods[currentIndex + 1] ?? null;

    this.details = this.buildDetails(period, this.previousPeriod);
    this.buildCharts();
  }

  getTotalDifference(): number {
    return (this.currentPeriod?.total ?? 0) - (this.previousPeriod?.total ?? 0);
  }

  getTotalPercentDifference(): number | null {
    const previousTotal = this.previousPeriod?.total ?? 0;

    if (previousTotal <= 0) {
      return null;
    }

    return (this.getTotalDifference() / previousTotal) * 100;
  }

  formatAmount(amount: number): string {
    return `${amount.toFixed(2)} ${this.t('CURRENCY_UAH')}`;
  }

  formatSignedAmount(amount: number): string {
    const sign = amount > 0 ? '+' : '';

    return `${sign}${this.formatAmount(amount)}`;
  }

  formatPercent(value: number | null): string {
    if (value === null) {
      return '0%';
    }

    const sign = value > 0 ? '+' : '';

    return `${sign}${value.toFixed(1)}%`;
  }

  formatConsumption(row: ServiceComparisonRow): string {
    if (row.billingType === 'FIXED') {
      return `1 ${this.t('DASHBOARD_SERVICE_UNIT')}`;
    }

    if (row.consumption === null) {
      return '-';
    }

    return `${row.consumption} ${row.serviceUnit ?? ''}`;
  }

  formatPrevious(row: ServiceComparisonRow): string {
    const amount = this.formatAmount(row.previousAmount);

    if (row.billingType === 'FIXED') {
      return `1 ${this.t('DASHBOARD_SERVICE_UNIT')} / ${amount}`;
    }

    if (row.previousConsumption === null) {
      return `- / ${amount}`;
    }

    return `${row.previousConsumption} ${row.serviceUnit ?? ''} / ${amount}`;
  }


  getChangeClass(value: number): string {
    if (value > 0) {
      return 'positive';
    }

    if (value < 0) {
      return 'negative';
    }

    return 'neutral';
  }

  private buildPeriods(bills: Bill[]): DashboardPeriod[] {
    const grouped = new Map<string, Bill[]>();

    bills.forEach((bill) => {
      const key = `${bill.periodYear}-${bill.periodMonth}`;
      const periodBills = grouped.get(key) ?? [];

      periodBills.push(bill);
      grouped.set(key, periodBills);
    });

    return Array.from(grouped.entries())
      .map(([key, periodBills]) => {
        const firstBill = periodBills[0];

        return {
          key,
          month: firstBill.periodMonth,
          year: firstBill.periodYear,
          title: `${this.getMonthName(firstBill.periodMonth)} ${firstBill.periodYear}`,
          total: this.sumBills(periodBills),
          bills: periodBills.sort((a, b) => a.serviceName.localeCompare(b.serviceName))
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year;
        }

        return b.month - a.month;
      });
  }

  private buildDetails(
    current: DashboardPeriod,
    previous: DashboardPeriod | null
  ): ServiceComparisonRow[] {
    const currentGroups = this.groupBillsByLogicalService(current.bills);
    const previousGroups = previous ? this.groupBillsByLogicalService(previous.bills) : new Map();

    return Array.from(currentGroups.values()).map((group) => {
      const previousGroup = previousGroups.get(group.key);

      const amount = this.sumBills(group.bills);
      const previousAmount = previousGroup ? this.sumBills(previousGroup.bills) : 0;
      const difference = amount - previousAmount;

      return {
        key: group.key,
        serviceId: group.serviceId,
        serviceName: group.serviceName,
        serviceUnit: group.serviceUnit,
        billingType: group.billingType,
        amount,
        consumption: this.sumConsumption(group.bills),
        previousAmount,
        previousConsumption: previousGroup ? this.sumConsumption(previousGroup.bills) : null,
        difference,
        percentDifference: previousAmount > 0 ? (difference / previousAmount) * 100 : null,
        bills: group.bills,
        previousBills: previousGroup?.bills ?? [],
        isRegisterGroup: group.isRegisterGroup
      };
    });
  }

  private groupBillsByLogicalService(bills: Bill[]) {
    const groups = new Map<string, {
      key: string;
      serviceId: number;
      serviceName: string;
      serviceUnit?: string | null;
      billingType: Bill['billingType'];
      isRegisterGroup: boolean;
      bills: Bill[];
    }>();

    bills.forEach((bill) => {
      const isRegister = bill.meterType === 'REGISTER' && bill.parentMeterId !== null;

      const key = isRegister
        ? `parent-${bill.parentMeterId}`
        : `service-${bill.serviceId}-meter-${bill.meterId ?? bill.id}`;

      const group = groups.get(key) ?? {
        key,
        serviceId: bill.serviceId,
        serviceName: bill.serviceName,
        serviceUnit: bill.serviceUnit,
        billingType: bill.billingType,
        isRegisterGroup: isRegister,
        bills: []
      };

      group.bills.push(bill);
      groups.set(key, group);
    });

    return groups;
  }

  private sumConsumption(bills: Bill[]): number | null {
    const meteredBills = bills.filter((bill) => bill.billingType === 'METERED');

    if (meteredBills.length === 0) {
      return null;
    }

    const units = new Set(meteredBills.map((bill) => bill.serviceUnit ?? ''));

    if (units.size > 1) {
      return null;
    }

    return meteredBills.reduce((sum, bill) => sum + Number(bill.consumption || 0), 0);
  }

  private buildCharts() {
    const chronologicalPeriods = [...this.periods].reverse();

    this.expensesChartData = {
      labels: chronologicalPeriods.map((period) => this.getShortPeriodTitle(period)),
      datasets: [
        {
          data: chronologicalPeriods.map((period) => period.total),
          label: this.t('DASHBOARD_EXPENSES'),
          borderColor: '#2563eb',
          backgroundColor: '#dbeafe',
          tension: 0.35,
          pointRadius: 5,
          pointHoverRadius: 6,
          fill: false
        }
      ]
    };

    this.servicesChartData = {
      labels: this.details.map((row) => row.serviceName),
      datasets: [
        {
          data: this.details.map((row) => row.amount),
          label: this.t('DASHBOARD_AMOUNT'),
          backgroundColor: '#2563eb',
          borderRadius: 8
        }
      ]
    };

    this.consumptionChartData = this.buildConsumptionChartData();
  }

  private buildConsumptionChartData(): ChartConfiguration<'bar'>['data'] {
    const meteredRows = this.details.filter(
      (row) => row.billingType === 'METERED' && row.serviceUnit && row.consumption !== null
    );

    const units = Array.from(new Set(meteredRows.map((row) => row.serviceUnit ?? '')));
    const colors = ['#2563eb', '#16a34a', '#f97316', '#7c3aed'];

    return {
      labels: meteredRows.map((row) => row.serviceName),
      datasets: units.map((unit, index) => ({
        data: meteredRows.map((row) => row.serviceUnit === unit ? row.consumption ?? 0 : 0),
        label: unit,
        backgroundColor: colors[index % colors.length],
        borderRadius: 8
      }))
    };
  }


  private sumBills(bills: Bill[]): number {
    return bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  }

  private getShortPeriodTitle(period: DashboardPeriod): string {
    return `${this.getShortMonthName(period.month)} ${period.year}`;
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

  private getShortMonthName(month: number): string {
    const months: Record<number, string> = {
      1: this.t('MONTH_SHORT_JANUARY'),
      2: this.t('MONTH_SHORT_FEBRUARY'),
      3: this.t('MONTH_SHORT_MARCH'),
      4: this.t('MONTH_SHORT_APRIL'),
      5: this.t('MONTH_SHORT_MAY'),
      6: this.t('MONTH_SHORT_JUNE'),
      7: this.t('MONTH_SHORT_JULY'),
      8: this.t('MONTH_SHORT_AUGUST'),
      9: this.t('MONTH_SHORT_SEPTEMBER'),
      10: this.t('MONTH_SHORT_OCTOBER'),
      11: this.t('MONTH_SHORT_NOVEMBER'),
      12: this.t('MONTH_SHORT_DECEMBER')
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
