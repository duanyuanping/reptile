const cheerio = require('cheerio');
const iconvLite = require('iconv-lite');
const request = require('request');
const puppeteer = require('puppeteer');

module.exports = class Crawler {
  constructor(params) {
    const {
      maxConnection = 10,
      callback = this.callback,
      isStatic = true, // 是否不存在js动态拉取数据渲染
    } = params;

    this.maxConnection = maxConnection;
    this.callback = callback;
    this.isStatic = isStatic
  }

  callback(err, res) {}

  /**
   * 入口
   */
  queue(url) {
    const fetchFn = this.isStatic ? this._fetchStaticContent.bind(this) : this._fetchDynamicContent.bind(this);
    // 处理多个 url 字符串数组
    if (Array.isArray(url)) {
      return fetchFn(url);
    // 处理单个 url 字符串
    } else if (typeof url === 'string') {
      return fetchFn([url]);
    }
  }

  /**
   * @desc 抓取多个页面中的元素
   * @param {Array} urls 需要抓取的 url 集合
   * @returns {Promise} 
   * @memberof Crawler
   */
  async _fetchStaticContent(urls) {
    const fn = url => new Promise((resolve, reject) => {
      const options = {
        url,
        encoding: null
      };
      const response = (err, res) => {
        const result = this._doEncoding(res);
        const $ = result.isHtmlType ? cheerio.load(result.str) : null;
        resolve({ ...res, $, body: result.str });
      };

      request(options, response);
    });

    return this.doRunLimist(urls, fn);
  }

  /**
   * @desc 抓取js动态渲染的页面的内容
   * @param {Array} urls 需要抓取的 url 集合
   * @returns {Promise} $：jq对象；browser：浏览器对象，使用方式如后面的链接；page：使用方式，https://github.com/GoogleChrome/puppeteer;
   */
  async _fetchDynamicContent(urls) {
    console.log('请及时调用 browser.close() 异步函数消费掉 browser 对象，不然会导致程序卡死');
    const fn = url => new Promise(async (resolve, reject) => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url);
      const dom = await page.$eval('html', html => html.outerHTML);
      const $ = cheerio.load(dom, 'utf-8');
      // const iframes = await page.frames().find(f => f.name() === 'contentFrame');
      // const frame = await iframes.$eval('html', html => html.outerHTML)
      // console.log(frame);
      resolve({ $, page, browser });
    });

    return this.doRunLimist(urls, fn);
  }

  /**
   * @desc 统一调用 _runLimit，减少的代码重复
   * @param {Array} urls 请求的页面地址
   * @param {Function} fn 各自业务处理逻辑
   * @returns 如果 urls 的 length 为 1，返回 { res, $, err },；如果 length 大于 1，返回  [{res, $, err}, ...]
   */
  async doRunLimist(urls, fn) {
    const tasks = urls.map(url => parallelNum => {
      console.log('当前并发量：', parallelNum, url);
      return fn(url, parallelNum);
    });

    const result = await this._runLimit(tasks);

    if (urls.length < 2) {
      this.callback(result[0])
      return result[0];
    } else {
      this.callback(result);
      return Promise.all(result);
    }
  }

  /**
   * @desc 将请求的数据解码
   * @param {*} res
   * @returns {Object} isHtmlType 文件类型，str 解码后的内容
   */
  _doEncoding(res) {
    // 判断请求的文件是否是 html 文件
    const isHtmlType = res.headers['content-type'].indexOf('text/html') > -1;
    const body = res.body;
    const str = body.toString();

    if (!isHtmlType) {
      console.log('/////////////// file type is not html ////////////');
      return {
        isHtmlType,
        str: Buffer.isBuffer(body) ? str : body
      }
    }

    // 获取文件编码格式
    const charset = (str && str.match(/charset=['"]?([\w.-]+)/i) || [0, null])[1]; // 本段正则来自 https://www.npmjs.com/package/crawler 库 
    
    return {
      isHtmlType,
      str: iconvLite.decode(body, charset)
    };
  }

  /**
   * @desc 限制并行运行数量
   * @param {Array} arr 需要运行的任务数组，数组中的元素是 Promise 实例
   * @returns {Array} 数组元素是 Promise 实例
   * @memberof Crawler
   */
  _runLimit(arr) {
    if (!Array.isArray(arr)) return Promise.all([]);

    const limit = this.maxConnection;
    const tasks = [...arr];
    const result = [];
    let parallelNum = 0;

    return new Promise((resolve, reject) => {
      const fn = () => {
        setImmediate(() => {
          if (tasks.length < 1) resolve(result);

          while(parallelNum < limit && tasks.length > 0) {
            const task = tasks.shift();
            parallelNum++;
            result.push(
              task(parallelNum)
                .then(data => {
                  parallelNum--;
                  return data;
                })
                .catch(err => err)
            );
          }
  
          fn();
        })
      };
  
      fn();
    });
  }
}