/**
 * @param {import("./types").PluginProps} props
 */
module.exports = ({ logger, config, battlefield, store }) => {
  /** @type {import("vu-rcon").Battlefield.MapEntry[]} */
  logger.info("Pingkicker active");
  let time = 120000
  if(config.timer >= 120000){
    time = config.timer
  }else{
    logger.warn("Timer was set lower than 120000. Used default 120000 to ensure the best work of the plugin")
  }
  let getPlayerInterval = setInterval(calculateMeridian, time);
  let passiv = true;
  let blacklist = [];
  let meridian = null;
  let multi = config.pingMulti;

  calculateMeridian();

  battlefield.on("playerLeave", (data) => {
    blacklist.forEach((el, index) => {
      if (el === data.player.name) {
        blacklist.splice(index, 1);
        if (passiv) {
          logger.info("Removed player " + data.player.name + ". Reason: Left");
        }
      }
    });
  });

  async function calculateMeridian() {
    let players = await battlefield.getPlayers();
    let sum = 0;
    let length = players.length;
    players.forEach((el) => {
      sum += el.ping;
    });
    meridian = parseInt(sum / length);
    meridian = meridian * multi;
    await kickPlayers(players);
  }

  async function kickPlayers(players) {
    blacklist.forEach((el, index) => {
      let player = players.find((player) => player.name === el);
      if (player != undefined) {
        if (player.ping > config.savePing && player.ping > meridian) {
          if (passiv) {
            logger.warn("Would kick player " + el);
            blacklist.splice(index, 1);
          } else {
            battlefield.playerKick(el, "High ping");
            logger.info("Kicked player: "+el)
          }
        } else {
          blacklist.splice(index, 1);
        }
      }
    });
    logger.info("--------------------------");
    players = await battlefield.getPlayers()
    players.forEach((el) => {
      if (el.ping > config.savePing && el.ping > meridian && !blacklist.includes(el.name)) {
        if (passiv) {
          logger.info("Added " + el.name + " to blacklist");
        }
        if(!passiv){
          battlefield.say("[PingEnforcer] Your ping is "+el.ping,["player",el.name])
          battlefield.say("[PingEnforcer] Fix ASAP or you will be removed!",["player",el.name])
        }

        blacklist.push(el.name);
      }
    });
  }
};
