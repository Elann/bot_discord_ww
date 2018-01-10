var Discord = require('discord.io');
var logger = require('winston');
//var auth = require('./auth.json');

var schedule = require('node-schedule');

// Si problème pour lancer le serveur, essayer :
// npm install woor/discord.io#gateway_v6


// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
const bot = new Discord.Client({
   token: process.env.TOKEN, //auth.token,
   autorun: true
});

//bot.login(process.env.TOKEN);

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

var list_ww = [];

bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var command = args[0];
       
        switch(command) {
            // !ww heure_deb nbr_minutes
            case 'ww':
                //Enought arguments
                if (args.length >= 3) {
                    var deb_hour = args[1].split(/[a-z]|:/);
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: 'Veuillez indiquer votre Word War au format (les arguments entre crochets sont optionnels) ```!ww heureDeDépart NombreDeMinutes [NomDeLaWW]```'
                    });
                    break
                }
             
                //Get hour and minutes and duration of the WW
                var hour = parseInt(deb_hour[0]);
                if (deb_hour[1] !== "") {
                    var minutes = parseInt(deb_hour[1]);
                }
                else {
                    var minutes = 00;
                }
                var nbr_minutes_ww = parseInt(args[2]);
                //Get name
                var name_ww = "";
                if (args.length == 4) {
                    name_ww = args[3];
                }
                else {
                    name_ww = args[1]+args[2];
                }
                
                //Hour and minutes are between 0-24 and 0-59
                if (hour >= 0 && hour < 25 && minutes >=0 && minutes < 60) {
                
                    var heure_deb_ww = new Date();
                    heure_deb_ww.setHours(hour, minutes, 0);
                    var heure_fin_ww = new Date(heure_deb_ww);
                    heure_fin_ww.setMinutes(heure_deb_ww.getMinutes() + nbr_minutes_ww);
                    
                    var deb_hour = heure_deb_ww.getHours();
                    var fin_hour = heure_fin_ww.getHours();
                    var deb_min = heure_deb_ww.getMinutes();
                    var fin_min = heure_fin_ww.getMinutes();
                    if (deb_min < 10) {
                        deb_min = '0'+ deb_min;
                    }
                    if (fin_min < 10) {
                        fin_min = '0'+ fin_min;
                    }
                    
                    //if the ww is too late for today, it is for tomorrow
                    if (heure_deb_ww < Date.now()) {
                        heure_deb_ww.setDate(heure_deb_ww.getDate()+1);
                        heure_fin_ww.setDate(heure_fin_ww.getDate()+1);
                    }
                    
                    //Add WW to list
                    list_ww.push([name_ww,heure_deb_ww,heure_fin_ww]);
                    
                    //Message acceptation of the WW
                    bot.sendMessage({
                        to: channelID,
                        message: 'Ok, WW ' + name_ww + ' à ' + deb_hour + 'h' + deb_min + ' pour ' + args[2] + ' minutes ! Fin à ' + fin_hour + 'h' + fin_min + ' !'
                    });
                    
                    console.log(list_ww);
                    
                    //Schedule the beginning of the WW
                    schedule.scheduleJob('WW', heure_deb_ww, function(params)
                    {
                      //Message beginning of the WW
                      bot.sendMessage({
                            to: channelID,
                            message: 'Début de la WW de ' + deb_hour + 'h' + deb_min + ' ! Fin prévue à ' + fin_hour + 'h' + fin_min + ' !'
                      });

                    }.bind(null, null));
                    
                    //Schedule the end of the WW
                    schedule.scheduleJob('WW', heure_fin_ww, function(params)
                    {
                      //Message end of the WW
                      bot.sendMessage({
                            to: channelID,
                            message: 'Fin de la WW de ' + deb_hour + 'h' + deb_min + ' à ' + fin_hour + 'h' + fin_min + ' !'
                      });

                    }.bind(null, null));
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: 'Veuillez indiquer une heure valide.'
                    });
                }
                break;
            // Just add any case commands if you want to..
         }
     }
});

/* TODO
- Donner un nom à la WW
- Ajouter des gens à une WW
- Annuler une WW
- Afficher les WW
*/
