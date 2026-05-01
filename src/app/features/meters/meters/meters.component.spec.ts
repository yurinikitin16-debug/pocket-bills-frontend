import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetersComponent } from './meters.component';

describe('MetersComponent', () => {
  let component: MetersComponent;
  let fixture: ComponentFixture<MetersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
