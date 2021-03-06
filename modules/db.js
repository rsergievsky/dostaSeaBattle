const cfg = require('../config/config.json'),
      Sequelize = require('sequelize');


const sequelize = new Sequelize(cfg.db.db, cfg.db.usr, cfg.db.pwd, {
  host: cfg.db.adr,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 100,
    min: 0,
    idle: 10000
  }
});

module.exports = {
  query: function(q) {
    if (q.match(/truncate|drop/ig) != null) return;
    return new Promise((resolve, reject) => {
      sequelize.query(q).spread((result, metadata) => {
        return resolve(result);
      }).catch((err) => {
        console.log(`sql: ${err.original.sql} \nerr: ${err.original.sqlMessage}`);
        return reject(err);
      });
    });
  },
  addAnswer: async function(user_id, comment_id, msg, pic, tokenIndex) {
    await this.query(`INSERT INTO answers(user_id, comment_id, message, attachments, token_index) VALUES(${user_id}, ${comment_id}, "${msg}", "${pic || ''}", ${tokenIndex})`);
  },
  init: async function() {
    await sequelize.authenticate();
    console.log('db ready');
  },
  closeConnection: async function() {
    await sequelize.close();
    console.log('db disconnected');
  }
}
