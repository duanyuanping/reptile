const fs = require('fs');
const request = require('request');
const runLimit = require('./runLimit');
const getListData = require('./getListData');

const pageCount = 200;
const urls = [];
const proxy = 'https://www.cnblogs.com';
const limit = 5; // 最大任务并行量

for (let i = 0; i < pageCount; i++) {
  urls.push(`${proxy}/#p${i + 1}`);
}

const tasks = urls.map(url => parallelNum => new Promise((resolve, reject) => {
	console.log('当前并行任务数：', parallelNum);
	console.log('当前执行的新任务：', url);
  request({ url }, async (err, res) => {
  	if (err) reject(err);
    const data = await getListData(res.body);
  	resolve(data)
  });
}));

const fn = async () => {
  await fs.writeFile('result.json', '[\n', () => {});
  await runLimit(tasks, limit) // 调用任务并行量控制函数，返回一个Promise实例
    .then(result => {
      console.log(result);
      fs.appendFile('result.json', ']', () => {});
    }); // 这里就是所有请求所有页面的响应体对象
}

fn();