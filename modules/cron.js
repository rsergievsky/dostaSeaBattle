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
        await db.query(`UPDATE answers SET in_queue=1 WHERE id=${answer.id}`);
        const success = await vk.reply(answer);
        console.log(`${answer.id} - ${success}`);
        if (success === true) await db.query(`DELETE FROM answers WHERE id=${answer.id}`);
      }
    }, null, true);
  },
  off: async () => {
    answer.stop();
  }
};
