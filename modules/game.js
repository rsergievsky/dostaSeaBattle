const env = require('./env'),
      db = require('./db'),
      pic = require('./pic'),
      vk = require('./vk-api'),
      fs = require('fs'),
      moment = require('moment');

const xMoves = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К'];

module.exports = {
  makeMove: async function(e, x, y) {

    const id = e.from_id;

    x = xMoves.indexOf(x.toUpperCase()) + 1;

    if (env.game.win) await this.startGame();

    const tokenIndex = env.getTokenIndex();

    const check = await vk.checkPlayer(id);
    // if (!check.isReposted && env.players[id].repost) {
    //   env.players[id].repost = 0;
    //   if (env.players[id].moves > 1) env.players[id].moves--;
    //   await db.query(`UPDATE players SET moves=${env.players[id].moves}, repost=0 WHERE id=${id}`);
    // }

    if (!check.isMember || !check.isLiked) {
      return {msg:env.getAnswer.violation(id), tokenIndex:tokenIndex};
    } else if (env.players[id].moves === 0) {
      return {msg:env.getAnswer.no_enough_moves(id), tokenIndex:tokenIndex};
    } else if (env.game.moves != null && env.game.moves[x] != null && env.game.moves[x].includes(y)) {
      return {msg:env.getAnswer.busy(id), tokenIndex:tokenIndex};
    } else {

      const moveResult = this.checkMove(e, x, y);

      env.players[id].moves--;
      await db.query(`UPDATE players SET moves=moves-1 WHERE id=${id}`);

      if (env.game.moves == null || env.game.moves[x] == null) env.game.moves[x] = [];
      env.game.moves[x].push(y);
      const moves = JSON.stringify(env.game.moves).replace(/"/g, '\\"');
      await db.query(`UPDATE games SET moves="${moves}", win=${env.game.win} WHERE id=${env.game.id}`);

      await pic.addMoveToField(x, y);
      const {data, index} = await vk.upload(env.game.path);

      await vk.updatePost(data, index, false);

      return {msg: moveResult, tokenIndex: tokenIndex, pic: data};
    }
  },
  checkMove: function(e, x, y) {
    if (x == env.game.x && y == env.game.y) {
      this.endGame(e);
      return env.getAnswer.win(e.from_id);
    } else return env.getAnswer.miss(e.from_id);
  },
  addPlayer: async function(id) {
    if (env.players[id] != null) return;
    try {
      const name = await vk.getUserName(id);
      env.players[id] = {name: name, moves: 1, repost: 0};
      await db.query(`INSERT INTO players (id, moves, repost, reposted, \`name\`) VALUES(${id}, 1, 0, 0, "${name}");`);
    } catch(err) { console.log(err); }
  },
  handleRepost: async function(id) {
    if (env.players[id] == null) {
      const name = await vk.getUserName(id);
      env.players[id] = {name: name, moves: 2, repost: 1};
      await db.query(`INSERT INTO players (id, moves, repost, reposted, name) VALUES(${id}, 2, 1, 1, "${name}");`);
    } else if (env.players[id].repost == 0) {
      if (!env.players[id].reposted) env.players[id].moves++;
      env.players[id].repost = 1;
      env.players[id].reposted = 1;
      await db.query(`UPDATE players SET moves=${env.players[id].moves}, repost=1, reposted=1 WHERE id=${id}`);
    }
  },
  startGame: async function() {
    const [row] = await db.query(`SELECT * FROM winners ORDER BY id DESC LIMIT 1`);
    env.lastWinner = (row && row.comment) ? row.comment : '-';
    const [{count}] = await db.query(`SELECT COUNT(*) as count FROM games WHERE win=1`);
    if (count > 49) await vk.updatePost(null, env.getTokenIndex(), true);
    else {
      env.pizzasLeft = 50 - count;
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
        env.players[player.id] = {name: player.name, moves: player.moves, repost: player.repost, reposted: player.reposted};
      }
    }
  },
  endGame: async function(e) {
    env.game.win = 1;
    await db.query(`UPDATE games SET win=1 WHERE id=${env.game.id};`);
    await db.query(`UPDATE players SET moves=1 WHERE repost=0`);
    await db.query(`UPDATE players SET moves=2 WHERE repost=1`);
    await db.query(`INSERT INTO winners (user_id, user_link, comment) VALUES(${e.from_id}, "https://vk.com/id${e.from_id}", "https://vk.com/wall${e.owner_id}_${e.id}")`);
    await vk.restartAlert();
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

