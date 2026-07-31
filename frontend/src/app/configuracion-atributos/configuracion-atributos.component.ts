import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface AtributoValor {
  id: string;
  valor: string;
}

interface AtributoGlobal {
  id: string;
  nombre: string;
  valores: AtributoValor[];
  expanded?: boolean;
}

@Component({
  selector: 'app-configuracion-atributos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
            Atributos y Variaciones
          </h3>
          <p class="text-sm text-slate-500 mt-1">Configura las unidades de medida, tallas, pesos, etc. específicas de tu empresa.</p>
        </div>
        <button (click)="mostrarFormNuevo = true" *ngIf="!mostrarFormNuevo" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm border border-indigo-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Nuevo Atributo
        </button>
      </div>

      <!-- Form Nuevo Atributo -->
      <div *ngIf="mostrarFormNuevo" class="p-6 bg-indigo-50/30 border-b border-slate-100">
        <form [formGroup]="nuevoAtributoForm" (ngSubmit)="crearAtributo()" class="flex items-end gap-4">
          <div class="flex-1">
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Nombre del Atributo</label>
            <input type="text" formControlName="nombre" placeholder="Ej: Unidad de Medida, Talla, Color..." 
                   class="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm">
          </div>
          <div class="flex gap-2">
            <button type="button" (click)="mostrarFormNuevo = false" class="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-bold transition-colors shadow-sm">
              Cancelar
            </button>
            <button type="submit" [disabled]="nuevoAtributoForm.invalid || isSaving" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2">
              <svg *ngIf="isSaving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              Guardar Atributo
            </button>
          </div>
        </form>
      </div>

      <!-- Lista de Atributos -->
      <div class="divide-y divide-slate-100">
        <div *ngFor="let atributo of atributos" class="group">
          <!-- Atributo Row -->
          <div class="px-6 py-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors" (click)="toggleAtributo(atributo)">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 transition-transform duration-200" [class.rotate-90]="atributo.expanded">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
              <h4 *ngIf="editingAttrId !== atributo.id" class="font-bold text-slate-700">{{ atributo.nombre }}</h4>
              <div *ngIf="editingAttrId === atributo.id" class="flex gap-2 items-center" (click)="$event.stopPropagation()">
                <input type="text" [(ngModel)]="editAttrText" (keyup.enter)="guardarEditAtributo(atributo)" (keyup.escape)="cancelarEditAtributo()" class="bg-white border border-slate-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm outline-none">
                <button (click)="guardarEditAtributo(atributo)" class="text-emerald-600 hover:bg-emerald-50 p-1 rounded-md"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></button>
                <button (click)="cancelarEditAtributo()" class="text-rose-500 hover:bg-rose-50 p-1 rounded-md"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
              </div>
              <span class="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-bold">{{ atributo.valores.length }} valores</span>
            </div>
            <div class="flex items-center gap-1">
              <button *ngIf="editingAttrId !== atributo.id" (click)="$event.stopPropagation(); iniciarEditAtributo(atributo)" class="text-slate-400 hover:text-amber-500 p-2 rounded-lg hover:bg-amber-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 mr-1" title="Editar Atributo">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              </button>
              <button (click)="$event.stopPropagation(); eliminarAtributo(atributo)" class="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 mr-1" title="Eliminar Atributo">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
              <button class="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" title="Ver / Añadir Valores">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              </button>
            </div>
          </div>
          
          <!-- Atributo Valores (Chips) -->
          <div *ngIf="atributo.expanded" class="px-6 pb-6 pt-2 bg-slate-50/50">
            <div class="flex flex-wrap gap-2 mb-4">
              <div *ngFor="let val of atributo.valores" class="inline-flex items-center gap-1.5 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 group/chip hover:border-indigo-200 hover:shadow-md transition-all">
                <span *ngIf="editingValorId !== val.id" (dblclick)="iniciarEditValor(val)">{{ val.valor }}</span>
                <input *ngIf="editingValorId === val.id" type="text" [(ngModel)]="editValorText" (keyup.enter)="guardarEditValor(atributo, val)" (keyup.escape)="cancelarEditValor()" class="w-24 bg-white border border-slate-300 rounded-md px-1.5 py-0.5 text-xs outline-none focus:border-indigo-500">
                
                <button *ngIf="editingValorId !== val.id" (click)="iniciarEditValor(val)" class="text-slate-400 hover:text-amber-500 focus:outline-none p-0.5 rounded-md hover:bg-amber-50 transition-colors ml-1" title="Editar valor">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                <button *ngIf="editingValorId !== val.id" (click)="eliminarValor(atributo, val)" class="text-slate-400 hover:text-rose-500 focus:outline-none p-0.5 rounded-md hover:bg-rose-50 transition-colors" title="Eliminar valor">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              <div *ngIf="atributo.valores.length === 0" class="text-sm text-slate-500 italic py-1">
                No hay valores configurados aún.
              </div>
            </div>
            
            <div class="flex items-center gap-2 max-w-sm">
              <input type="text" [(ngModel)]="nuevoValorText[atributo.id]" (keyup.enter)="agregarValor(atributo)" placeholder="Agregar nuevo valor..." class="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm">
              <button (click)="agregarValor(atributo)" [disabled]="!nuevoValorText[atributo.id]" class="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border border-indigo-200 shadow-sm">
                Añadir
              </button>
            </div>
          </div>
        </div>
        
        <div *ngIf="atributos.length === 0 && !mostrarFormNuevo" class="p-8 text-center text-slate-500">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
            <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          </div>
          <p class="text-sm">Aún no has creado atributos para tu empresa.</p>
        </div>
      </div>
      
      <!-- Feedback Toasts -->
      <div *ngIf="errorMsg" class="bg-rose-50 border-t border-rose-200 px-6 py-3 flex items-center gap-2 text-sm text-rose-700 font-medium">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        {{ errorMsg }}
      </div>
    </div>
  `
})
export class ConfiguracionAtributosComponent implements OnInit {
  atributos: AtributoGlobal[] = [];
  mostrarFormNuevo: boolean = false;
  nuevoAtributoForm: FormGroup;
  isSaving: boolean = false;
  errorMsg: string = '';
  
  // Track new valor input per attribute ID
  nuevoValorText: { [key: string]: string } = {};

  editingAttrId: string | null = null;
  editAttrText: string = '';

  editingValorId: string | null = null;
  editValorText: string = '';

  constructor(private http: HttpClient, private fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.nuevoAtributoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  ngOnInit() {
    this.cargarAtributos();
  }

  cargarAtributos() {
    this.http.get<AtributoGlobal[]>(`${environment.apiUrl}/atributos`).subscribe({
      next: (data) => {
        // Keep expanded state if re-loading
        const expandedIds = this.atributos.filter(a => a.expanded).map(a => a.id);
        this.atributos = data.map(a => ({
          ...a,
          expanded: expandedIds.includes(a.id)
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.mostrarError('No se pudieron cargar los atributos.');
      }
    });
  }

  toggleAtributo(atributo: AtributoGlobal) {
    atributo.expanded = !atributo.expanded;
    this.cdr.detectChanges();
  }

  crearAtributo() {
    if (this.nuevoAtributoForm.invalid) return;
    this.isSaving = true;
    const body = this.nuevoAtributoForm.value;
    
    this.http.post<AtributoGlobal>(`${environment.apiUrl}/atributos`, body).subscribe({
      next: (nuevoAtr) => {
        this.isSaving = false;
        this.mostrarFormNuevo = false;
        this.nuevoAtributoForm.reset();
        nuevoAtr.valores = [];
        nuevoAtr.expanded = true;
        this.atributos.push(nuevoAtr);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSaving = false;
        this.mostrarError(err.error?.message || 'Error al crear el atributo');
      }
    });
  }

  agregarValor(atributo: AtributoGlobal) {
    const txt = this.nuevoValorText[atributo.id];
    if (!txt || txt.trim() === '') return;
    
    this.http.post<AtributoValor>(`${environment.apiUrl}/atributos/${atributo.id}/valores`, { valor: txt.trim() }).subscribe({
      next: (nuevoVal) => {
        atributo.valores.push(nuevoVal);
        this.nuevoValorText[atributo.id] = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.mostrarError(err.error?.message || 'Error al añadir el valor');
      }
    });
  }

  eliminarValor(atributo: AtributoGlobal, valor: AtributoValor) {
    if (!confirm(`¿Eliminar el valor "${valor.valor}"?`)) return;
    
    this.http.delete(`${environment.apiUrl}/atributos/${atributo.id}/valores/${valor.id}`).subscribe({
      next: () => {
        atributo.valores = atributo.valores.filter(v => v.id !== valor.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.mostrarError('Error al eliminar el valor');
      }
    });
  }

  eliminarAtributo(atributo: AtributoGlobal) {
    if (!confirm(`¿Estás seguro que deseas eliminar el atributo "${atributo.nombre}" y todos sus valores asociados?`)) return;
    
    this.http.delete(`${environment.apiUrl}/atributos/${atributo.id}`).subscribe({
      next: () => {
        this.atributos = this.atributos.filter(a => a.id !== atributo.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.mostrarError('Error al eliminar el atributo');
      }
    });
  }

  iniciarEditAtributo(atributo: AtributoGlobal) {
    this.editingAttrId = atributo.id;
    this.editAttrText = atributo.nombre;
  }

  cancelarEditAtributo() {
    this.editingAttrId = null;
    this.editAttrText = '';
  }

  guardarEditAtributo(atributo: AtributoGlobal) {
    if (!this.editAttrText || this.editAttrText.trim() === '' || this.editAttrText.trim() === atributo.nombre) {
      this.cancelarEditAtributo();
      return;
    }
    const nuevoNombre = this.editAttrText.trim();
    this.http.patch(`${environment.apiUrl}/atributos/${atributo.id}`, { nombre: nuevoNombre }).subscribe({
      next: () => {
        atributo.nombre = nuevoNombre;
        this.cancelarEditAtributo();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.mostrarError(err.error?.message || 'Error al actualizar el atributo');
      }
    });
  }

  iniciarEditValor(valor: AtributoValor) {
    this.editingValorId = valor.id;
    this.editValorText = valor.valor;
  }

  cancelarEditValor() {
    this.editingValorId = null;
    this.editValorText = '';
  }

  guardarEditValor(atributo: AtributoGlobal, valor: AtributoValor) {
    if (!this.editValorText || this.editValorText.trim() === '' || this.editValorText.trim() === valor.valor) {
      this.cancelarEditValor();
      return;
    }
    const nuevoValorText = this.editValorText.trim();
    this.http.patch(`${environment.apiUrl}/atributos/${atributo.id}/valores/${valor.id}`, { valor: nuevoValorText }).subscribe({
      next: () => {
        valor.valor = nuevoValorText;
        this.editingValorId = null;
        this.editValorText = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.mostrarError(err.error?.message || 'Error al actualizar el valor');
        this.cancelarEditValor();
      }
    });
  }

  mostrarError(msg: string) {
    this.errorMsg = msg;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.errorMsg = '';
      this.cdr.detectChanges();
    }, 4000);
  }
}
