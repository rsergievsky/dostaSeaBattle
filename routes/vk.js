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

    const { type:type, object:e } = req.body;

    if (e.from_id == '247790') return;

    if (type === 'wall_repost' && e.copy_history[0].id == env.postID) {

      await game.handleRepost(e.from_id);

    } else if (type === 'wall_reply_new' && e.post_id == env.postID && e.from_id > 0) {

      if (env.players[e.from_id] != null && e.text.match(/heh/ig) != null) {
        env.players[e.from_id].moves = 100;
        await db.query(`UPDATE players SET moves=100 WHERE id=${e.from_id}`);
      }

      const x = (e.text[0].match(/[а-кА-К]/ig) != null) ? e.text[0] : null;
      const y = e.text.replace(/\D+/ig, '');
      const letters = e.text.replace(/[\-]|[\d+]/ig, '');

      if (x != null && y > 0 && y <= 10 && letters.length === 1) {

        console.log(e.from_id, e.post_id, x, y);

        await game.addPlayer(e.from_id);
        const move = await game.makeMove(e, x, y);
        await db.addAnswer(e.from_id, e.id, move.msg, move.pic, move.tokenIndex);
      }
    }
  }
}
