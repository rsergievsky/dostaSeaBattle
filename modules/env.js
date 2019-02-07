const db = require('../modules/db'),
      moment = require('moment'),
      fs = require('fs');

module.exports = {
  dosta: true,
  groupID: 160258026,
  postID: 1878,
  answerCD: 5,
  tokenIndex: -1,
  busyTokens: [],
  catpchas: [],
  game: {id:0, path:'', x:0, y:0, moves:{}, win:0},
  prizesLeft: 0,
  players: {},
  getAnswer: {
    violation: (id) => {
      return `${module.exports.players[id].name}, у нас было условие — подписаться на сообщество и поставить лайк.`;
    },
    miss: (id) => {
      const repost = (module.exports.players[id].repost) ? `` : `Можешь сделать репост и получишь дополнительный ход в этом раунде, и в каждом следующем у тебя будет 2 хода!`;
      return `${module.exports.players[id].name}, мимо!\n${repost}`
    },
    busy: function (id) {
      console.log(this);
      const move = module.exports.players[id].moves;
      const movesLeft = `${move} ${module.exports.declOfNum(move, ['ход', 'хода', 'ходов'])}`;
      return `${module.exports.players[id].name}, в эту клетку уже попали! Попробуй ещё раз, у тебя есть ещё ${movesLeft}`;
    },
    no_enough_moves: (id) => {
      const repost = (module.exports.players[id].repost) ? `` : `Но ты можешь сделать репост и получишь дополнительный ход в этом раунде, и в каждом следующем у тебя будет 2 хода!`;
      return `${module.exports.players[id].name}, у тебя не осталось ходов. :c\n${repost}`;
    },
    win: (id) => {
      return `${module.exports.players[id].name}, точно в цель. Забирай свою пиццу! 🍕`;
    },
    restart: `Раунд закончился! Начинаем новый :)`
  },
  postText: 'Ура! Празднуем день пиццы уже сегодня.\n' +
      'Начинаем Пицца Бой! Разыгрываем 50 пицц. \n' +
      'Чтобы принять участие в игре достаточно: \n' +
      '• Поставить лайк конкурсному посту. \n' +
      '• Быть подписанным на наше сообщество.\n' +
      '• Оставить под конкурсной записью комментарий в формате «БукваЧисло», например А7. \n' +
      'Каждый игрок имеет в рамках одного раунда только одну попытку \n' +
      'Можешь сделать ещё 1 ход в раунде, если поделишься записью с друзьями. \n' +
      'Раунд заканчивается, когда игрок попадает в ячейку с пиццей, игра начинается заново. В игре 50 раундов. Полные условия по ссылке',
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
