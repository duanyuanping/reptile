const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const url = 'https://now.qq.com/pcweb/index.html';

const fn = async () => {
  const result = [];
  const browser = await puppeteer.launch(); // 开启浏览器环境
  const page = await browser.newPage(); // 打开新的页面
  await page.goto(url); // 进入某个url
  const dom = await page.$eval('html', html => html.outerHTML); // 读取html文档
  const $ = cheerio.load(dom, 'utf-8'); // cheerio解析html文档（不清楚到底会不会得不偿失，相对puppeteer语法和js源生，个人比较喜欢用jq）
  $('div.anchor-item').each((i, item) => {
    result.push({
      title: $(item).find('div.v-emotion').text(),
      url: $(item).find('div.room-cover a').attr('href')
    });
  });
  console.log(result);
  browser.close()
};

fn();