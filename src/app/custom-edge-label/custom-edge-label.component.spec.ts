import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomEdgeLabelComponent } from './custom-edge-label.component';

describe('CustomEdgeLabelComponent', () => {
  let component: CustomEdgeLabelComponent;
  let fixture: ComponentFixture<CustomEdgeLabelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomEdgeLabelComponent]
    });
    fixture = TestBed.createComponent(CustomEdgeLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
