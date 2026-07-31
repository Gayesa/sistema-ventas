import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventarioGeneral } from './inventario-general';

describe('InventarioGeneral', () => {
  let component: InventarioGeneral;
  let fixture: ComponentFixture<InventarioGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventarioGeneral],
    }).compileComponents();

    fixture = TestBed.createComponent(InventarioGeneral);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
