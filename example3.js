const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');

request({ url: 'https://www.cnblogs.com' }, async (err, res) => {
  if (err) return;
  // 这里我们调用cheerio工具中的load函数，来对响应体的html字符串处理，load函数执行返回一个jq对象
  const $ = cheerio.load(res.body);
  await fs.writeFile('result.json', '[\n');
  await $('div#post_list div.post_item').each(async (index, item) => {
    const TDom = $(item).find('a.titlelnk'); // 获取博文列表标题元素
    const ADom = $(item).find('a.lightblue'); // 获取博文列表作者元素
    // 读取元素中的信息
    const info = {
      title: TDom.text(),
      blogUrl: TDom.attr('href'),
      author: ADom.text(),
      personalHomePage: ADom.attr('href')
    };
    await fs.appendFile('result.json', `${index === 0 ? '' : ',\n'}${JSON.stringify(info)}`);
  });
  fs.appendFile('result.json', '\n]');
})