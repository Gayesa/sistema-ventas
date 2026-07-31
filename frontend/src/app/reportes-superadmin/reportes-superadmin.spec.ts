import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesSuperadmin } from './reportes-superadmin';

describe('ReportesSuperadmin', () => {
  let component: ReportesSuperadmin;
  let fixture: ComponentFixture<ReportesSuperadmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesSuperadmin],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesSuperadmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
