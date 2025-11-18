import { TestBed } from '@angular/core/testing';

import { DownloadPdfService } from './download-pdf.service';

describe('DownloadPdfService', () => {
  let service: DownloadPdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DownloadPdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
