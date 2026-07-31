import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';

// Initialize pdfMake fonts
(pdfMake as any).vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  constructor() { }

  /**
   * Genera un reporte PDF con la cabecera brandeada de la empresa.
   * @param companyName Nombre de la empresa (Ej. obtenido del state global)
   * @param base64Logo Logo de la empresa en base64
   * @param title Título del reporte
   * @param data Datos de la tabla
   */
  generarReportePDF(companyName: string, base64Logo: string | null, title: string, headers: string[], data: any[][]) {
    const docDefinition: any = {
      content: [
        {
          columns: [
            base64Logo ? { image: base64Logo, width: 80 } : { text: '' },
            {
              text: companyName,
              style: 'companyHeader',
              alignment: 'right'
            }
          ],
          margin: [0, 0, 0, 20]
        },
        { text: title, style: 'header', margin: [0, 0, 0, 20] },
        {
          table: {
            headerRows: 1,
            widths: headers.map(() => '*'), // Distribución equitativa
            body: [
              headers.map(h => ({ text: h, style: 'tableHeader' })),
              ...data
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ],
      styles: {
        companyHeader: { fontSize: 18, bold: true, color: '#334155' },
        header: { fontSize: 14, bold: true, alignment: 'center', color: '#6366F1' },
        tableHeader: { bold: true, fontSize: 11, color: '#334155', fillColor: '#F8FAFC' }
      },
      defaultStyle: {
        fontSize: 10,
        color: '#64748B'
      }
    };

    pdfMake.createPdf(docDefinition).download(`${title.replace(/\s+/g, '_')}.pdf`);
  }

  /**
   * Genera un reporte Excel simple.
   */
  generarReporteExcel(companyName: string, title: string, data: any[]) {
    // Para Excel, inyectar el nombre de la empresa como primera fila es una buena práctica de "branding"
    const worksheetData = [
      [{ v: companyName, t: 's', s: { font: { bold: true, sz: 14 } } }],
      [{ v: title, t: 's', s: { font: { bold: true } } }],
      [], // Fila vacía
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.sheet_add_json(ws, data, { origin: "A4" }); // Los datos empiezan en la fila 4

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}.xlsx`);
  }
}
