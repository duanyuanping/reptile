const cheerio = require('cheerio');
const iconvLite = require('iconv-lite');
const request = require('request');

module.exports = class Crawler {
  constructor(params) {
    const {
      maxConnection = 10,
      callback = this.callback
    } = params;

    this.maxConnection = maxConnection;
    this.callback = callback;
  }

  callback(err, res) {}

  queue(url) {
    // 处理多个 url 字符串数组
    if (Array.isArray(url)) {
      return this.fetchContent(url);
    // 处理单个 url 字符串
    } else if (typeof url === 'string') {
      return this.fetchContent([url]);
    }
  }

  /**
   * @desc 抓取多个页面中的元素
   * @param {Array} urls 需要抓取的 url 集合
   * @returns {Promise} 
   * @memberof Crawler
   */
  async fetchContent(urls) {
    const tasks = urls.map(url => parallelNum => new Promise((resolve, reject) => {
      const options = {
        url,
        encoding: null
      };
      const response = (err, res) => {
        const result = this.doEncoding(res);
        const $ = result.isHtmlType ? cheerio.load(result.str) : null;
        resolve({ ...res, $, body: result.str });
      };

      request(options, response);
    }));

    const result = await this.runLimit(tasks);
    if (urls.length < 2) {
      return result[0];
    } else {
      return Promise.all(result);
    }
  }

  /**
   * @desc 将请求的数据解码
   * @param {*} res
   * @returns {Object} isHtmlType 文件类型，str 解码后的内容
   */
  doEncoding(res) {
    // 判断请求的文件是否是 html 文件
    const isHtmlType = res.headers['content-type'].indexOf('text/html') > -1;
    const body = res.body;
    const str = body.toString();

    if (!isHtmlType) {
      console.log('file type is not html');
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
  runLimit(arr) {
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