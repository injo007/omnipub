const http = require('http');
http.request('http://localhost:3000/api/config', res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(JSON.parse(body).niches.map(n => n.id)));
}).end();
