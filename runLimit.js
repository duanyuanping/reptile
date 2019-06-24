/** 
 * @param {Array} arr 待执行的任务数组，任务执行后返回一个 promise
 * @param {Number} limit 最大并行数 
 */
module.exports = (arr, limit) => {
  if (!Array.isArray(arr)) return Promise.all([]);

    const tasks = [...arr]; // 待执行的任务队列
    const result = []; // 任务执行完结果存放
    let parallelNum = 0; // 当前正在运行的任务数

    return new Promise((resolve, reject) => {
      const fn = () => {
        // 循环取出待执行任务队列中的任务
        setImmediate(() => {
          // 如果待执行任务队列为空，就返回所有运行结果
          if (tasks.length < 1) {
            return Promise
              .all(result)
              .then(data => resolve(data));
          }

          // 如果当前正在执行的任务数小于最大并行数并且待执行任务队列不为空，就取出待执行任务队列中的第一个任务执行
          while(parallelNum < limit && tasks.length > 0) {
            const task = tasks.shift();
            parallelNum++;
            result.push(
              // 任务函数执行会返回一个Promise实例
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