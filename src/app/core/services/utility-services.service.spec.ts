import { TestBed } from '@angular/core/testing';

import { UtilityServicesService } from './utility-services.service';

describe('UtilityServicesService', () => {
  let service: UtilityServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UtilityServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
