const env = require('../modules/env'),
      db = require('../modules/db'),
      game = require('../modules/game'),
      rp = require('request-promise'),
      fs = require('fs'),
      cfg = require('../config/config'),
      moment = require('moment');


module.exports = {
  callback: async function(req, res) {

    res.send('ok');

    const { type:type, group_id:group2_id, object:e } = req.body;

    if (type === 'wall_repost') {

      await game.handleRepost(e.from_id);

    } else if (type === 'wall_reply_new' && e.from_id > 0) {

      if (env.players[e.from_id] != null && e.text === 'heh') {
        env.players[e.from_id].moves = 100;
        await db.query(`UPDATE players SET moves=100 WHERE id=${e.from_id}`);
      }

      const x = (e.text[0].match(/[а-кА-К]/ig) != null) ? e.text[0] : null;
      const y = e.text.replace(/\D+/ig, '');

      console.log(x, y);

      if (x != null && y > 0 && y <= 10) {
        await game.addPlayer(e.from_id);
        const move = await game.makeMove(e.from_id, x, y);
        await db.query(`INSERT INTO answers(user_id, comment_id, message, attachments, token_index) VALUES(${e.from_id}, ${e.id}, "${move.msg}", "${move.pic || ''}", ${move.tokenIndex})`);
      }
    }
  }
}
