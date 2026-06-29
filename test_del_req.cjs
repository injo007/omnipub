const http = require('http');
http.request('http://localhost:3000/api/niches/test-niche', { method: 'DELETE' }, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(res.statusCode, body));
}).end();
