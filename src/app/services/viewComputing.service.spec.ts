import { TestBed } from '@angular/core/testing';

import { ViewComputingService } from './viewComputing.service';

describe('SizingService', () => {
  let service: ViewComputingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViewComputingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
