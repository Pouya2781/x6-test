import { TestBed } from '@angular/core/testing';

import { CustomNodeService } from './custom-node.service';

describe('CustomNodeService', () => {
  let service: CustomNodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomNodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
