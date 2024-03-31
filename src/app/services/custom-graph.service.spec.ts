import { TestBed } from '@angular/core/testing';

import { CustomGraphService } from './custom-graph.service';

describe('CustomGraphService', () => {
  let service: CustomGraphService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomGraphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
