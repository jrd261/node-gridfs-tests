'use strict';

const config = {
  mongo: {
    url: 'mongodb://localhost:27018/gridfstest',
    options: { }
  },
  source: '/mnt/ramdisk/100KB',
  throttle: { rate: 50000 },
  total: 10000
};

const fs = require('fs');
const mongodb = require('mongodb');
const throttle = require('stream-throttle');

mongodb.MongoClient.connect(config.mongo.url, config.mongo.options).then(database => {

  const gridfs = new mongodb.GridFSBucket(database);
  const start = Date.now();

  let completed = 0; let dispatched = 0;

  function monitor () {
    console.log(`Pending ${ dispatched - completed } | Completed ${ completed } | Time ${ Date.now() - start }`);
    if (completed < config.total) setTimeout(monitor, 1000);
    else return database.close();
  }

  function execute () {
    fs.createReadStream(config.source)
      .pipe(new throttle.Throttle(config.throttle))
      .pipe(gridfs.openUploadStream(Math.random().toString()))
      .once('finish', () => completed++);
    dispatched++;
    if (dispatched < config.total) setImmediate(execute);
  }

  monitor();
  execute();

});
