// 百度新闻平台：http://news.baidu.com/
// local news 数据是 js 动态请求的，可以用来测试爬虫爬取js动态请求的数据

const Crawler = require('./assets/crawler');

const c = new Crawler({
  // isStatic: false
});

c
  .queue('https://www.bilibili.com')
  .then(async data => {
    const { $, page, browser } = data;
    console.log($('div.groom-module').length)
    // console.log($('#g_iframe'))
    // browser.close();
  })
