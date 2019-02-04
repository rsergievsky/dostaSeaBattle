const db = require('../modules/db');

module.exports = {
  dosta: true,
  answerCD: 5,
  currentField: {path:'', x:0, y:0},
  players: {},
  addPlayer: async function(id) {
    if (players[id] != null) return;
    players[id] = {availableMoves: 0};
  },
  resetPlayers: async function() {
    await db.query(`DELETE * FROM players`);
    this.palyers = {};
  },
  setGame: async function() {
    const game = await db.query(`SELECT path FROM currentField LIMIT 1 ORDRER BY DESC`);
    const players = await db.query(`SELECT * FROM players`);
    this.currentField.path = game.path;
    this.currentField.x = game.x;
    this.currentField.y = game.y;
    for (const player of players) {
      this.players[player.id] = {availableMoves: player.availableMoves};
    }
  },
  updateField: async function(path) {
    await db.query(`INSERT INTO currentField (path) VALUES("${path}");`);
    this.currentField = path;
  },
  declOfNum: function (number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];
  },
  sleep: function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
