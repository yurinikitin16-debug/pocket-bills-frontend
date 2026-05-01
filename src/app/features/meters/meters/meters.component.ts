import { CommonModule } from '@angular/common';
import {Component, inject, OnInit} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { getServiceIcon } from '../../../core/util/service-icon.util';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { MetersService } from '../../../core/services/meters.service';
import { UtilityServicesService } from '../../../core/services/utility-services.service';
import {Meter, MeterTariff} from '../../../core/models/meter.model';
import { UtilityService } from '../../../core/models/service.model';
import { TranslationService } from '../../../core/i18n/translation.service';

@Component({
  selector: 'app-meters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './meters.component.html',
  styleUrl: './meters.component.scss'
})
export class MetersComponent implements OnInit {
  private metersApi = inject(MetersService);
  private servicesApi = inject(UtilityServicesService);
  private fb = inject(FormBuilder);
  private translation = inject(TranslationService);
  readonly getServiceIcon = getServiceIcon;
  currentTariffs: Record<number, number> = {};

  t = this.translation.translate.bind(this.translation);

  meters: Meter[] = [];
  services: UtilityService[] = [];
  selectedMeter: Meter | null = null;

  loading = true;
  saving = false;
  deletingId: number | null = null;
  errorMessage = '';

  form = this.fb.nonNullable.group({
    serviceId: [0, [Validators.required, Validators.min(1)]],

    initialRate: [null as number | null, [Validators.required, Validators.min(0.01)]],
    establishedDate: ['', [Validators.required]],

    initialReadingValue: [null as number | null],
    initialReadingPeriod: [this.getCurrentPeriodKey()],

    isActive: [true, [Validators.required]]
  });

  initialReadingForm = this.fb.nonNullable.group({
    value: [null as number | null, [Validators.required, Validators.min(0)]],
    period: [this.getCurrentPeriodKey(), [Validators.required]]
  });

  tariffs: MeterTariff[] = [];

  periodOptions = this.buildPeriodOptions();

  private getCurrentPeriodKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
  }

  private buildPeriodOptions() {
    const now = new Date();
    const options = [];

    for (let i = -24; i <= 1; i++) {
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

  private parsePeriod(value: string) {
    const [year, month] = value.split('-').map(Number);
    return { year, month };
  }

  tariffForm = this.fb.nonNullable.group({
    rate: [null as number | null, [Validators.required, Validators.min(0.01)]],
    establishedDate: ['']
  });

  ngOnInit() {
    this.loadPageData();
  }

  loadPageData() {
    this.loading = true;
    this.errorMessage = '';

    this.servicesApi.getAll().subscribe({
      next: (services) => {
        this.services = services;
        this.loadMeters();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveError(error, 'SERVICES_LOAD_FAILED');
        this.loading = false;
      }
    });
  }

  loadMeters() {
    this.metersApi.getAll().subscribe({
      next: (meters) => {
        this.meters = meters;
        this.loading = false;
        this.loadCurrentTariffs(meters);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveError(error, 'METERS_LOAD_FAILED');
        this.loading = false;
      }
    });
  }

  loadCurrentTariffs(meters: Meter[]) {
    this.currentTariffs = {};

    meters.forEach((meter) => {
      this.metersApi.getCurrentTariff(meter.id).subscribe({
        next: (tariff) => {
          this.currentTariffs[meter.id] = tariff.rate;
        },
        error: () => {
          this.currentTariffs[meter.id] = 0;
        }
      });
    });
  }

  startCreate() {
    this.selectedMeter = null;
    this.tariffs = [];

    this.form.controls.initialRate.enable();
    this.form.controls.establishedDate.enable();
    this.form.controls.initialReadingValue.enable();
    this.form.controls.initialReadingPeriod.enable();
    this.form.controls.isActive.disable();

    this.form.reset({
      serviceId: 0,
      initialRate: null,
      establishedDate: new Date().toISOString().slice(0, 10),
      initialReadingValue: null,
      initialReadingPeriod: this.getCurrentPeriodKey(),
      isActive: true
    });
  }

  startEdit(meter: Meter) {
    this.selectedMeter = meter;

    this.form.controls.initialRate.disable();
    this.form.controls.establishedDate.disable();
    this.form.controls.initialReadingValue.disable();
    this.form.controls.initialReadingPeriod.disable();
    this.form.controls.isActive.enable();

    this.form.patchValue({
      serviceId: meter.serviceId,
      initialRate: null,
      establishedDate: '',
      initialReadingValue: null,
      initialReadingPeriod: this.getCurrentPeriodKey(),
      isActive: meter.isActive
    });

    this.initialReadingForm.reset({
      value: null,
      period: this.getCurrentPeriodKey()
    });

    this.loadTariffs(meter.id);
  }

  save() {
    if (this.saving) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const raw = this.form.getRawValue();

    const action$ = this.selectedMeter
      ? this.metersApi.update(this.selectedMeter.id, {
        serviceId: raw.serviceId,
        isActive: raw.isActive
      })
      : this.metersApi.create({
        serviceId: raw.serviceId,
        initialTariff: {
          rate: raw.initialRate!,
          establishedDate: raw.establishedDate
        },
        initialReading: raw.initialReadingValue !== null
          ? {
            value: raw.initialReadingValue,
            periodMonth: this.parsePeriod(raw.initialReadingPeriod).month,
            periodYear: this.parsePeriod(raw.initialReadingPeriod).year
          }
          : null
      });

    action$.subscribe({
      next: () => {
        this.saving = false;
        this.startCreate();
        this.loadMeters();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveError(error, 'METER_SAVE_FAILED');
        this.saving = false;
      }
    });
  }

  addInitialReading() {
    if (!this.selectedMeter) return;

    if (this.initialReadingForm.invalid) {
      this.initialReadingForm.markAllAsTouched();
      return;
    }

    const raw = this.initialReadingForm.getRawValue();
    const period = this.parsePeriod(raw.period);

    this.metersApi.createInitialReading(this.selectedMeter.id, {
      value: raw.value!,
      periodMonth: period.month,
      periodYear: period.year
    }).subscribe({
      next: () => {
        this.initialReadingForm.reset({
          value: null,
          period: this.getCurrentPeriodKey()
        });

        this.loadMeters();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveError(error, 'INITIAL_READING_SAVE_FAILED');
      }
    });
  }

  delete(meter: Meter) {
    const confirmed = confirm(`${this.t('COMMON_DELETE')} "${meter.serviceName}"?`);
    if (!confirmed) return;

    this.deletingId = meter.id;
    this.errorMessage = '';

    this.metersApi.delete(meter.id).subscribe({
      next: () => {
        this.deletingId = null;

        if (this.selectedMeter?.id === meter.id) {
          this.startCreate();
        }

        this.loadMeters();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveError(error, 'METER_DELETE_FAILED');
        this.deletingId = null;
      }
    });
  }

  loadTariffs(meterId: number) {
    this.metersApi.getTariffs(meterId).subscribe({
      next: (tariffs) => {
        this.tariffs = tariffs;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveError(error, 'TARIFFS_LOAD_FAILED');
      }
    });
  }

  addTariff() {
    if (!this.selectedMeter) return;

    if (this.tariffForm.invalid) {
      this.tariffForm.markAllAsTouched();
      return;
    }

    const request = this.tariffForm.getRawValue();

    this.metersApi.createTariff(this.selectedMeter.id, {
      rate: request.rate!,
      establishedDate: request.establishedDate
    }).subscribe({
      next: () => {
        this.tariffForm.reset({
          rate: null,
          establishedDate: new Date().toISOString().slice(0, 10)
        });

        this.loadTariffs(this.selectedMeter!.id);
        this.loadMeters();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveError(error, 'TARIFF_SAVE_FAILED');
      }
    });
  }

  private resolveError(error: HttpErrorResponse, fallbackCode: string): string {
    if (error.status === 0) {
      return this.translation.error('SERVER_UNAVAILABLE');
    }

    return this.translation.error(error.error?.errorCode || fallbackCode);
  }
}
