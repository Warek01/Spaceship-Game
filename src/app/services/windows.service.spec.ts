import { TestBed } from '@angular/core/testing';

import { WindowsService } from './windows.service';

describe('WindowsService', () => {
  let service: WindowsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WindowsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
