import { CommonModule } from '@angular/common';
import {Component, inject, OnInit} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { getServiceIcon } from '../../../core/util/service-icon.util';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {UtilityServicesService} from '../../../core/services/utility-services.service';
import {TranslationService} from '../../../core/i18n/translation.service';
import {UtilityService} from '../../../core/models/service.model';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {BillingType} from '../../../core/models/reading.model';

@Component({
  selector: 'app-services',
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
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent implements OnInit {
  private serviceApi = inject(UtilityServicesService);
  private fb = inject(FormBuilder);
  private translation = inject(TranslationService);
  readonly getServiceIcon = getServiceIcon;
  t = this.translation.translate.bind(this.translation);

  services: UtilityService[] = [];
  selectedService: UtilityService | null = null;

  loading = true;
  saving = false;
  deletingId: number | null = null;
  errorMessage = '';

  form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    unit: ['', [Validators.maxLength(30)]],
    billingType: ['METERED' as BillingType, [Validators.required]]
  });

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.loading = true;
    this.errorMessage = '';

    this.serviceApi.getAll().subscribe({
      next: (services) => {
        this.services = services;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveError(error, 'SERVICES_LOAD_FAILED');
        this.loading = false;
      }
    });
  }

  startCreate() {
    this.selectedService = null;
    this.form.reset({
      code: '',
      name: '',
      unit: '',
      billingType: 'METERED'
    });
  }

  startEdit(service: UtilityService) {
    this.selectedService = service;

    this.form.patchValue({
      code: service.code,
      name: service.name,
      unit: service.unit ?? '',
      billingType: service.billingType
    });
  }

  save() {
    if (this.saving) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const formValue = this.form.getRawValue();

    const request = {
      ...formValue,
      unit: formValue.unit.trim() || null
    };

    const action$ = this.selectedService
      ? this.serviceApi.update(this.selectedService.id, request)
      : this.serviceApi.create(request);

    action$.subscribe({
      next: () => {
        this.saving = false;
        this.startCreate();
        this.loadServices();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveError(error, 'SERVICE_SAVE_FAILED');
        this.saving = false;
      }
    });
  }

  delete(service: UtilityService) {
    const confirmed = confirm(`${this.t('COMMON_DELETE')} "${service.name}"?`);

    if (!confirmed) return;

    this.deletingId = service.id;
    this.errorMessage = '';

    this.serviceApi.delete(service.id).subscribe({
      next: () => {
        this.deletingId = null;

        if (this.selectedService?.id === service.id) {
          this.startCreate();
        }

        this.loadServices();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveError(error, 'SERVICE_DELETE_FAILED');
        this.deletingId = null;
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
