const jwt = require('jsonwebtoken');
const http = require('http');

const secret = 'cambia-este-secreto-en-produccion-min-32-caracteres-seguro';

// Create token for empresa '4e7b4b25-414d-4fe2-b266-6fa6534dfbc6'
const token = jwt.sign(
  {
    sub: '11111111-1111-1111-1111-111111111111',
    empresa_id: '4e7b4b25-414d-4fe2-b266-6fa6534dfbc6',
    rol: 'ADMIN',
    nombre: 'Test Admin'
  },
  secret,
  { expiresIn: '1h' }
);

const payload = JSON.stringify({
  proveedor_id: '3e3a2495-d662-4929-ae0e-59d1729e17e3',
  numero_factura_proveedor: 'F001-000249',
  fecha_ingreso: '2026-09-25',
  total_compra: 300000,
  detalles: [
    {
      producto_id: '2d44c44b-8556-42ba-9e72-ba63083c7a17', // Limón Mandarino
      cantidad: 50,
      costo_unitario: 2000,
      subtotal: 100000,
      controla_lotes: false,
      numero_lote: '',
      fecha_vencimiento: ''
    },
    {
      producto_id: 'a85bf1ea-a7c0-4c27-a9eb-ac4a5de262f3', // Naranja
      cantidad: 100,
      costo_unitario: 1500,
      subtotal: 150000,
      controla_lotes: false,
      numero_lote: '',
      fecha_vencimiento: ''
    },
    {
      producto_id: '2021e342-0379-48d9-b296-76d506285289', // Crema de Leche
      cantidad: 20,
      costo_unitario: 2500,
      subtotal: 50000,
      controla_lotes: true,
      numero_lote: '1',
      fecha_vencimiento: '2026-09-30'
    },
    {
      producto_id: '1e4e9af6-2e97-4afa-bcf5-b6c1d8eba45f', // Carne de cerdo
      cantidad: 20,
      costo_unitario: 10000,
      subtotal: 200000,
      controla_lotes: false,
      numero_lote: '',
      fecha_vencimiento: ''
    }
  ]
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/api/compras',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Bearer ${token}`
    }
  },
  (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      console.log('RESPONSE BODY:', data);
    });
  }
);

req.on('error', (e) => {
  console.error('HTTP REQUEST ERROR:', e);
});

req.write(payload);
req.end();
