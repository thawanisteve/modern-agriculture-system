import { TestBed } from '@angular/core/testing';

import { MachineryService } from './machinery.service';

describe('MachineryService', () => {
  let service: MachineryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MachineryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
