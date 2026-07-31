import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiEmpresa } from './mi-empresa';

describe('MiEmpresa', () => {
  let component: MiEmpresa;
  let fixture: ComponentFixture<MiEmpresa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiEmpresa],
    }).compileComponents();

    fixture = TestBed.createComponent(MiEmpresa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
