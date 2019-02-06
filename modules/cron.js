const CronJob = require('cron').CronJob,
      cfg = require('../config/config.json'),
      env = require('./env'),
      db = require('./db'),
      rp = require('request-promise'),
      vk = require('./vk-api'),
      moment = require('moment');

let answer = null;

module.exports = {
  on: async function() {
    answer = new CronJob(`*/${env.answerCD} * * * * *`, async () => {
      /** answer queue */
      const [answer] = await db.query(`SELECT * FROM answers LIMIT 1`);
      if (answer) {
        const status = await vk.reply(answer);
        if (status) await db.query(`DELETE FROM answers WHERE id=${answer.id}`);
      }
    }, null, true);
  },
  off: async () => {
    answer.stop();
  }
};
