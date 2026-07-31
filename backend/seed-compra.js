const http = require('http');

const payload = JSON.stringify({
  proveedor_id: '1',
  numero_factura_proveedor: 'F001-000248',
  fecha_ingreso: '2026-07-08',
  total_compra: 150000,
  detalles: [
    {
      producto_id: 'af335904-0005-4a41-b8eb-130999b1b727',
      cantidad: 10,
      costo_unitario: 15000
    }
  ]
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/compras',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let responseBody = '';
  res.on('data', chunk => responseBody += chunk);
  res.on('end', () => console.log('Response:', responseBody));
});

req.on('error', (e) => console.error(e));
req.write(payload);
req.end();
