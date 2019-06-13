const superagent = require('superagent');
const getListData = require('./getListData');
const runLimit = require('./runLimit');

const limit = 5; // 并行数

module.exports = async (req, res) => {
  const pageCount = req.query.count || 0; // 页面数量

  const urls = [];
  const pageTags = ['div.post_item_body h3 a.titlelnk'];
  const infoTags = ['div#profile_block a'];

  console.log('///////////////////// 获取博文列表 ////////////////////');

  // 页页面地址
  for (let i = 0; i < pageCount; i++) {
    urls.push(`http://www.cnblogs.com/?CategoryId=808&CategoryType=%22SiteHome%22&ItemListActionName=%22PostList%22&PageIndex=${i + 1}&ParentCategoryId=0`)
  }

  const getLinkTask = urls.map(url => runNum => new Promise((resolve, reject) => {
    console.log('当前并行任务数：', runNum);
    console.log('拉去新页面博文列表：', url, '\n')
    superagent.get(url, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(getListData(data.text, pageTags)[0])
    })
  }));
  
  const result = await runLimit(getLinkTask, limit);

  let links = [];
  
  result.forEach(item => {
    links = [...links, ...item];
  })

  console.log('///////////////////// 获取博文列表完成 ////////////////////');

  // 获取博文中的作者信息
  console.log('///////////////////// 获取获取博主信息 ////////////////////');

  const resData = [];
  const getAuthorInfo = links.map((item, index) => runNum => new Promise((resolve, reject) => {
    const href = item.href;
    const blogApp = href.split('/p/')[0].split('/')[3];
    const url = `http://www.cnblogs.com/mvc/blog/news.aspx?blogApp=${blogApp}`;

    console.log('当前并行任务数：', runNum);
    console.log('当前任务索引：', index)
    console.log('拉取新的博主信息：', url, '\n')
    superagent.get(url, async (err, data) => {
      if (err) {
        return reject(err);
      }
      const info = getListData(data.text, infoTags)[0];

      resData[index] = {
        ...links[index],
        author: info[0].title,
        age: info[1].title,
        fans: info[2].title,
        follow: info[3].title
      };
      resolve()
    })
  }));

  await runLimit(getAuthorInfo, limit);

  console.log('///////////////////// 数据爬去完成 ////////////////////////');

  res.send(resData);
}