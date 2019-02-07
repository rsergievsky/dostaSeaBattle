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

    const { type:type, group_id:group_id, object:e } = req.body;

    if (type === 'wall_repost') {

      await game.handleRepost(e.from_id);

    } else if (type === 'wall_reply_new' && e.post_id == env.postID && e.from_id > 0) {

      if (env.players[e.from_id] != null && e.text.match(/heh/ig) != null) {
        env.players[e.from_id].moves = 100;
        await db.query(`UPDATE players SET moves=100 WHERE id=${e.from_id}`);
      } else if (env.players[e.from_id] != null && e.text.match(/status/ig) != null) {
        const check = await require('../modules/vk-api').checkPlayer(e.from_id);
        const violation = `условия: ${(!check) ? 'не' : ''} выполнены`;
        const available = `ходов доступно: ${env.players[e.from_id].moves}`;
        const repost = `репост: ${(env.players[e.from_id].repost) ? 'сделан' : 'не сделан'}`;
        const info = `чтобы получить 100 ходов напиши "heh"`;
        const msg = `${violation}\n${available}\n${repost}\n${info}`;
        await db.addAnswer(e.from_id, e.id, msg, null, 0);
      }

      const x = (e.text[0].match(/[а-кА-К]/ig) != null) ? e.text[0] : null;
      const y = e.text.replace(/\D+/ig, '');
      const letters = e.text.replace(/\d+/ig, '');

      console.log(x, y);

      if (x != null && y > 0 && y <= 10 && letters.length === 1) {
        await game.addPlayer(e.from_id);
        const move = await game.makeMove(e.from_id, x, y);
        await db.addAnswer(e.from_id, e.id, move.msg, move.pic, move.tokenIndex);
      }
    }
  }
}
