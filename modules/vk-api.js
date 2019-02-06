const env = require('./env'),
      db = require('./db'),
      anticaptcha = require('./anticaptcha'),
      rp = require('request-promise'),
      fs = require('fs'),
      cfg = require('../config/config'),
      moment = require('moment');

module.exports = {

  /**
  { error_code: 14,
    error_msg: 'Captcha needed',
    request_params:
     [ [Object],
       [Object],
       [Object],
       [Object],
       [Object],
       [Object],
       [Object],
       [Object],
       [Object] ],
    captcha_sid: '773031105242',
    captcha_img: 'https://api.vk.com/captcha.php?sid=773031105242&s=1' } }

   */

  reply: async function(answer) {
    if (env.busyTokens.includes(answer.token_index)) await env.sleep(15000);
    const token = cfg.tokens.users[answer.token_index];
    const captcha = answer.captcha || '';
    try {
      const res = JSON.parse(await rp.get(`https://api.vk.com/method/wall.createComment?owner_id=${-env.groupID}&post_id=${env.postID}&message=${encodeURIComponent(answer.message)}&from_group=${env.groupID}&attachments=${answer.attachments}&reply_to_comment=${answer.comment_id}&access_token=${token}${captcha}&v=5.92`));
      if (res.error == null || res.error.error_code == '100') return true;
      else if (res.error.error_code == '14') {
        console.log(`[${answer.token_index}] captcha blyad!`);
        env.busyTokens[answer.token_index] = answer.token_index;
        answer.captcha = await anticaptcha.solveCaptcha(res.error);
        delete env.busyTokens[answer.token_index];
        return this.reply(answer);
      } else {
        console.log(res.error.error_msg);
        return false;
      }
    } catch(err) {
      console.log(err.message);
      return false;
    }
  },
  checkPlayer: async function(user_id) {
    /** todo is member */
    /** todo is like */
    const isMember = await rp.get(`https://api.vk.com/method/groups.isMember?group_id=${env.groupID}&user_id=${user_id}&access_token=${cfg.tokens.group}&v=5.92`);
    console.log(isMember);
    const isLiked = await rp.get(`https://api.vk.com/method/groups.isMember?group_id=${env.groupID}&user_id=${user_id}&access_token=${cfg.tokens.group}&v=5.92`);
  },
  getUserName: async function(user_id) {
    console.log('no');
  },
  upload: async function(path) {

    const tokenIndex = env.getTokenIndex();
    const token = cfg.tokens.users[tokenIndex];

    await env.sleep(1000);
    /** group_id should be a positive number */
    const upload_res = JSON.parse(await rp.get(`https://api.vk.com/method/photos.getWallUploadServer?group_id=${env.groupID}&access_token=${token}&v=5.92`));

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
    /** group_id should be a positive number */
    const res = JSON.parse(await rp.get(`https://api.vk.com/method/photos.saveWallPhoto?group_id=${env.groupID}&hash=${photo_res.hash}&server=${photo_res.server}&photo=${photo_res.photo}&access_token=${token}&v=5.92`));

    if (res != null && res.error != null) {
      console.log(`${res.error.error_code} - ${res.error.error_msg}`);
      throw new Error(res.error.error_msg);
    }

    const {response: [photo]} = res;
    return {tokenIndex:tokenIndex, pic:`photo${photo.owner_id}_${photo.id}`};
  }
}
