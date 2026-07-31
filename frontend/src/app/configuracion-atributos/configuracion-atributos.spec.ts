import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfiguracionAtributos } from './configuracion-atributos';

describe('ConfiguracionAtributos', () => {
  let component: ConfiguracionAtributos;
  let fixture: ComponentFixture<ConfiguracionAtributos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracionAtributos],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguracionAtributos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
