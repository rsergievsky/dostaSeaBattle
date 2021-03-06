const env = require('./env'),
      db = require('./db'),
      anticaptcha = require('./anticaptcha'),
      rp = require('request-promise'),
      fs = require('fs'),
      cfg = require('../config/config');

module.exports = {

  reply: async function(answer) {
    const token = cfg.tokens.users[answer.token_index];
    const captcha = answer.captcha || '';
    try {

      await db.query(`DELETE FROM answers WHERE id=${answer.id}`);

      if (env.busyTokens.includes(answer.token_index)) await env.sleep(10000);

      const res = JSON.parse(await rp.get(`https://api.vk.com/method/wall.createComment?owner_id=${-env.groupID}&post_id=${env.postID}&message=${encodeURIComponent(answer.message)}&from_group=${env.groupID}&attachments=${answer.attachments}&reply_to_comment=${answer.comment_id}&access_token=${token}${captcha}&v=5.92`));
      if (res.error == null || res.error.error_code == '100') {
        delete env.busyTokens[answer.token_index];
        return true;
      }
      else if (res.error.error_code == '14') {
        console.log(`[${answer.token_index}] captcha blyad!`);
        env.busyTokens[answer.token_index] = answer.token_index;
        answer.captcha = await anticaptcha.solveCaptcha(res.error);
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
  updatePost: async function(attachments, index, gameOver, captcha) {
    if (env.busyTokens.includes(index)) await env.sleep(10000);
    const token = cfg.tokens.users[index];
    try {
      const req = (!gameOver)
        ? `https://api.vk.com/method/wall.edit?owner_id=${-env.groupID}&post_id=${env.postID}&message=${encodeURIComponent(env.postText())}&attachments=${attachments}&access_token=${token}&captcha=${captcha || ''}&v=5.92`
        : `https://api.vk.com/method/wall.edit?owner_id=${-env.groupID}&post_id=${env.postID}&message=${encodeURIComponent(env.gameOverText)}&close_comments=1&access_token=${token}&captcha=${captcha || ''}&v=5.92`;
      const res = JSON.parse(await rp.get(req));
      if (gameOver) await rp.get(`https://api.vk.com/method/wall.createComment?owner_id=${-env.groupID}&post_id=${env.postID}&message=${encodeURIComponent(env.gameOverText)}&from_group=${env.groupID}&access_token=${cfg.tokens.users[0]}&v=5.92`);
      if (res.error == null || res.error.error_code == '100') return true;
      else if (res.error.error_code == '14') {
        env.busyTokens[index] = index;
        const captchaRes = await anticaptcha.solveCaptcha(res.error);
        delete env.busyTokens[index];
        return this.updatePost(attachments, index, gameOver, captchaRes);
      } else {
        console.log(res.error.error_msg);
        return false;
      }
    } catch(err) {
      console.log(err.message);
      return false;
    }
  },
  restartAlert: async function() {
    const res = JSON.parse(await rp.get(`https://api.vk.com/method/wall.createComment?owner_id=${-env.groupID}&post_id=${env.postID}&message=${encodeURIComponent(env.getAnswer.restart)}&from_group=${env.groupID}&access_token=${cfg.tokens.users[0]}&v=5.92`));
  },
  checkPlayer: async function(user_id) {
    const {response:isMember} = JSON.parse(await rp.get(`https://api.vk.com/method/groups.isMember?group_id=${env.groupID}&user_id=${user_id}&access_token=${cfg.tokens.group}&v=5.92`));
    let likedList = [];
    getLikes: for (let i = 0; i < 10; i++) {
      const {response} = JSON.parse(await rp.get(`https://api.vk.com/method/likes.getList?type=post&owner_id=${-env.groupID}&item_id=${env.postID}&count=1000&offset=${i*1000}&access_token=${cfg.tokens.users[env.tokenIndex]}&v=5.92`));
      if (response.items == null || response.items.length === 0) break getLikes;
      likedList = [...likedList, ...response.items];
      if (response.items.length < 1000) break getLikes;
    }
    const isLiked = likedList.includes(user_id);

    // let repostedList = [];
    // getReposts: for (let i = 0; i < 15; i++) {
    //   const {response} = JSON.parse(await rp.get(`https://api.vk.com/method/wall.getReposts?&owner_id=${-env.groupID}&post_id=${env.postID}&count=1000&offset=${i*1000}&access_token=${cfg.tokens.users[env.tokenIndex]}&v=5.92`));
    //   if (response.profiles == null || response.profiles.length === 0) break getReposts;
    //   for (const profile of response.profiles) {
    //     repostedList.push(profile.id);
    //   }
    //   if (response.items.length < 1000) break getReposts;
    // }
    //
    // const isReposted = repostedList.includes(user_id);

    // return !!(isMember && isLiked);
    return {isMember: isMember, isLiked: isLiked}; //  isReposted: isReposted
  },
  getUserName: async function(user_id) {
    try {
      const {response} = JSON.parse(await rp.get(`https://api.vk.com/method/users.get?user_ids=${user_id}&access_token=${cfg.tokens.group}&v=5.92`));
      if (!response.error) return `${response[0].first_name} ${response[0].last_name}`;
      else throw new Error(response.error.error_msg);
    } catch(err) {
      throw new Error(err.message);
    }
  },
  upload: async function(path) {

    const index = env.tokenIndex;
    const token = cfg.tokens.users[index];

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
    return {data: `photo${photo.owner_id}_${photo.id}`, index: index};
  }
}
