const vk = require('./vk');

module.exports = async function (app) {

  app.post('/callback', vk.callback);

  /** app.get('/board', board.render); */

};
