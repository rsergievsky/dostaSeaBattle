const env = require('../modules/env'),
    db = require('../modules/db'),
    game = require('../modules/game'),
    rp = require('request-promise'),
    fs = require('fs'),
    cfg = require('../config/config'),
    moment = require('moment');


module.exports = {
  callback: async function (req, res) {

    res.send('ok');

    const { type:type, group_id:group_id, object:e } = req.body;

    console.log(e);
    return;

    if (type === 'wall_repost') {

      await game.handleRepost(e.from_id);

    } else if (type === 'wall_reply_new' && e.from_id > 0) {

      const x = (e.text[0].match(/[а-иА-И]/ig) != null) ? e.text[0] : null;
      const y = e.text.replace(/\D+/ig, '');

      console.log(x, y);

      if (x != null && y > 0 && y <= 10) {
        await game.addPlayer(e.from_id);
        const move = await game.makeMove(group_id, e.from_id, x, y);
        /** todo reply to comment id */
        await db.query(`INSERT INTO answers(user_id, comment_id, message, attachments, token_index) VALUES(${e.from_id}, ${e.id}, "${move.msg}", "${move.pic}", ${move.tokenIndex})`);
      }
    }
  },
  reply: async function (answer) {
    let captcha = '';
    try {
      const res = JSON.parse(await rp.get(`https://api.vk.com/method/wall.createComment?owner_id=${env.groupID}&post_id=${env.postID}&message=${encodeURIComponent(answer.message)}&from_group=${-env.groupID}&attachments=${pic}&reply_to_comment=${answer.comment_id}&access_token=${token}${captcha}&v=5.92`));

    } catch(err) {
      console.log(err);
    }
  },

  getUserName: async function (user_id) {

  },

  upload: async function (group_id, path) {

    const tokenIndex = env.getTokenIndex();
    const token = cfg.tokens.users[tokenIndex];

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
    return {tokenIndex:tokenIndex, pic:`photo${photo.owner_id}_${photo.id}`};
  }
}
