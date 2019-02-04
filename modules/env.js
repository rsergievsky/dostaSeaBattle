const db = require('../modules/db'),
      moment = require('moment'),
      fs = require('fs');

module.exports = {
  dosta: true,
  answerCD: 5,
  game: {id:0, path:'', x:0, y:0, moves:{}, win:0},
  players: {},
  addPlayer: async function(id) {
    if (players[id] != null) return;
    players[id] = {moves: 1, repost: 0};
    await db.query(`INSERT INTO players (id, moves, repost) VALUES(${id}, 1, 0);`);
  },
  onRepost: async function(id) {
    if (this.players[id] == null) {
      this.players[id] = {moves: 2, repost: 1};
      await db.query(`INSERT INTO players (id, moves, repost) VALUES(${id}, 2, 1);`);
    } else if (this.players[id].repost === 0) {
      players[id].moves++;
      players[id].repost = 1;
      await db.query(`UPDATE players SET moves=${players[id].moves}, repost=1 WHERE id=${id}`);
    }
  },
  startGame: async function() {
    const [game] = await db.query(`SELECT * FROM fields ORDER BY id DESC LIMIT 1`);
    game.moves = JSON.parse(game.moves);
    this.game = game;
    this.players = {};
    const players = await db.query(`SELECT * FROM players`);
    for (const player of players) {
      this.players[player.id] = {moves: player.moves, repost: player.repost};
    }
  },
  endGame: async function() {
    this.game.win = 1;
    await db.query(`UPDATE fields SET win=1 WHERE id=${this.game.id};`);
    await db.query(`UPDATE players SET moves=1 WHERE repost=0`);
    await db.query(`UPDATE players SET moves=2 WHERE repost=1`);
  },
  createField: async function() {
    const folder = `${process.env.PWD}/public/fields`;
    const path = `${folder}/field_${moment.now()}.jpg`;
    /**
     * todo
     * win x & y
     * */
    await fs.copyFileSync(`${folder}/main.jpg`, path)
    await db.query(`INSERT INTO fields (path, x, y, win, moves) VALUES("${path}", 0, 0, 0, "{}");`);
  },
  updateField: async function(x, y) {
    if (x == this.game.x && y == this.game.y) await this.endGame();
    if (this.game.moves[x] == null) this.game.moves[x] = [];
    this.game.moves[x].push(y);
    const moves = JSON.stringify(this.game.moves);
    await db.query(`UPDATE fields SET moves="${moves}", win=${this.game.win} WHERE id=${this.game.id}`);
    return (this.game.win) ? 'pizza.png' : 'x.png';

  },
  declOfNum: function (number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];
  },
  sleep: function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
