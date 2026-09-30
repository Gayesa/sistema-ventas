import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() {}

  /**
   * Exporta datos a Excel
   */
  exportarExcel(data: any[], fileName: string, sheetName: string = 'Datos') {
    if (!data || data.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    // Ajustar el ancho de las columnas (Justificar al texto mayor)
    const keys = Object.keys(data[0] || {});
    const colWidths = keys.map(key => {
      let maxLength = key.length; // Longitud del encabezado
      data.forEach(row => {
        const val = row[key];
        if (val !== null && val !== undefined) {
          const valLen = val.toString().length;
          if (valLen > maxLength) maxLength = valLen;
        }
      });
      return { wch: maxLength + 2 }; // Agregar un pequeño margen
    });
    worksheet['!cols'] = colWidths;

    // Aplicar estilos a los encabezados (Nota: xlsx-js-style o versiones Pro renderizan esto, SheetJS community podría ignorar colores pero mantendrá el ancho)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1:A1");
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        fill: { fgColor: { rgb: "4F46E5" } }, // Color de fondo (Indigo)
        font: { color: { rgb: "FFFFFF" }, bold: true }, // Texto blanco y en negrita
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  /**
   * Exporta datos a PDF con un diseño UI/UX premium y logo de empresa
   * @param columns Cabeceras de la tabla (ej. ['Nombre', 'Descripción'])
   * @param data Matriz de datos (ej. [['Lácteos', '...'], ['Frutas', '...']])
   * @param title Título del reporte
   */
  exportarPDF(columns: string[], data: any[][], title: string) {
    if (!data || data.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const orientation = columns.length > 5 ? 'l' : 'p';
    const doc = new jsPDF(orientation, 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let empresaNombre = localStorage.getItem('empresa_nombre') || 'Mi Empresa SaaS';
    let adminNombre = localStorage.getItem('name') || 'Administrador';

    const fechaReporte = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' });

    // Llama a la plantilla estándar
    this.dibujarPlantillaEncabezado(doc, pageWidth, empresaNombre, 60, 45, 'Reporte:', 'General', 450, 340);

    // --- SECCIÓN DE TÍTULO DE REPORTE ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(title, 60, 170);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha de generación: ${fechaReporte}`, 60, 190);

    // --- TABLA ---
    autoTable(doc, {
      head: [columns],
      body: data,
      startY: 210,
      margin: { left: 60, right: 30, bottom: 140 },
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 8,
        textColor: [15, 23, 42]
      },
      headStyles: {
        fillColor: [226, 232, 240], // Slate 200
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        halign: 'left',
        valign: 'middle'
      },
      didParseCell: (dataArg) => {
        if (dataArg.section === 'body' && dataArg.row.raw) {
          const rowData = dataArg.row.raw as any[];
          const isTotalRow = rowData.some(cell => typeof cell === 'string' && cell.includes('TOTAL GENERAL'));
          if (isTotalRow) {
            dataArg.cell.styles.fontStyle = 'bold';
            dataArg.cell.styles.fillColor = [241, 245, 249]; // slate-100 para destacar
            // El valor suele estar en la última columna
            if (dataArg.column.index === rowData.length - 1) {
              dataArg.cell.styles.fontSize = 10; // Subimos 1 punto (base 9)
            }
          }
        }
      },
      didDrawCell: (dataArg) => {
        doc.setDrawColor(203, 213, 225); // Slate 300
        doc.setLineWidth(0.5);
        doc.rect(dataArg.cell.x, dataArg.cell.y, dataArg.cell.width, dataArg.cell.height);
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY || 210;

    // Si la tabla terminó muy abajo, pasamos la firma a la siguiente página para no pisar el footer
    if (finalY > pageHeight - 160) {
      doc.addPage();
      finalY = 60;
    }

    // --- FIRMA ---
    doc.setFont('times', 'italic');
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42);
    doc.text(adminNombre, pageWidth - 45, finalY + 60, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Administrador', pageWidth - 45, finalY + 75, { align: 'right' });

    // --- FOOTER ---
    const bottomY = pageHeight - 60;
    
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1);
    doc.line(90, bottomY, pageWidth - 45, bottomY);

    const str = "Página " + (doc as any).internal.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(str, 90, bottomY + 20);
    doc.text("Sistema POS - Todos los derechos reservados", pageWidth - 45, bottomY + 20, { align: 'right' });

    // Descargar
    doc.save(`${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * Exporta una factura de compra individual a PDF (Factura Comercial)
   */
  exportarFacturaComercialPDF(compra: any) {
    if (!compra) return;

    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let empresaNombre = localStorage.getItem('empresa_nombre') || 'Mi Empresa SaaS';
    let adminNombre = localStorage.getItem('name') || 'Administrador';

    const numFactura = compra.numero_factura_proveedor || '001';
    
    // Llama a la plantilla estándar
    this.dibujarPlantillaEncabezado(doc, pageWidth, empresaNombre, 90, 45, 'Factura:', numFactura, 450, 350);

    // --- SECCIÓN DE DATOS ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Facturar a', 90, 160);
    doc.text('Enviar a', 250, 160);

    // Datos Proveedor
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(compra.proveedor_nombre || 'Proveedor Desconocido', 90, 180);
    doc.setTextColor(100, 116, 139);
    doc.text('Proveedor Registrado', 90, 195);
    
    // Datos Empresa
    doc.setTextColor(15, 23, 42);
    doc.text(empresaNombre, 250, 180);
    doc.setTextColor(100, 116, 139);
    doc.text('Sede Principal', 250, 195);

    // Fechas y Números alineados a la derecha
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Fecha', 450, 160, { align: 'right' });
    doc.text('N° de pedido', 450, 180, { align: 'right' });
    doc.text('Fecha vencimiento', 450, 200, { align: 'right' });

    const fechaVisual = compra.fecha_formateada || (compra.fecha_compra ? (compra.fecha_compra.includes('T00:00:00') ? compra.fecha_compra.substring(0, 10).split('-').reverse().join('/') : new Date(compra.fecha_compra).toLocaleDateString()) : 'N/A');
    doc.text(fechaVisual, 550, 160, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(numFactura, 550, 180, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(fechaVisual, 550, 200, { align: 'right' });

    // --- TABLA DE ARTÍCULOS ---
    const columns = ['Cant.', 'Descripción', 'Precio unitario', 'Importe'];
    const data = compra.detalles?.map((d: any) => [
      d.cantidad,
      `${d.producto?.producto?.nombre || 'Producto'} ${d.producto?.sku ? '('+d.producto.sku+')' : ''}`,
      `$ ${Number(d.costo_unitario).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`,
      `$ ${Number(d.subtotal).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
    ]) || [];

    autoTable(doc, {
      head: [columns],
      body: data,
      startY: 230,
      margin: { left: 90, right: 45 },
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 8,
        textColor: [15, 23, 42]
      },
      headStyles: {
        fillColor: [226, 232, 240], // Slate 200
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 50 },
        1: { halign: 'left' },
        2: { halign: 'right', cellWidth: 90 },
        3: { halign: 'right', cellWidth: 90 }
      },
      didDrawCell: (dataArg) => {
        // Bordes de la tabla estilo excel simple
        doc.setDrawColor(203, 213, 225); // Slate 300
        doc.setLineWidth(0.5);
        doc.rect(dataArg.cell.x, dataArg.cell.y, dataArg.cell.width, dataArg.cell.height);
      }
    });

    // --- TOTALES ---
    const finalY = (doc as any).lastAutoTable.finalY || 230;
    
    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Subtotal', 400, finalY + 30);
    doc.text(`$ ${Number(compra.total_compra).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`, 550, finalY + 30, { align: 'right' });

    // IVA (Simulado en 0% si no tenemos)
    doc.text('IVA 0.0%', 400, finalY + 50);
    doc.text('$ 0', 550, finalY + 50, { align: 'right' });

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Total', 400, finalY + 75);
    doc.text(`$ ${Number(compra.total_compra).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`, 550, finalY + 75, { align: 'right' });

    // --- FIRMA ---
    doc.setFont('times', 'italic');
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42);
    doc.text(adminNombre, 520, finalY + 120, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Administrador', 520, finalY + 135, { align: 'right' });

    // --- FOOTER TÉRMINOS Y CONDICIONES ---
    const bottomY = pageHeight - 140;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1);
    doc.line(90, bottomY, 550, bottomY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('Condiciones y forma de pago', 90, bottomY + 20);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('El pago se realizará según los plazos acordados con el proveedor.', 90, bottomY + 40);
    
    doc.setTextColor(100, 116, 139);
    doc.text('Sistema POS - Todos los derechos reservados', 90, bottomY + 60);

    // Descargar
    doc.save(`Factura_Compra_${numFactura}.pdf`);
  }

  /**
   * Exporta la Ficha Técnica de un producto a PDF
   */
  exportarFichaTecnicaPDF(producto: any, categoriaNombre: string, subcategoriaNombre: string) {
    if (!producto) return;

    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let empresaNombre = localStorage.getItem('empresa_nombre') || 'Mi Empresa SaaS';

    // Llama a la plantilla estándar
    this.dibujarPlantillaEncabezado(doc, pageWidth, empresaNombre, 90, 45, 'Ficha:', 'Técnica', 450, 380);

    // --- NOMBRE DEL PRODUCTO ---
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    
    const splitTitle = doc.splitTextToSize(producto.nombre || 'Producto Sin Nombre', pageWidth - 135);
    doc.text(splitTitle, 90, 170);

    let startY = 170 + (splitTitle.length * 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229); // primary color
    doc.text(producto.codigo || 'Sin código', 90, startY);
    
    startY += 30;

    const contentStartX = 90;
    const imageSize = 160;
    let cardsStartX = contentStartX; 
    let contentBottomY = startY;

    // --- IMAGEN DEL PRODUCTO (Si existe y es base64) ---
    if (producto.foto_url && producto.foto_url.startsWith('data:image')) {
       try {
         const imgFormat = producto.foto_url.substring(11, 14) === 'jpe' ? 'JPEG' : 'PNG';
         doc.addImage(producto.foto_url, imgFormat, contentStartX, startY, imageSize, imageSize);
         cardsStartX = contentStartX + imageSize + 30;
         contentBottomY = startY + imageSize;
       } catch (e) {
         console.warn("No se pudo agregar la imagen del producto a la ficha");
       }
    }

    // --- INFORMACIÓN BÁSICA (Tarjetas Sobrias) ---
    const cardWidth = pageWidth - 45 - cardsStartX;
    const cardHeight = 65;
    
    // Tarjeta 1: CATEGORÍA
    doc.setFillColor(248, 250, 252); // slate-50 (Sobrio)
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(1);
    doc.roundedRect(cardsStartX, startY, cardWidth, cardHeight, 6, 6, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('CATEGORÍA', cardsStartX + 15, startY + 25);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(categoriaNombre || 'N/A', cardsStartX + 15, startY + 50);

    // Tarjeta 2: SUBCATEGORÍA
    const card2Y = startY + cardHeight + 20;
    doc.setFillColor(248, 250, 252); // slate-50 (Sobrio)
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(1);
    doc.roundedRect(cardsStartX, card2Y, cardWidth, cardHeight, 6, 6, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('SUBCATEGORÍA', cardsStartX + 15, card2Y + 25);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(subcategoriaNombre || 'N/A', cardsStartX + 15, card2Y + 50);

    contentBottomY = Math.max(contentBottomY, card2Y + cardHeight);

    startY = contentBottomY + 40;

    // DESCRIPCION
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('DESCRIPCIÓN DEL PRODUCTO', 90, startY);
    
    startY += 15;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const descText = doc.splitTextToSize(producto.descripcion || 'No hay descripción disponible para este producto.', pageWidth - 135);
    doc.text(descText, 90, startY);

    startY += (descText.length * 15) + 30;

    // --- PRECIOS E INVENTARIO ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('Datos Financieros e Inventario', 90, startY);
    startY += 15;

    const dataPrices = [
      ['Costo Unitario', `$ ${Number(producto.precio_compra || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`],
      ['Precio de Venta', `$ ${Number(producto.precio_venta || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`],
      ['Stock Actual', `${producto.stock || 0} unidades`],
      ['Estado', producto.is_active ? 'Activo' : 'Inactivo']
    ];

    autoTable(doc, {
      body: dataPrices,
      startY: startY,
      margin: { left: 90, right: 45 },
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 8,
        textColor: [15, 23, 42]
      },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 150 },
        1: { halign: 'right' }
      },
      didDrawCell: (dataArg) => {
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.setLineWidth(0.5);
        doc.rect(dataArg.cell.x, dataArg.cell.y, dataArg.cell.width, dataArg.cell.height);
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || startY + 100;

    // --- FOOTER TÉRMINOS Y CONDICIONES ---
    const bottomY = pageHeight - 60;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1);
    doc.line(90, bottomY, pageWidth - 45, bottomY);

    const str = "Página " + (doc as any).internal.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(str, 90, bottomY + 20);
    doc.text("Sistema POS - Todos los derechos reservados", pageWidth - 45, bottomY + 20, { align: 'right' });

    doc.save(`Ficha_Tecnica_${producto.codigo || 'Producto'}.pdf`);
  }

  // --- EXPORTAR KARDEX PDF ---
  exportarKardexPDF(producto: any, compras: any[], ventas: any[]) {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    let empresaNombre = localStorage.getItem('empresa_nombre') || 'Mi Empresa SaaS';
    let adminNombre = localStorage.getItem('name') || 'Administrador';
    const fechaReporte = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' });

    // Llama a la plantilla estándar
    this.dibujarPlantillaEncabezado(doc, pageWidth, empresaNombre, 90, 45, 'Reporte:', 'Kardex', 550, 450);
    
    // --- TÍTULO ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Reporte de Movimientos (Kardex)', 90, 170);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha de generación: ${fechaReporte}`, 90, 190);

    // --- DETALLES DE PRODUCTO (Caja redondeada) ---
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(1);
    doc.roundedRect(90, 205, pageWidth - 135, 65, 6, 6, 'FD');

    // SKU
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('SKU:', 105, 225);
    
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(producto.sku, 140, 225);

    // Nombre Producto
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(producto.nombre_producto, 105, 242);

    // Stock Actual
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Stock Actual:', 105, 259);
    
    if (producto.stock_actual > producto.stock_minimo) {
      doc.setTextColor(5, 150, 105); // Emerald 600
    } else if (producto.stock_actual === producto.stock_minimo) {
      doc.setTextColor(217, 119, 6); // Amber 600
    } else {
      doc.setTextColor(225, 29, 72); // Rose 600
    }
    doc.text(`${producto.stock_actual} und`, 180, 259);

    let startY = 290;

    // --- TABLA COMPRAS (ENTRADAS) ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('COMPRAS (INGRESOS)', 90, startY);

    const columnsCompras = ['Factura', 'Fecha Entrada', 'Cantidad', 'V. Unitario', 'Total'];
    const dataCompras: any[][] = compras.map(c => [
      c.factura,
      this.formatearFechaKardex(c.fecha),
      `+${c.cantidad}`,
      `$ ${Number(c.valor_unitario).toLocaleString('es-CO')}`,
      `$ ${Number(c.total).toLocaleString('es-CO')}`
    ]);

    const totalCantCompras = compras.reduce((acc, c) => acc + Number(c.cantidad || 0), 0);
    const totalValorCompras = compras.reduce((acc, c) => acc + Number(c.total || 0), 0);

    if (compras.length > 0) {
      dataCompras.push([
        'TOTAL COMPRAS',
        '',
        `+${totalCantCompras}`,
        '',
        `$ ${totalValorCompras.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
      ]);
    } else {
      dataCompras.push(['Sin ingresos registrados', '', '', '', '']);
    }

    autoTable(doc, {
      head: [columnsCompras],
      body: dataCompras,
      startY: startY + 5,
      margin: { left: 90, right: 45 },
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 8, textColor: [15, 23, 42] },
      headStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
      didParseCell: (dataArg) => {
        if (dataArg.section === 'body' && dataArg.row.raw) {
          const rowData = dataArg.row.raw as any[];
          const isTotalRow = rowData.some(cell => typeof cell === 'string' && cell.includes('TOTAL COMPRAS'));
          if (isTotalRow) {
            dataArg.cell.styles.fontStyle = 'bold';
            dataArg.cell.styles.fillColor = [241, 245, 249];
            if (dataArg.column.index === 2) {
              dataArg.cell.styles.textColor = [5, 150, 105]; // emerald-600
            } else if (dataArg.column.index === 4) {
              dataArg.cell.styles.textColor = [4, 120, 87]; // emerald-700
            }
          }
        }
      },
      didDrawCell: (dataArg) => {
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.rect(dataArg.cell.x, dataArg.cell.y, dataArg.cell.width, dataArg.cell.height);
      }
    });

    let lastY = (doc as any).lastAutoTable.finalY || startY + 20;
    if (lastY > pageHeight - 160) {
      doc.addPage();
      startY = 60;
    } else {
      startY = lastY + 25;
    }

    // --- TABLA VENTAS (SALIDAS) ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('VENTAS (SALIDAS)', 90, startY);

    const columnsVentas = ['Factura/Ticket', 'Fecha Salida', 'Vendedor', 'Cantidad', 'V. Venta U.', 'Total'];
    const dataVentas: any[][] = ventas.map(v => [
      v.factura,
      this.formatearFechaKardex(v.fecha),
      v.vendedor || 'Vendedor',
      `-${v.cantidad}`,
      `$ ${Number(v.valor_unitario).toLocaleString('es-CO')}`,
      `$ ${Number(v.total).toLocaleString('es-CO')}`
    ]);

    const totalCantVentas = ventas.reduce((acc, v) => acc + Number(v.cantidad || 0), 0);
    const totalValorVentas = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);

    if (ventas.length > 0) {
      dataVentas.push([
        'TOTAL VENTAS',
        '',
        '',
        `-${totalCantVentas}`,
        '',
        `$ ${totalValorVentas.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
      ]);
    } else {
      dataVentas.push(['Sin salidas registradas', '', '', '', '', '']);
    }

    autoTable(doc, {
      head: [columnsVentas],
      body: dataVentas,
      startY: startY + 5,
      margin: { left: 90, right: 45 },
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 8, textColor: [15, 23, 42] },
      headStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
      didParseCell: (dataArg) => {
        if (dataArg.section === 'body' && dataArg.row.raw) {
          const rowData = dataArg.row.raw as any[];
          const isTotalRow = rowData.some(cell => typeof cell === 'string' && cell.includes('TOTAL VENTAS'));
          if (isTotalRow) {
            dataArg.cell.styles.fontStyle = 'bold';
            dataArg.cell.styles.fillColor = [241, 245, 249];
            if (dataArg.column.index === 3) {
              dataArg.cell.styles.textColor = [225, 29, 72]; // rose-600
            } else if (dataArg.column.index === 5) {
              dataArg.cell.styles.textColor = [67, 56, 202]; // indigo-700
            }
          }
        }
      },
      didDrawCell: (dataArg) => {
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.rect(dataArg.cell.x, dataArg.cell.y, dataArg.cell.width, dataArg.cell.height);
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY || startY + 50;
    if (finalY > pageHeight - 160) {
      doc.addPage();
      finalY = 60;
    }

    // --- FOOTER ---
    const bottomY = pageHeight - 60;
    
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1);
    doc.line(90, bottomY, pageWidth - 45, bottomY);

    const str = "Página " + (doc as any).internal.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(str, 90, bottomY + 20);
    doc.text("Sistema POS - Todos los derechos reservados", pageWidth - 45, bottomY + 20, { align: 'right' });

    // Guardar
    doc.save(`Kardex_${producto.sku}_${new Date().getTime()}.pdf`);
  }

  private formatearFechaKardex(fechaStr: any): string {
    if (!fechaStr) return '';
    const str = String(fechaStr);
    if (str.includes('T00:00:00')) {
      const soloFecha = str.substring(0, 10);
      const partes = soloFecha.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    }
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleString('es-CO');
  }

  // --- EXPORTAR CIERRE Z PDF ---
  exportarCierreZPDF(cierreData: any) {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    let empresaNombre = localStorage.getItem('empresa_nombre') || 'Mi Empresa SaaS';
    let cajeroNombre = localStorage.getItem('name') || 'Cajero';
    const fechaActual = new Date().toLocaleString();

    // 1. Cabecera Estándar
    this.dibujarPlantillaEncabezado(doc, pageWidth, empresaNombre, 90, 45, 'Reporte:', 'Cierre Z', 450, 340);

    // 2. Título principal
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Cierre de Caja (Reporte Z)', 90, 170);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha y hora de cierre: ${fechaActual}`, 90, 190);

    // 3. Tarjeta de Resumen (Caja redondeada)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(1);
    doc.roundedRect(90, 210, pageWidth - 135, 160, 8, 8, 'FD');

    // Desglose de Pagos
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Desglose de Caja', 105, 235);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    
    // Base Caja
    doc.text('Base Inicial:', 105, 255);
    doc.text(`$ ${cierreData.base_caja.toLocaleString('es-CO')}`, 250, 255);

    // Efectivo
    doc.text('Ventas Efectivo:', 105, 275);
    doc.text(`$ ${cierreData.efectivo.toLocaleString('es-CO')}`, 250, 275);
    
    // Efectivo Total
    doc.setFont('helvetica', 'bold');
    doc.text('Total Efectivo Esperado:', 105, 295);
    doc.text(`$ ${cierreData.efectivo_en_caja.toLocaleString('es-CO')}`, 250, 295);

    doc.setFont('helvetica', 'normal');
    // Tarjeta
    doc.text('Ventas Tarjeta:', 105, 315);
    doc.text(`$ ${cierreData.tarjeta.toLocaleString('es-CO')}`, 250, 315);

    // Nequi/Transferencia
    doc.text('Ventas Nequi/Transf:', 105, 335);
    doc.text(`$ ${cierreData.nequi.toLocaleString('es-CO')}`, 250, 335);

    // Operaciones Totales
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total de transacciones: ${cierreData.operaciones} operaciones.`, 105, 355);

    // 4. GRAN TOTAL
    doc.setFillColor(224, 231, 255); // indigo-50
    doc.setDrawColor(199, 210, 254); // indigo-200
    doc.setLineWidth(1);
    doc.roundedRect(90, 390, pageWidth - 135, 50, 8, 8, 'FD');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(49, 46, 129); // indigo-900
    doc.text('VENTA TOTAL DEL TURNO', 105, 420);

    doc.setFontSize(18);
    doc.text(`$ ${cierreData.total.toLocaleString('es-CO')}`, pageWidth - 60, 422, { align: 'right' });

    // 5. Firma de Responsable
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.line(90, 520, 280, 520);
    doc.text(`Firma: ${cajeroNombre}`, 90, 535);

    // Footer
    const bottomY = pageHeight - 60;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1);
    doc.line(90, bottomY, pageWidth - 45, bottomY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Página 1", 90, bottomY + 20);
    doc.text("Sistema POS - Todos los derechos reservados", pageWidth - 45, bottomY + 20, { align: 'right' });

    doc.save(`Cierre_Caja_Z_${new Date().getTime()}.pdf`);
  }

  // --- EXPORTAR REPORTE X PDF (VENTAS DEL DÍA) ---
  exportarReporteXPDF(cierreData: any) {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    let empresaNombre = localStorage.getItem('empresa_nombre') || 'Mi Empresa SaaS';
    const fechaActual = new Date().toLocaleString();

    // 1. Cabecera Estándar
    this.dibujarPlantillaEncabezado(doc, pageWidth, empresaNombre, 90, 45, 'Reporte:', 'Ventas del Día', 450, 310);

    // 2. Título principal
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Ventas en Curso (Reporte X)', 90, 170);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha y hora de consulta: ${fechaActual}`, 90, 190);

    // 3. Tarjeta de Resumen (Caja redondeada)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(1);
    doc.roundedRect(90, 210, pageWidth - 135, 140, 8, 8, 'FD');

    // Desglose de Pagos
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Desglose por Método de Pago', 105, 235);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    
    // Efectivo
    doc.text('Efectivo:', 105, 260);
    doc.text(`$ ${cierreData.efectivo.toLocaleString('es-CO')}`, 250, 260);

    // Tarjeta
    doc.text('Tarjeta:', 105, 280);
    doc.text(`$ ${cierreData.tarjeta.toLocaleString('es-CO')}`, 250, 280);

    // Nequi/Transferencia
    doc.text('Nequi/Transf:', 105, 300);
    doc.text(`$ ${cierreData.nequi.toLocaleString('es-CO')}`, 250, 300);

    // Operaciones Totales
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total de transacciones al momento: ${cierreData.operaciones} operaciones.`, 105, 330);

    // 4. GRAN TOTAL
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(167, 243, 208); // emerald-200
    doc.setLineWidth(1);
    doc.roundedRect(90, 370, pageWidth - 135, 50, 8, 8, 'FD');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70); // emerald-900
    doc.text('VENTA ACUMULADA', 105, 400);

    doc.setFontSize(18);
    doc.text(`$ ${cierreData.total.toLocaleString('es-CO')}`, pageWidth - 60, 402, { align: 'right' });

    // 5. Tabla de Detalles de Operaciones
    let finalY = 440;
    if (cierreData.detalles_ventas && cierreData.detalles_ventas.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Detalle de Operaciones', 90, finalY);
      
      const columns = ['Ticket', 'Hora', 'Método', 'Productos', 'Total'];
      const data = cierreData.detalles_ventas.map((det: any) => [
        det.ticket,
        det.hora,
        det.metodo,
        det.productos,
        `$ ${det.total.toLocaleString('es-CO')}`
      ]);

      autoTable(doc, {
        startY: finalY + 15,
        head: [columns],
        body: data,
        theme: 'grid',
        margin: { left: 90, right: 45 },
        styles: { fontSize: 8, cellPadding: 6, textColor: [71, 85, 105], lineColor: [226, 232, 240], lineWidth: 0.5 },
        headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [79, 70, 229], cellWidth: 70 },
          1: { cellWidth: 40 },
          2: { cellWidth: 60 },
          4: { fontStyle: 'bold', halign: 'right', textColor: [6, 95, 70], cellWidth: 75 }
        },
        didDrawPage: function (dataArg: any) {
          // Footer for every page
          const str = 'Página ' + dataArg.pageNumber;
          const pY = doc.internal.pageSize.height - 60;
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(1);
          doc.line(90, pY, doc.internal.pageSize.width - 45, pY);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text(str, 90, pY + 20);
          doc.text("Sistema POS - Todos los derechos reservados", doc.internal.pageSize.width - 45, pY + 20, { align: 'right' });
        }
      });
    } else {
      // Footer solo para 1 pagina si no hay tabla
      const bottomY = pageHeight - 60;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(1);
      doc.line(90, bottomY, pageWidth - 45, bottomY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Página 1", 90, bottomY + 20);
      doc.text("Sistema POS - Todos los derechos reservados", pageWidth - 45, bottomY + 20, { align: 'right' });
    }

    doc.save(`Ventas_Dia_X_${new Date().getTime()}.pdf`);
  }

  /**
   * Exporta una factura / comprobante de venta individual a PDF con diseño premium
   */
  exportarFacturaVentaPDF(venta: any, clienteDatos?: any) {
    if (!venta) return;

    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const empresaNombre = localStorage.getItem('empresa_nombre') || 'Mi Empresa SaaS';
    const adminNombre = venta.vendedor || localStorage.getItem('name') || 'Caja';

    const numTicket = venta.numero_ticket || venta.ticket || 'TKT-001';
    const cliente = clienteDatos || venta.cliente_datos || null;

    // 1. Plantilla de Encabezado Corporativo
    this.dibujarPlantillaEncabezado(doc, pageWidth, empresaNombre, 90, 45, 'Factura:', numTicket, 450, 350);

    // 2. Información de Factura y Cliente
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('DATOS DEL CLIENTE', 90, 160);
    doc.text('DETALLES DEL COMPROBANTE', 345, 160);

    // Tarjeta Cliente (Izquierda)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.roundedRect(90, 170, 245, 75, 6, 6, 'FD');

    if (cliente) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim() || 'Cliente Registrado', 105, 190, { maxWidth: 220 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`C.C. / NIT: ${cliente.cedula || 'N/A'}`, 105, 205, { maxWidth: 220 });
      doc.text(`Tel: ${cliente.telefono || 'Sin teléfono'}`, 105, 220, { maxWidth: 220 });
      if (cliente.direccion) {
        doc.text(`Dir: ${cliente.direccion}`, 105, 235, { maxWidth: 220 });
      }
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Consumidor Final (Cliente General)', 105, 190, { maxWidth: 220 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('C.C.: 222222222222', 105, 205, { maxWidth: 220 });
      doc.text('Venta en mostrador sin identificación', 105, 220, { maxWidth: 220 });
    }

    // Tarjeta Comprobante (Derecha) - Ancho controlado para evitar desbordes
    const cardDerX = 345;
    const cardDerW = pageWidth - 45 - cardDerX;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.roundedRect(cardDerX, 170, cardDerW, 75, 6, 6, 'FD');

    const colValX = 422;
    const maxValW = cardDerW - (colValX - cardDerX) - 8;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Ticket N°:', cardDerX + 12, 190);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(numTicket, colValX, 190, { maxWidth: maxValW });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Fecha:', cardDerX + 12, 205);
    doc.setTextColor(15, 23, 42);
    const fechaTexto = venta.fecha ? new Date(venta.fecha).toLocaleString('es-CO') : new Date().toLocaleString('es-CO');
    doc.text(fechaTexto, colValX, 205, { maxWidth: maxValW });

    doc.setTextColor(100, 116, 139);
    doc.text('Método:', cardDerX + 12, 220);
    doc.setTextColor(15, 23, 42);
    let metodoLimpio = venta.metodo_pago || 'EFECTIVO';
    if (metodoLimpio.toUpperCase().startsWith('MIXTO')) {
      metodoLimpio = 'PAGO MIXTO';
    }
    doc.text(metodoLimpio, colValX, 220, { maxWidth: maxValW });

    doc.setTextColor(100, 116, 139);
    doc.text('Atendido por:', cardDerX + 12, 235);
    doc.setTextColor(15, 23, 42);
    doc.text(adminNombre, colValX, 235, { maxWidth: maxValW });

    // 3. Tabla de Productos
    const columns = ['Cant.', 'Descripción del Producto', 'Precio Unit.', 'Subtotal'];
    const dataRows = (venta.detalles || []).map((d: any) => [
      d.cantidad || 1,
      d.nombre_producto || d.nombre || 'Producto',
      `$ ${Number(d.precio_unitario || d.precio || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`,
      `$ ${Number(d.subtotal || ((d.cantidad || 1) * (d.precio_unitario || d.precio || 0))).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
    ]);

    autoTable(doc, {
      head: [columns],
      body: dataRows,
      startY: 265,
      margin: { left: 90, right: 45 },
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 8,
        textColor: [15, 23, 42]
      },
      headStyles: {
        fillColor: [226, 232, 240],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 50 },
        1: { halign: 'left' },
        2: { halign: 'right', cellWidth: 90 },
        3: { halign: 'right', cellWidth: 90 }
      },
      didDrawCell: (dataArg) => {
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.rect(dataArg.cell.x, dataArg.cell.y, dataArg.cell.width, dataArg.cell.height);
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 265;

    // 4. Totales y Liquidación Dinámica
    const totalVenta = Number(venta.total || 0);
    let currentY = finalY + 22;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal:', 380, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`$ ${totalVenta.toLocaleString('es-CO')}`, pageWidth - 45, currentY, { align: 'right' });
    currentY += 15;

    // Extraer o procesar desglose de pagos
    let pd = venta.pagos_detalle;
    if (!pd && venta.metodo_pago && venta.metodo_pago.includes('(')) {
      const match = venta.metodo_pago.match(/\((.*?)\)/);
      if (match && match[1]) {
        const parts = match[1].split(',').map((p: string) => p.trim());
        const parsed: any = { tipo: 'MIXTO' };
        parts.forEach((p: string) => {
          const num = Number(p.replace(/[^0-9]/g, ''));
          if (p.toLowerCase().includes('efectivo')) parsed.efectivo = num;
          if (p.toLowerCase().includes('tarjeta')) parsed.tarjeta = num;
          if (p.toLowerCase().includes('nequi')) parsed.nequi = num;
        });
        pd = parsed;
      }
    }

    if (pd) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      if (pd.tipo === 'MIXTO') {
        doc.setTextColor(100, 116, 139);
        if (pd.efectivo > 0) {
          doc.text('• Efectivo:', 385, currentY);
          doc.text(`$ ${Number(pd.efectivo).toLocaleString('es-CO')}`, pageWidth - 45, currentY, { align: 'right' });
          currentY += 13;
        }
        if (pd.tarjeta > 0) {
          doc.text('• Tarjeta:', 385, currentY);
          doc.text(`$ ${Number(pd.tarjeta).toLocaleString('es-CO')}`, pageWidth - 45, currentY, { align: 'right' });
          currentY += 13;
        }
        if (pd.nequi > 0) {
          doc.text('• Nequi / QR:', 385, currentY);
          doc.text(`$ ${Number(pd.nequi).toLocaleString('es-CO')}`, pageWidth - 45, currentY, { align: 'right' });
          currentY += 13;
        }
        if (pd.cambio > 0) {
          doc.text('• Cambio (Vueltos):', 385, currentY);
          doc.setTextColor(5, 150, 105);
          doc.text(`$ ${Number(pd.cambio).toLocaleString('es-CO')}`, pageWidth - 45, currentY, { align: 'right' });
          currentY += 13;
        }
      } else if (pd.dinero_recibido_efectivo > 0) {
        doc.setTextColor(100, 116, 139);
        doc.text('Dinero recibido:', 380, currentY);
        doc.text(`$ ${Number(pd.dinero_recibido_efectivo).toLocaleString('es-CO')}`, pageWidth - 45, currentY, { align: 'right' });
        currentY += 13;
        if (pd.cambio > 0) {
          doc.text('Cambio (Vueltos):', 380, currentY);
          doc.setTextColor(5, 150, 105);
          doc.text(`$ ${Number(pd.cambio).toLocaleString('es-CO')}`, pageWidth - 45, currentY, { align: 'right' });
          currentY += 13;
        }
      }
    }

    // Gran Total (Posicionado dinámicamente con margen respecto a currentY)
    const boxTotalY = currentY + 8;
    const boxTotalHeight = 34;

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(360, boxTotalY, pageWidth - 45 - 360, boxTotalHeight, 6, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL:', 375, boxTotalY + 22);

    doc.setFontSize(13);
    doc.setTextColor(79, 70, 229);
    doc.text(`$ ${totalVenta.toLocaleString('es-CO')}`, pageWidth - 55, boxTotalY + 22, { align: 'right' });

    // Mensaje de Agradecimiento (alineado con la altura del total)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105);
    doc.text('¡Gracias por su compra!', 90, boxTotalY + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Conserve este comprobante para cualquier cambio o garantía.', 90, boxTotalY + 28);

    // Footer
    const bottomY = pageHeight - 50;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1);
    doc.line(90, bottomY, pageWidth - 45, bottomY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Documento equivalente a factura - Sistema POS', 90, bottomY + 18);
    doc.text(`Impreso por ${adminNombre}`, pageWidth - 45, bottomY + 18, { align: 'right' });

    doc.save(`Factura_${numTicket}.pdf`);
  }

  /**
   * Genera el enlace de WhatsApp para enviar la factura y el agradecimiento al cliente
   */
  generarEnlaceWhatsAppVenta(venta: any, cliente: any): { url: string | null; telefono: string | null; mensaje: string } {
    if (!cliente || !cliente.telefono) {
      return { url: null, telefono: null, mensaje: '' };
    }

    const empresaNombre = localStorage.getItem('empresa_nombre') || 'Nuestra Tienda';
    const numTicket = venta.numero_ticket || venta.ticket || 'TKT';
    const total = Number(venta.total || 0).toLocaleString('es-CO');
    const metodo = venta.metodo_pago || 'Efectivo';

    // Lista de productos
    let listaProds = '';
    if (venta.detalles && venta.detalles.length > 0) {
      listaProds = venta.detalles.map((d: any) => {
        const cant = d.cantidad || 1;
        const nom = d.nombre_producto || d.nombre || 'Producto';
        const sub = Number(d.subtotal || ((d.precio_unitario || d.precio || 0) * cant)).toLocaleString('es-CO');
        return `• ${cant}x ${nom} - $${sub}`;
      }).join('\n');
    }

    const mensaje = 
`🧾 *COMPROBANTE DE COMPRA*
¡Hola, *${cliente.nombres} ${cliente.apellidos}*! 👋

Muchas gracias por su compra en *${empresaNombre}*. ❤️

📌 *Ticket:* #${numTicket}
💳 *Método de Pago:* ${metodo}

🛒 *DETALLE:*
${listaProds}

💰 *TOTAL PAGADO: $${total}*

✨ *¡Gracias por su preferencia! Esperamos servirle nuevamente pronto.*`;

    // Limpiar número telefónico
    let tel = String(cliente.telefono).replace(/\D/g, '');
    if (tel.length === 10 && tel.startsWith('3')) {
      tel = '57' + tel; // Código país Colombia por defecto
    }

    const url = `https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(mensaje)}`;
    return { url, telefono: tel, mensaje };
  }

  /**
   * Dibuja la plantilla estándar de encabezado corporativo para todos los PDFs.
   * Centraliza logo, nombres, y líneas base.
   */
  public dibujarPlantillaEncabezado(
    doc: any,
    pageWidth: number,
    empresaNombre: string,
    margenIzquierdo: number = 60,
    margenDerecho: number = 45,
    textoVerticalAbajo: string = 'Reporte:',
    textoVerticalArriba: string = 'General',
    yRotadoAbajo: number = 450,
    yRotadoArriba: number = 340
  ): void {
    // --- MARGEN IZQUIERDO ROTADO ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(textoVerticalAbajo, 45, yRotadoAbajo, { angle: 90 });
    
    doc.setTextColor(71, 85, 105); // Slate 600
    if (textoVerticalArriba && textoVerticalArriba.length > 14) {
      doc.setFontSize(15);
    } else if (textoVerticalArriba && textoVerticalArriba.length > 10) {
      doc.setFontSize(18);
    } else {
      doc.setFontSize(22);
    }
    doc.text(textoVerticalArriba, 45, yRotadoArriba, { angle: 90 });

    // --- HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(71, 85, 105);
    doc.text(empresaNombre, margenIzquierdo, 70);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Sistema de Gestión POS', margenIzquierdo, 90);
    doc.setTextColor(100, 116, 139);
    doc.text('Generado automáticamente por el sistema', margenIzquierdo, 105);

    // LOGO
    const empresaLogo = localStorage.getItem('empresa_logo');
    if (empresaLogo) {
      try {
        const format = empresaLogo.substring(11, 14) === 'jpe' ? 'JPEG' : 'PNG';
        // ancho maximo 140
        doc.addImage(empresaLogo, format, pageWidth - margenDerecho - 140, 40, 140, 80);
      } catch (e) {
        this.dibujarFallbackLogo(doc, pageWidth, margenDerecho, empresaNombre);
      }
    } else {
      this.dibujarFallbackLogo(doc, pageWidth, margenDerecho, empresaNombre);
    }

    // LINEA SEPARADORA
    doc.setDrawColor(79, 70, 229); // Indigo 600
    doc.setLineWidth(1.5);
    doc.line(margenIzquierdo, 130, pageWidth - margenDerecho, 130);
  }

  private dibujarFallbackLogo(doc: any, pageWidth: number, margenDerecho: number, empresaNombre: string) {
    doc.setFillColor(241, 245, 249); // bg-slate-100
    doc.circle(pageWidth - margenDerecho - 35, 75, 32, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(71, 85, 105); // text-slate-600
    doc.text(empresaNombre.charAt(0).toUpperCase() || 'E', pageWidth - margenDerecho - 46, 85);
  }
}
