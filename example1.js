const Crawler = require('./assets/crawler');
const mainUrl = 'https://www.biquku.com/0/330/';

const fetchContent = async () => {
  const handleGetBaseInfo = () =>  {
    const infos = {};
    const c = new Crawler({
      maxConnections: 10,
      // callback: (err, res, done) => {
      //   if (err) {
      //     return console.log('//////////////////// fetch base info error /////////////////', err);
      //   }
    
      //   const $ = res.$;
      //   const urls = $('#list a');
  
      //   infos.title = $('#maininfo #info h1').text();
      //   infos.author = $('#maininfo #info p').eq(0).text().split('：')[1];
      //   infos.chapters = [];
  
      //   for (let i = 0; i < urls.length; i++) {
      //     infos.chapters.push({
      //       href: $(urls[i]).attr('href'),
      //       title: $(urls[i]).text()
      //     })
      //   }

      //   // resolve(infos);
      // }
    });
    
    return c.queue(mainUrl)
      .then(res => {
        const $ = res.$;
        const urls = $('#list a');

        infos.title = $('#maininfo #info h1').text();
        infos.author = $('#maininfo #info p').eq(0).text().split('：')[1];
        infos.chapters = [];

        for (let i = 0; i < urls.length; i++) {
          infos.chapters.push({
            href: $(urls[i]).attr('href'),
            title: $(urls[i]).text()
          })
        }

        return infos
      })
      .catch(err => console.log('//////////////////// fetch base info error /////////////////', err))
  };
  
  const baseInfo = await handleGetBaseInfo();
  // console.log(baseInfo)
  const handleGetContent = async info => {
    let content = null;
    const urls = info.map(item => `${mainUrl}${item.href}`);

    const c = new Crawler({
      maxConnections: 10,
      callback: (err, res, done) => {
        if (err) {
          return console.log('///////////////// fetch content err /////////////////', err); 
        }
  
        const $ = res.$;
        console.log($)
        const html = $('#content').html();
  
        content = {
          ...info,
          content: html
        }

        console.log(content)
      }
    })
  
    c.queue(urls);
  }
  
  handleGetContent(baseInfo.chapters.slice(0, 20))
}

fetchContent();
