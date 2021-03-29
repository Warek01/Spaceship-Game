import { TestBed } from '@angular/core/testing';

import { SizingService } from './sizing.service';

describe('SizingService', () => {
  let service: SizingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SizingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
