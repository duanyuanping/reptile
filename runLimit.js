/** 
 * @param {Array} arg 待执行的任务数组，任务执行后返回一个 promise
 * @param {Number} limit 并行数 
 */
module.exports = (arg, limit) => {
  if (!Array.isArray(arg)) return [];

  const tasks = [...arg];
  const result = [];
  let runNum = 0;
  return new Promise((resolve, reject) => {
    const run = () => {
      setImmediate(() => {
        if (tasks.length > 0) {
          while(runNum < limit) {
            const task = tasks.shift();
            result.push(
              task(runNum + 1)
                .then(data => {
                  runNum--;
                  return data;
                })
                .catch(err => console.log('并发任务执行错误: ', err))
            );
            runNum++;
          }
          run();
        } else {
          Promise.all(result)
            .then(data => resolve(data));
        }
      });
    };
    run();
  })
}