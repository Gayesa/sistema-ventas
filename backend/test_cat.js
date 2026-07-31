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

    const postOptions = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/categorias',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-empresa-id': empresa_id
      }
    };

    const reqPost = http.request(postOptions, resPost => {
      let dataPost = '';
      resPost.on('data', chunk => dataPost += chunk);
      resPost.on('end', () => {
        console.log('Post Status:', resPost.statusCode);
        console.log('Post Response:', dataPost);
      });
    });

    reqPost.on('error', console.error);
    reqPost.write(JSON.stringify({ nombre: 'BebidasTest', descripcion: 'test', parent_id: null }));
    reqPost.end();
  });
});

reqLogin.on('error', console.error);
reqLogin.write(JSON.stringify({ email: 'lorena@fruteria.com', pass: 'admin123' }));
reqLogin.end();
