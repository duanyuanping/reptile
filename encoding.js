const request = require('request');
const iconvLite = require('iconv-lite');
const url = 'https://www.biquku.com/0/330/';

request({
  url,
  encoding: null, // request 请求成功，不自动解码文件
}, (err, res) => {
  if (err) return;

  // 判断响应体内容是否是html文档
  const contentType = res.headers['content-type'];
  const isHtmlType = contentType && contentType.indexOf('text/html') > -1;

  const body = res.body;
  const str = body.toString();
  let data = '';

  if (isHtmlType !== -1) {
    // 读取文档中的charset值，并解码html文档
    const charset = (str && str.match(/charset=['"]?([\w.-]+)/i) || [0, null])[1]; // 本段正则来自 https://www.npmjs.com/package/crawler 库
    data = iconvLite.decode(body, charset);
  }

  console.log(data);
})