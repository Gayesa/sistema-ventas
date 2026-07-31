const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src', 'app');

const files = [
  'ventas/ventas.component.ts',
  'vendedores/vendedores.component.ts',
  'superadmin-empresas/superadmin-empresas.component.ts',
  'reportes-superadmin/reportes-superadmin.ts',
  'reportes-empresa/reportes-empresa.ts',
  'proveedores/proveedores.component.ts',
  'productos/productos.component.ts',
  'mi-empresa/mi-empresa.component.ts',
  'inventario-general/inventario-general.ts',
  'layouts/pos-layout/pos-layout.component.ts',
  'ingreso-mercancia/ingreso-mercancia.component.ts',
  'historial-ventas/historial-ventas.component.ts',
  'historial-compras/historial-compras.component.ts',
  'categorias/categorias.ts',
  'configuracion-atributos/configuracion-atributos.component.ts',
];

files.forEach(file => {
  const filePath = path.join(basePath, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Calculate relative import path based on depth
  const depth = file.split('/').length;
  let importPath;
  if (depth === 2) {
    importPath = '../../environments/environment';
  } else if (depth === 3) {
    importPath = '../../../environments/environment';
  } else {
    importPath = '../../environments/environment';
  }

  // Add import if not present
  if (!content.includes("from '" + importPath + "'") && !content.includes('from "' + importPath + '"')) {
    // Find a good place to insert — after the last import statement
    const lastImportIndex = content.lastIndexOf('\nimport ');
    if (lastImportIndex !== -1) {
      const endOfLastImport = content.indexOf('\n', lastImportIndex + 1);
      const importStatement = `\nimport { environment } from '${importPath}';`;
      content = content.slice(0, endOfLastImport) + importStatement + content.slice(endOfLastImport);
    } else {
      content = `import { environment } from '${importPath}';\n` + content;
    }
  }

  // Replace all forms of the hardcoded URL:
  // 1. 'http://localhost:3000/api/xxx' → `${environment.apiUrl}/xxx`
  // 2. `http://localhost:3000/api/xxx` → `${environment.apiUrl}/xxx`
  content = content.replace(/['"`]http:\/\/localhost:3000\/api/g, '`${environment.apiUrl}');
  
  // Fix trailing quotes: if we turned 'xxx' into `xxx', fix the closing quote
  // Pattern: `${environment.apiUrl}/something'  →  `${environment.apiUrl}/something`
  content = content.replace(/(\$\{environment\.apiUrl\}[^`'"]*?)'/g, '$1`');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated:', file);
});

console.log('\nDone! All URLs replaced.');
