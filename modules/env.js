const db = require('../modules/db'),
      moment = require('moment'),
      fs = require('fs');

module.exports = {
  dosta: true,
  answerCD: 5,
  answers: {
    miss: 'answer for miss',
    busy: 'answer for busy',
    no_enough_moves: 'answer for no enough moves',
    win: 'answer for win'
  },
  game: {id:0, path:'', x:0, y:0, moves:{}, win:0},
  players: {},
  declOfNum: function (number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];
  },
  sleep: function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
