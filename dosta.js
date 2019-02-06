const express = require('express'),
      app = express(),
      cfg = require('./config/config.json'),
      middleware = require('./middleware')(app, express);
      db = require('./modules/db'),
      cron = require('./modules/cron'),
      env = require('./modules/env');

process.on('SIGINT', async () => {
  console.log('\nimmediate exit');
  await db.closeConnection();
  process.exit();
});

main = async() => {
  await db.init();
  app.listen(cfg.port, async () => {
    console.log(' *************************************************************** ');
    console.log(`Express server is up and listening on port ${cfg.port}`);
    // cron.on();
    const game = require('./modules/game');
    await game.startGame();
    await game.addPlayer(1);
    await game.makeMove(1, 'В', 4);
    await game.makeMove(1, 'З', 3);
    await game.makeMove(1, 'К', 10);
  });
}

main();