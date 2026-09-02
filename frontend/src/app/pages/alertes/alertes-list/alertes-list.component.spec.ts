import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertesListComponent } from './alertes-list.component';

describe('AlertesListComponent', () => {
  let component: AlertesListComponent;
  let fixture: ComponentFixture<AlertesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
