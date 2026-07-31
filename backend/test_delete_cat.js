const http = require('http');

const loginOptions = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const reqLogin = http.request(loginOptions, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const token = json.token;
    const empresa_id = json.empresa_id;

    console.log('Login Response:', json);
    if (!token) return console.error('No token received');

    const deleteOptions = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/categorias/e7c18833-a5b5-4e73-84a9-7885c49a1e5b',
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-empresa-id': empresa_id
      }
    };

    const reqDelete = http.request(deleteOptions, resDelete => {
      let dataDelete = '';
      resDelete.on('data', chunk => dataDelete += chunk);
      resDelete.on('end', () => {
        console.log('Delete Status:', resDelete.statusCode);
        console.log('Delete Response:', dataDelete);
      });
    });

    reqDelete.on('error', console.error);
    reqDelete.end();
  });
});

reqLogin.on('error', console.error);
reqLogin.write(JSON.stringify({ email: 'admin@erp.com', pass: 'admin' }));
reqLogin.end();
