import { Injectable, OnDestroy, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BarcodeScannerService implements OnDestroy {
  // Subject para emitir el código completo y Observable público para los componentes
  private scannedCodeSubject = new Subject<string>();
  public scannedCode$ = this.scannedCodeSubject.asObservable();

  private buffer = '';
  private lastKeyTime = 0;
  
  // Umbral de velocidad (en milisegundos). Una pistola suele teclear en 5ms - 20ms por letra.
  private readonly thresholdMs = 50; 
  // Tiempo para resetear el buffer si la lectura se corta abruptamente sin enviar 'Enter'
  private readonly timeoutMs = 200; 
  
  private keydownSubscription!: Subscription;
  private resetTimeout!: any;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.iniciarEscuchaGlobal();
  }

  private iniciarEscuchaGlobal() {
    // Escuchar el evento keydown de manera global en todo el document
    this.keydownSubscription = fromEvent<KeyboardEvent>(this.document, 'keydown')
      .pipe(
        // Filtramos teclas modificadoras (Shift, Ctrl, Alt) para no procesarlas como texto
        filter(event => !event.ctrlKey && !event.altKey && !event.metaKey && event.key !== 'Shift')
      )
      .subscribe((event: KeyboardEvent) => {
        this.procesarTecla(event);
      });
  }

  private procesarTecla(event: KeyboardEvent) {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - this.lastKeyTime;
    
    // Limpiar el temporizador de reseteo porque entró una nueva tecla
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }

    // Si la diferencia de tiempo entre la tecla actual y la anterior es mayor al umbral,
    // significa que es un HUMANO tecleando lentamente (o es el primer caracter del escaneo).
    if (timeDiff > this.thresholdMs) {
      this.buffer = ''; // Vaciamos el buffer
    }

    if (event.key === 'Enter') {
      // Si recibimos un Enter y el buffer tiene contenido, emitimos el código completo.
      if (this.buffer.length > 0) {
        this.scannedCodeSubject.next(this.buffer);
        event.preventDefault(); // Evitamos un submit accidental de algún formulario que esté abierto
      }
      this.buffer = ''; // Reiniciamos post-emisión
      
    } else if (event.key.length === 1) { // Asegurarnos de que sea un caracter imprimible
      // Concatenar el caracter al buffer
      this.buffer += event.key;
      this.lastKeyTime = currentTime; // Actualizamos el timestamp de la última tecla

      // Establecer un timeout de limpieza por si el escaneo se corrompe y nunca manda el 'Enter'
      this.resetTimeout = setTimeout(() => {
        this.buffer = '';
      }, this.timeoutMs);
    }
  }

  ngOnDestroy() {
    // Limpieza del EventListener del document para evitar fugas de memoria
    if (this.keydownSubscription) {
      this.keydownSubscription.unsubscribe();
    }
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
    this.scannedCodeSubject.complete();
  }
}
