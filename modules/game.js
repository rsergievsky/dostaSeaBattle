const env = require('./env'),
      db = require('./db'),
      pic = require('./pic'),
      fs = require('fs'),
      moment = require('moment'),
      gm = require('gm').subClass({imageMagick: true});

const xMoves = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К'];

module.exports = {
  makeMove: async function(id, x, y) {

    // x = x.toUpperCase().charCodeAt(0) - 1039;
    x = xMoves.indexOf(x) + 1;

    if (env.game.win) await this.startGame();

    if (env.players[id].moves === 0) {
      /** reply that player has no moves */
      console.log(env.answers.no_enough_moves);
      const tokenIndex = env.getTokenIndex();
      return {msg:env.answers.no_enough_moves, tokenIndex:tokenIndex};
    } else if (env.game.moves != null && env.game.moves[x] != null && env.game.moves[x].includes(y)) {
      /** reply that move already exist */
      console.log(env.answers.busy);
      const tokenIndex = env.getTokenIndex();
      return {msg:env.answers.busy, tokenIndex:tokenIndex};
    } else {

      let moveResult = 'miss';

      env.players[id].moves--;
      await db.query(`UPDATE players SET moves=moves-1 WHERE id=${id}`);

      if (x == env.game.x && y == env.game.y) {
        moveResult = 'win';
        await this.endGame();
      }
      if (env.game.moves == null || env.game.moves[x] == null) env.game.moves[x] = [];
      env.game.moves[x].push(y);
      const moves = JSON.stringify(env.game.moves).replace(/"/g, '\\"');
      await db.query(`UPDATE games SET moves="${moves}", win=${env.game.win} WHERE id=${env.game.id}`);

      await pic.addMoveOnField(x, y, moveResult);
      return {msg: env.answers[moveResult]};
    }
  },
  addPlayer: async function(id) {
    if (env.players[id] != null) return;
    env.players[id] = {moves: 1, repost: 0};
    try {
      await db.query(`INSERT INTO players (id, moves, repost) VALUES(${id}, 1, 0);`);
      return;
    } catch(err) { console.log(err); }
  },
  handleRepost: async function(id) {
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
    if (game == null || game.win) {
      await this.createField();
      return this.startGame();
    }
    env.game = game;
    env.game.moves = JSON.parse(game.moves);
    env.players = {};
    const players = await db.query(`SELECT * FROM players`);
    for (const player of players) {
      env.players[player.id] = {moves: player.moves, repost: player.repost};
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
    const x = Math.floor(Math.random() * 10) + 1;
    const y = Math.floor(Math.random() * 10) + 1;
    env.game.path = path;
    await fs.copyFileSync(`${folder}/main.jpg`, path)
    await db.query(`INSERT INTO games (path, x, y, win, moves) VALUES("${path}", ${x}, ${y}, 0, "{}");`);
  },
}

