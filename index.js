/**
 * @param {import("./types").PluginProps} props
 */
module.exports = ({ logger, config, battlefield, store }) => {
  /** @type {import("vu-rcon").Battlefield.MapEntry[]} */
  let time = 60000
  if(config.timer >= 60){
    time = config.timer*1000
  }else{
    logger.warn("Timer cannot be set lower than 60 seconds, 60 seconds will be used.")
  }
  let getPlayerInterval = setInterval(calculateMeridian, time);
  let passiv = config.PassiveMode;
  let blacklist = [];
  let meridian = null;
  let multi = config.pingMulti;

  calculateMeridian();

  battlefield.on("playerLeave", (data) => {
    blacklist.forEach((el, index) => {
      if (el === data.player.name) {
        blacklist.splice(index, 1);
        if (passiv) {
          //logger.info("Removed player " + data.player.name + ". Reason: Left game");
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
    if(passiv){
      //logger.info("Server ping average: "+meridian)
    }
    meridian = meridian * multi;
    if(passiv){
      //logger.info("Calculated maximum ping: "+meridian)
    }
    await kickPlayers(players);
  }

  async function kickPlayers(players) {
    blacklist.forEach((el, index) => {
      let player = players.find((player) => player.name === el);
      if (player != undefined) {
        if (player.ping > config.savePing && player.ping > meridian) {
          if (passiv) {
            logger.info("Would kick player " + el + " for ping " + player.ping + "ms");
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
    //logger.info("--------------------------");
    players = await battlefield.getPlayers()
    players.forEach((el) => {
      if (el.ping > config.savePing && el.ping > meridian && !blacklist.includes(el.name)) {
        if (passiv) {
          //logger.info("Added " + el.name + " to blacklist");
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
