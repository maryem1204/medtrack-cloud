import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentesListComponent } from './ventes-list.component';

describe('VentesListComponent', () => {
  let component: VentesListComponent;
  let fixture: ComponentFixture<VentesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
