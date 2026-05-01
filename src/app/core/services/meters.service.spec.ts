import { TestBed } from '@angular/core/testing';

import { MetersService } from './meters.service';

describe('MetersService', () => {
  let service: MetersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
