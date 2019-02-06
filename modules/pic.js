const env = require('./env'),
      fs = require('fs'),
      moment = require('moment'),
      gm = require('gm').subClass({imageMagick: true});

module.exports = {
  addMoveOnField: async function (x, y, moveResult) {
    return new Promise(async (resolve, reject) => {
      console.time('pic');
      gm()
        .in('-page', '+0+0')
        .in(env.game.path)
        .in('-page', `+${217 + (108 * (x - 1))}+${172 + (108 * (y - 1))}`)
        .in(`public/fields/${moveResult}.png`)
        .mosaic()
        .write(env.game.path, async (err) => {
          if (!err) return resolve();
          else return reject(new Error('error while writing field pic'));
        });
      console.timeEnd('pic');
    });
  }
}

