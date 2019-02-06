const env = require('../modules/env'),
    db = require('../modules/db'),
    game = require('../modules/game'),
    rp = require('request-promise'),
    fs = require('fs'),
    moment = require('moment');


module.exports = {
  callback: async function (req, res) {

    res.send('fae44205');

    const type = req.body.type;
    const e = req.body.object;
    const user_id = e.from_id;
    const group_id = req.body.group_id;

    if (type === 'wall_repost') {

      await game.onRepost(user_id);

    } else if (type === 'wall_reply_new' && user_id > 0) {

      const x = (e.text[0].match(/[а-иА-И]/ig) != null) ? e.text[0] : null;
      const y = e.text.replace(/\D+/ig, '');

      if (x != null && y > 0 && y <= 10) {
        await game.addPlayer(user_id);
        const move = await game.makeMove(group_id, user_id, x, y);
        if (move.attachments != null) {
          const answer = ``;
          await db.query(`INSERT INTO answers() VALUES()`);
        } else {
          const answer = ``;
          await db.query(`INSERT INTO answers() VALUES()`);
        }
      }
    }
  },
  reply: async function () {

  },

  getUserPic: async function (user_id) {

  },

  upload: async function (group_id, path) {
    await env.sleep(1000);
    /** group_id should be a negative number */
    const upload_res = JSON.parse(await rp.get(`https://api.vk.com/method/photos.getWallUploadServer?group_id=${-group_id}&access_token=${token}&v=5.92`));

    if (upload_res != null && upload_res.error != null) {
      console.log(`${upload_res.error.error_code} - ${upload_res.error.error_msg}`);
      throw new Error(upload_res.error.error_code);
    }

    const {response: {upload_url}} = upload_res;

    let formData = {
      file: {
        value: fs.createReadStream(path),
        options: {
          filename: 'response.png',
          contentType: 'image/png'
        }
      }
    };
    const photo_res = JSON.parse(await rp.post({url: upload_url, formData: formData}));
    /** group_id should be a negative number */
    const res = JSON.parse(await rp.get(`https://api.vk.com/method/photos.saveWallPhoto?group_id=${-group_id}&hash=${photo_res.hash}&server=${photo_res.server}&photo=${photo_res.photo}&access_token=${token}&v=5.92`));

    if (res != null && res.error != null) {
      console.log(`${res.error.error_code} - ${res.error.error_msg}`);
      throw new Error(res.error.error_msg);
    }

    const {response: [photo]} = res;
    return `photo${photo.owner_id}_${photo.id}`;
  }
}
