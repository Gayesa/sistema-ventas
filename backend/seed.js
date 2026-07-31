const http = require('http');

const data = [
  { razon_social: 'Distribuidora del Pacífico', nit: '900123456-1', contacto_nombre: 'Carlos Ruiz', contacto_telefono: '3001234567', correo: 'ventas@pacifico.com', direccion: 'Calle 10 # 5-20', ciudad: 'Cali', is_active: true },
  { razon_social: 'Importaciones Globales S.A.', nit: '800987654-2', contacto_nombre: 'María López', contacto_telefono: '3109876543', correo: 'contacto@importglobal.com', direccion: 'Cra 15 # 22-10', ciudad: 'Bogotá', is_active: true },
  { razon_social: 'FarmaSalud Mayoristas', nit: '901234567-3', contacto_nombre: 'Pedro Pérez', contacto_telefono: '3152345678', correo: 'logistica@farmasalud.com', direccion: 'Avenida 5 # 40-30', ciudad: 'Medellín', is_active: true }
];

data.forEach(proveedor => {
  const payload = JSON.stringify(proveedor);
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/proveedores',
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
});
