import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { getServiceIcon } from '../../../core/util/service-icon.util';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ReadingsService } from '../../../core/services/readings.service';
import { TranslationService } from '../../../core/i18n/translation.service';
import {
  BulkMeterReadingResponse,
  MeterReading,
  ReadingFormMeter
} from '../../../core/models/reading.model';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';

interface ReadingGroup {
  key: string;
  title: string;
  serviceName: string;
  billingType: 'METERED' | 'FIXED';
  items: ReadingFormMeter[];
}

@Component({
  selector: 'app-readings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelect,
    MatOption
  ],
  templateUrl: './readings.component.html',
  styleUrl: './readings.component.scss'
})
export class ReadingsComponent implements OnInit {
  private readingsApi = inject(ReadingsService);
  private fb = inject(FormBuilder);
  private translation = inject(TranslationService);
  readonly getServiceIcon = getServiceIcon;

  t = this.translation.translate.bind(this.translation);

  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  meters: ReadingFormMeter[] = [];
  history: MeterReading[] = [];
  submitResult: BulkMeterReadingResponse | null = null;

  form = this.fb.nonNullable.group({
    readings: this.fb.array([])
  });

  periodOptions = this.buildPeriodOptions();

  periodForm = this.fb.nonNullable.group({
    period: [this.getCurrentPeriodKey(), [Validators.required]]
  });

  get readingsArray() {
    return this.form.controls.readings as FormArray;
  }

  ngOnInit() {
    this.loadData();
  }

  isFixed(meter: ReadingFormMeter): boolean {
    return meter.billingType === 'FIXED';
  }

  hasFixedServices(): boolean {
    return this.meters.some((meter) => this.isFixed(meter));
  }

  getSelectedPeriodLabel(): string {
    return this.getSelectedPeriod().label;
  }

  getSubmitTotalAmount(): number {
    return this.submitResult?.bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0) ?? 0;
  }

  private getCurrentPeriodKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
  }

  private buildPeriodOptions() {
    const now = new Date();
    const options = [];

    for (let i = -6; i <= 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      options.push({
        label: `${this.getMonthName(month)} ${year}`,
        value: `${year}-${month}`,
        month,
        year
      });
    }

    return options.reverse();
  }

  private getMonthName(month: number): string {
    const months: Record<number, string> = {
      1: 'Січень',
      2: 'Лютий',
      3: 'Березень',
      4: 'Квітень',
      5: 'Травень',
      6: 'Червень',
      7: 'Липень',
      8: 'Серпень',
      9: 'Вересень',
      10: 'Жовтень',
      11: 'Листопад',
      12: 'Грудень'
    };

    return months[month];
  }

  private getSelectedPeriod() {
    const selected = this.periodOptions.find(
      (option) => option.value === this.periodForm.controls.period.value
    );

    return selected || this.periodOptions[0];
  }

  loadData(options: { preserveSubmitResult?: boolean; preserveMessages?: boolean } = {}) {
    const period = this.getSelectedPeriod();
    const periodMonth = period.month;
    const periodYear = period.year;

    this.loading = true;

    if (!options.preserveMessages) {
      this.errorMessage = '';
      this.successMessage = '';
    }

    if (!options.preserveSubmitResult) {
      this.submitResult = null;
    }

    this.readingsApi.getFormData(periodMonth, periodYear).subscribe({
      next: (data) => {
        this.meters = data.meters;
        this.buildReadingsForm(data.meters);
        this.loadHistory(periodYear, periodMonth);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveError(error, 'READINGS_LOAD_FAILED');
        this.loading = false;
      }
    });
  }

  buildReadingsForm(meters: ReadingFormMeter[]) {
    this.readingsArray.clear();

    meters.forEach((meter) => {
      const group = this.fb.group({
        meterId: [meter.meterId],
        value: [meter.submittedReading?.value ?? (null as number | null)],
        consumption: [meter.submittedReading?.consumption ?? (null as number | null)]
      });

      this.readingsArray.push(group);
    });
  }

  onValueChange(index: number) {
    const meter = this.meters[index];

    if (!meter || meter.billingType !== 'METERED') {
      return;
    }

    const group = this.readingsArray.at(index);
    const value = group.get('value')?.value;

    if (value === null || value === undefined || value === '') {
      group.get('consumption')?.setValue(null, { emitEvent: false });
      return;
    }

    const previousValue = Number(meter.previousValue ?? 0);
    const consumption = Number(value) - previousValue;

    group.get('consumption')?.setValue(consumption, { emitEvent: false });
  }

  onConsumptionChange(index: number) {
    const meter = this.meters[index];

    if (!meter || meter.billingType !== 'METERED') {
      return;
    }

    const group = this.readingsArray.at(index);
    const consumption = group.get('consumption')?.value;

    if (consumption === null || consumption === undefined || consumption === '') {
      group.get('value')?.setValue(null, { emitEvent: false });
      return;
    }

    const previousValue = Number(meter.previousValue ?? 0);
    const value = previousValue + Number(consumption);

    group.get('value')?.setValue(value, { emitEvent: false });
  }

  submit() {
    if (this.saving) return;

    const period = this.getSelectedPeriod();
    const periodMonth = period.month;
    const periodYear = period.year;

    const readings = this.readingsArray
      .getRawValue()
      .filter((reading, index) => {
        const meter = this.meters[index];

        return meter?.billingType === 'METERED' && meter?.meterType !== 'GROUP';
      })
      .filter((reading) => reading.value !== null || reading.consumption !== null)
      .map((reading) => ({
        meterId: reading.meterId,
        value: reading.value,
        consumption: reading.consumption
      }));

    if (readings.length === 0 && !this.hasFixedServices()) {
      this.errorMessage = this.t('READINGS_EMPTY_SUBMIT');
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.submitResult = null;

    this.readingsApi
      .submitBulk({
        periodMonth,
        periodYear,
        readings
      })
      .subscribe({
        next: (response) => {
          this.submitResult = response;
          this.successMessage = this.t('READINGS_SAVED');
          this.saving = false;
          this.loadData({ preserveSubmitResult: true, preserveMessages: true });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.resolveError(error, 'READINGS_SAVE_FAILED');
          this.saving = false;
        }
      });
  }

  private loadHistory(periodYear: number, periodMonth: number) {
    this.readingsApi.getHistory(periodYear, periodMonth).subscribe({
      next: (history) => {
        this.history = history;
      },
      error: () => {
        this.history = [];
      }
    });
  }

  private resolveError(error: HttpErrorResponse, fallbackCode: string): string {
    if (error.status === 0) {
      return this.translation.error('SERVER_UNAVAILABLE');
    }

    return this.translation.error(error.error?.errorCode || fallbackCode);
  }

  onPeriodChange() {
    if (this.loading || this.saving) {
      return;
    }

    this.loadData();
  }

  getReadingGroups(): ReadingGroup[] {
    const groups = new Map<string, ReadingGroup>();

    this.meters.forEach((meter) => {
      const key = meter.parentMeterId !== null
        ? `parent-${meter.parentMeterId}`
        : `meter-${meter.meterId}`;

      const title = meter.parentMeterId !== null
        ? meter.serviceName
        : meter.displayName || meter.serviceName;

      const group = groups.get(key) ?? {
        key,
        title,
        serviceName: meter.serviceName,
        billingType: meter.billingType,
        items: []
      };

      group.items.push(meter);
      groups.set(key, group);
    });

    return Array.from(groups.values());
  }

  getReadingItemTitle(meter: ReadingFormMeter): string {
    if (meter.meterType === 'REGISTER') {
      return meter.displayName || meter.registerCode || meter.serviceName;
    }

    return meter.displayName || meter.serviceName;
  }

  getReadingIndex(meter: ReadingFormMeter): number {
    return this.meters.findIndex((item) => item.meterId === meter.meterId);
  }

  isRegisterGroup(group: ReadingGroup): boolean {
    return group.items.some((item) => item.meterType === 'REGISTER');
  }
}
