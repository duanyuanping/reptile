const cheerio = require('cheerio');

module.exports = (text, tags) => {
  const $ = cheerio.load(text);

  return tags.map(tag => {
    const data = [];
    $(tag).each((index, dom) => {
      const info = {
        title: $(dom).text(),
        href: $(dom).attr('href')
      };
      data.push(info);
    });
    return data;
  });
}