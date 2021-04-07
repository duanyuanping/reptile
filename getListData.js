const fs = require('fs');
const cheerio = require('cheerio');

module.exports = async html => {
  const $ = cheerio.load(html);
  const result = [];
  await $('div#post_list article.post-item').each(async (index, item) => {
    // console.log(item)
    const TDom = $(item).find('a.post-item-title'); // 获取博文列表标题元素
    const ADom = $(item).find('a.post-item-author'); // 获取博文列表作者元素

    // 读取元素中的信息
    const info = {
      title: TDom.text(),
      blogUrl: TDom.attr('href'),
      author: ADom.text(),
      personalHomePage: ADom.attr('href')
    };
    result.push(info);
    await fs.appendFile('result.json', `${JSON.stringify(info)},\n`, () => {});
  });

  return result;
}