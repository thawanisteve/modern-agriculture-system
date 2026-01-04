import { TestBed } from '@angular/core/testing';

import { AdminExportDataService } from './admin-export-data.service';

describe('AdminExportDataService', () => {
  let service: AdminExportDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminExportDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
