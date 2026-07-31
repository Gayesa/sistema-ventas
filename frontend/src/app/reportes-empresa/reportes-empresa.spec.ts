import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesEmpresa } from './reportes-empresa';

describe('ReportesEmpresa', () => {
  let component: ReportesEmpresa;
  let fixture: ComponentFixture<ReportesEmpresa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesEmpresa],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesEmpresa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
