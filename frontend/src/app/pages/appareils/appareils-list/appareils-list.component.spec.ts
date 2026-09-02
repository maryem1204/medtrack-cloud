import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppareilsListComponent } from './appareils-list.component';

describe('AppareilsListComponent', () => {
  let component: AppareilsListComponent;
  let fixture: ComponentFixture<AppareilsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppareilsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppareilsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
