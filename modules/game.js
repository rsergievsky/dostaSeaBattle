const env = require('../modules/env'),
      db = require('../modules/db'),
      rp = require('request-promise'),
      fs = require('fs'),
      moment = require('moment'),
      gm = require('gm').subClass({imageMagick: true});


exports.makeMove = async function(user_id, x, y) {
  if (env.game.moves[x].includes(y)) {
    /** reply that move already exist */
  } else {
    const block = await env.updateField(x, y);
    /**
     * gm add move on field
     * form reply
     * notify players about game restarting
     * restart game
     * */
    await env.createField();
    await env.startGame();
  }
}

