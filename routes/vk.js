const env = require('../modules/env'),
      db = require('../modules/db'),
      rp = require('request-promise'),
      fs = require('fs'),
      moment = require('moment'),
      gm = require('gm').subClass({imageMagick: true});


exports.callback = async function(req, res) {

  res.send('ok');

  const e = req.body.object;
  const group_id = req.body.group_id;

  console.log(`${group_id}\n${JSON.stringify(e)}`);

}
