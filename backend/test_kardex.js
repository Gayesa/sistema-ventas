const jwt = require('jsonwebtoken');

const secret = 'cambia-este-secreto-en-produccion-min-32-caracteres-seguro';
const payload = {
  sub: 'e46a2866-fb37-4860-8cc1-bdc1c2c8f879',
  empresa_id: '4267f67e-cea4-42a3-b59c-9383f182f7d4',
  rol: 'ADMIN_TIENDA',
  nombre: 'Andres Romero'
};

const token = jwt.sign(payload, secret, { expiresIn: '8h' });

async function test() {
  const kardexRes = await fetch('http://localhost:3000/api/productos/82002725-f250-4409-b29d-261622aed56c/kardex', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('KARDEX STATUS:', kardexRes.status);
  const kardexData = await kardexRes.json();
  console.log('KARDEX DATA:', JSON.stringify(kardexData, null, 2));

  const ventasRes = await fetch('http://localhost:3000/api/ventas', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('VENTAS STATUS:', ventasRes.status);
  const ventasData = await ventasRes.json();
  console.log('FIRST VENTA:', {
    ticket: ventasData[0]?.numero_ticket,
    vendedor: ventasData[0]?.vendedor,
    total: ventasData[0]?.total
  });
}

test().catch(console.error);
