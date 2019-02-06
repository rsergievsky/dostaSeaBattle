const db = require('../modules/db'),
      moment = require('moment'),
      fs = require('fs');

module.exports = {
  dosta: true,
  groupID: 160258026,
  postID: 1283,
  answerCD: 5,
  tokenIndex: -1,
  busyTokens: [],
  game: {id:0, path:'', x:0, y:0, moves:{}, win:0},
  players: {},
  answers: {
    violation: 'не выполнены условия',
    miss: 'промах',
    busy: 'уже попали',
    no_enough_moves: 'нет ходов',
    win: 'победа епта',
    restart: 'игра окончена. начинаем новый раунд'
  },
  catpchas: [],
  getTokenIndex: function() {
    this.tokenIndex++;
    if (this.tokenIndex > 0) this.tokenIndex = 0;
    return this.tokenIndex;
  },
  declOfNum: function (number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];
  },
  sleep: function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
