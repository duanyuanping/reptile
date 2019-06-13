const express = require('express');
const blogs = require('./blogs');

const app = express();

// 博客园博文列表数据
app.get('/blog', blogs);

const server = app.listen(1000, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('server start', host, port);
})