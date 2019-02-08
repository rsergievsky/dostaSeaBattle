const express = require('express'),
      app = express(),
      cfg = require('./config/config.json'),
      middleware = require('./middleware')(app, express);
      db = require('./modules/db'),
      cron = require('./modules/cron'),
      env = require('./modules/env'),
      game = require('./modules/game');

process.on('SIGINT', async () => {
  console.log('\nimmediate exit');
  wait: for (let i = 0; i < 200; i++) {
    if (env.picRender === 1) await env.sleep(10);
    else break wait;
  }
  await db.closeConnection();
  process.exit();
});

main = async() => {
  await db.init();
  app.listen(cfg.port, async () => {
    console.log(' *************************************************************** ');
    console.log(`Express server is up and listening on port ${cfg.port}`);
    cron.on();
    await game.startGame();
  });
}

main();
