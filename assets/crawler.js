const superagent = require('superagent');
const axios = require('axios');
const cheerio = require('cheerio');
const charset = require('superagent-charset');

charset(superagent);

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
      return this.fetchData(url);
    // 处理单个 url 字符串
    } else if (typeof url === 'string') {
      return this.fetchData([url]);
    }
  }

  /**
   * @desc 抓取多个页面中的元素
   * @param {Array} urls 需要抓取的 url 集合
   * @returns {Promise} 
   * @memberof Crawler
   */
  async fetchData(urls) {
    const tasks = urls.map(url => parallelNum => {
      return superagent
        .get(url)
        .charset('gb2312')
        .then(data => {
          const $ = cheerio.load(data.text, { decodeEntities: false });
          this.callback(undefined, { ...data, $ });
          return({ ...data, $ });
        })
        .catch(err => {
          this.callback(err);
          return Promise.reject(err);
        })
      });

    const result = await this.runLimit(tasks);
    if (urls.length < 2) {
      return result[0];
    } else {
      return Promise.all(result);
    }
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