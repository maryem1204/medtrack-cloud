import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanAppareilComponent } from './scan-appareil.component';

describe('ScanAppareilComponent', () => {
  let component: ScanAppareilComponent;
  let fixture: ComponentFixture<ScanAppareilComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanAppareilComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScanAppareilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
