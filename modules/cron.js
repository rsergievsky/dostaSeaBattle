const CronJob = require('cron').CronJob,
      cfg = require('../config/config.json'),
      env = require('./env'),
      db = require('./db'),
      rp = require('request-promise'),
      moment = require('moment');

let answer = null;

module.exports = {
  on: async function() {
    answer = new CronJob(`*/${env.answerCD} * * * * *`, async () => {
      /** answer queue */
    }, null, true);
  },
  off: async () => {
    answer.stop();
  }
};
