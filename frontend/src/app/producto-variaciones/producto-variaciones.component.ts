import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  selector: 'app-producto-variaciones',
  templateUrl: './producto-variaciones.component.html',
  styleUrls: []
})
export class ProductoVariacionesComponent implements OnInit {
  productoForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.productoForm = this.fb.group({
      nombre: ['', Validators.required],
      atributos: this.fb.array([]),
      variantes: this.fb.array([])
    });
  }

  get atributos(): FormArray {
    return this.productoForm.get('atributos') as FormArray;
  }

  get variantes(): FormArray {
    return this.productoForm.get('variantes') as FormArray;
  }

  // ==== 1. GESTIÓN DE ATRIBUTOS ====
  
  agregarAtributo() {
    const atributoForm = this.fb.group({
      nombre: ['', Validators.required],
      // Para simplificar la UI, pedimos los valores separados por comas
      valoresText: ['', Validators.required] 
    });
    this.atributos.push(atributoForm);
  }

  removerAtributo(index: number) {
    this.atributos.removeAt(index);
  }

  // ==== 2. ALGORITMO DE PRODUCTO CARTESIANO ====

  private generarCombinaciones(atributos: {nombre: string, valores: string[]}[]): Record<string, string>[] {
    const atributosValidos = atributos.filter(a => a.nombre && a.valores.length > 0);
    
    if (atributosValidos.length === 0) return [];

    const helper = (idx: number, currentCombo: Record<string, string>): Record<string, string>[] => {
      // Condición de parada: llegamos al final de los atributos
      if (idx === atributosValidos.length) {
        return [{ ...currentCombo }];
      }
      
      const combinaciones: Record<string, string>[] = [];
      const attr = atributosValidos[idx];
      
      // Iteramos sobre todos los valores del atributo actual
      for (const valor of attr.valores) {
        currentCombo[attr.nombre.toLowerCase()] = valor;
        combinaciones.push(...helper(idx + 1, currentCombo));
      }
      
      return combinaciones;
    };

    return helper(0, {});
  }

  // ==== 3. LÓGICA DEL COMPONENTE ====

  generarMatriz() {
    // 3.1. Parseamos los valores ingresados (separando por comas)
    const atributosData = this.atributos.value.map((attr: any) => ({
      nombre: attr.nombre,
      valores: attr.valoresText.split(',').map((v: string) => v.trim()).filter((v: string) => v !== '')
    }));

    // 3.2. Ejecutamos el algoritmo puro
    const combinaciones = this.generarCombinaciones(atributosData);
    
    // 3.3. Limpiamos las variantes que existían antes
    this.variantes.clear(); 
    
    // 3.4. Poblamos el FormArray de 'variantes' dinámicamente
    combinaciones.forEach((combo, index) => {
      this.variantes.push(this.fb.group({
        sku: ['', Validators.required],
        precio_venta: [0, [Validators.required, Validators.min(0)]],
        stock: [0, [Validators.required, Validators.min(0)]],
        atributos: [combo], 
        _label: [this.getLabelCombinacion(combo)] // Propiedad auxiliar solo para mostrar en la vista
      }));
    });
  }

  removerVariante(index: number) {
    this.variantes.removeAt(index);
  }

  private getLabelCombinacion(combo: Record<string, string>): string {
    return Object.values(combo).join(' - ');
  }
}
