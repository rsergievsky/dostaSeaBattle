const env = require('./env'),
      gm = require('gm').subClass({imageMagick: true});

module.exports = {
  addMoveToField: async function (x, y) {
    const block = (x == env.game.x && y == env.game.y) ? 'win' : 'miss';
    return new Promise(async (resolve, reject) => {
      console.time('pic');
      gm()
        .in('-page', '+0+0')
        .in(env.game.path)
        .in('-page', `+${446 + (70 * (x - 1))}+${56 + (70 * (y - 1))}`)
        .in(`public/fields/${block}.png`)
        .mosaic()
        .write(env.game.path, async (err) => {
          if (!err) return resolve();
          else {
            console.log(err);
            return reject(new Error('error while writing field pic'));
          }
        });
      console.timeEnd('pic');
    });
  }
}

