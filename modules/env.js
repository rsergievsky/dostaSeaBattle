
module.exports = {
  dosta: true,
  answerCD: 5,
  declOfNum: function (number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];
  },
  sleep: function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
