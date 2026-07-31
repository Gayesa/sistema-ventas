import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperadminEmpresas } from './superadmin-empresas';

describe('SuperadminEmpresas', () => {
  let component: SuperadminEmpresas;
  let fixture: ComponentFixture<SuperadminEmpresas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperadminEmpresas],
    }).compileComponents();

    fixture = TestBed.createComponent(SuperadminEmpresas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
