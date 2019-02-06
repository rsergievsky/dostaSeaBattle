const env = require('./env'),
      db = require('./db'),
      rp = require('request-promise'),
      vk = require('../routes/vk'),
      fs = require('fs'),
      moment = require('moment'),
      gm = require('gm').subClass({imageMagick: true});

module.exports = {
  makeMove: async function(gid, id, x, y) {
    x = x.toUpperCase().charCodeAt(0) - 1039;
    /** if env.game.win => startGame */
    if (env.game.win) await this.startGame();
    if (env.players[id].moves === 0) {
      return {msg:env.answers.no_enough_moves};
      /** reply that player has no moves */
    } else if (env.game.moves != null && env.game.moves[x] != null && env.game.moves[x].includes(y)) {
      return {msg:env.answers.busy};
      /** reply that move already exist */
    } else {

      let moveResult = 'miss';

      env.players[id].moves--;

      if (x == env.game.x && y == env.game.y) {
        moveResult = 'win';
        await this.endGame();
      }
      if (env.game.moves == null || env.game.moves[x] == null) env.game.moves[x] = [];
      env.game.moves[x].push(y);
      const moves = JSON.stringify(env.game.moves).replace(/"/g, '\\"');
      await db.query(`UPDATE games SET moves="${moves}", win=${env.game.win} WHERE id=${env.game.id}`);

      return new Promise(async (resolve, reject) => {
        console.time('pic');
        gm()
            .in('-page', '+0+0')
            .in(env.game.path)
            .in('-page', `+${217+(108*(x - 1))}+${172+(108*(y - 1))}`)
            .in(`public/fields/${moveResult}.png`)
            .mosaic()
            .write(env.game.path, async (err) => {
              if (!err) {
                const pic = await vk.upload(gid, env.game.path);
                return resolve({
                  user_id:user_id,
                  msg:env.answers[moveResult],
                  attachments:pic
                });
              }
              else return reject(new Error('error while writing field pic'));
            });
        console.timeEnd('pic');
      });
      // await this.createField();
      // await this.startGame();
    }
  },
  addPlayer: async function(id) {
    if (env.players[id] != null) return;
    env.players[id] = {moves: 1, repost: 0};
    await db.query(`INSERT INTO players (id, moves, repost) VALUES(${id}, 1, 0);`);
  },
  onRepost: async function(id) {
    if (env.players[id] == null) {
      env.players[id] = {moves: 2, repost: 1};
      await db.query(`INSERT INTO players (id, moves, repost) VALUES(${id}, 2, 1);`);
    } else if (env.players[id].repost === 0) {
      env.players[id].moves++;
      env.players[id].repost = 1;
      await db.query(`UPDATE players SET moves=${env.players[id].moves}, repost=1 WHERE id=${id}`);
    }
  },
  startGame: async function() {
    const [game] = await db.query(`SELECT * FROM games ORDER BY id DESC LIMIT 1`);
    env.game = JSON.parse(game);
    // game.moves = JSON.parse('{"x":3,"y":2,"path":"public/fields/field_1549394706614.jpg","moves":{},"win":0}');
    // env.game = game;
    env.players = {};
    const players = await db.query(`SELECT * FROM players`);
    for (const player of players) {
      // env.players[player.id] = {moves: player.moves, repost: player.repost};
    }
  },
  endGame: async function() {
    env.game.win = 1;
    await db.query(`UPDATE games SET win=1 WHERE id=${env.game.id};`);
    await db.query(`UPDATE players SET moves=1 WHERE repost=0`);
    await db.query(`UPDATE players SET moves=2 WHERE repost=1`);
  },
  createField: async function() {
    const folder = `${process.env.PWD}/public/fields`;
    const path = `${folder}/field_${moment.now()}.jpg`;
    env.game.path = path;
    /**
     * todo
     * win x & y
     * */
    await fs.copyFileSync(`${folder}/main.jpg`, path)
    await db.query(`INSERT INTO games (path, x, y, win, moves) VALUES("${path}", 0, 0, 0, "{}");`);
  },
}

