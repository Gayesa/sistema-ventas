const jwt = require('jsonwebtoken');

const secret = 'cambia-este-secreto-en-produccion-min-32-caracteres-seguro';
// Raul Gracia (Fruteria La Especial)
const payload = {
  sub: 'd18b2b4a-d97e-4626-879d-0563f677d947',
  empresa_id: '4e7b4b25-414d-4fe2-b266-6fa6534dfbc6',
  rol: 'ADMIN_TIENDA',
  nombre: 'Raul Gracia'
};

const token = jwt.sign(payload, secret, { expiresIn: '8h' });

async function test() {
  console.log('--- TESTING /api/productos ---');
  try {
    const res = await fetch('http://localhost:3000/api/productos', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('STATUS:', res.status);
    const data = await res.json();
    console.log('PRODUCTOS DATA:', Array.isArray(data) ? `Found ${data.length} products` : data);
    if (Array.isArray(data) && data.length > 0) {
      console.log('First product:', {
        id: data[0].id,
        nombre: data[0].nombre,
        controla_lotes: data[0].controla_lotes,
        stock_total: data[0].stock_total
      });
    }
  } catch (e) {
    console.log('Fetch error:', e.message);
  }

  console.log('--- TESTING /api/compras ---');
  try {
    const res = await fetch('http://localhost:3000/api/compras', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('STATUS:', res.status);
    const data = await res.json();
    console.log('COMPRAS RESPONSE:', data);
  } catch (e) {
    console.log('Fetch error:', e.message);
  }

  console.log('--- TESTING /api/reportes/alertas/vencimientos ---');
  try {
    const res = await fetch('http://localhost:3000/api/reportes/alertas/vencimientos', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('STATUS:', res.status);
    const data = await res.json();
    console.log('ALERTAS DATA:', data);
  } catch (e) {
    console.log('Fetch error:', e.message);
  }
}

test().catch(console.error);
