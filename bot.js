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

function delete_ww(name) {
    var index = -1;
    var arrayLength = list_ww.length;
    for (var i = 0; i < arrayLength; i++) {
        if (list_ww[i][0] == name) {
            index = i
            break;
        }
    }
    if (index > -1) {
        list_ww.splice(index, 1);
    }
}

function is_in_list_ww(name) {
    var arrayLength = list_ww.length;
    for (var i = 0; i < arrayLength; i++) {
        if (list_ww[i][0] == name) {
            return true;
        }
    }
    return false;
}

function deb_and_end_ww(channelID, name_ww, heure_deb_ww, heure_fin_ww, heure_deb_to_display, heure_fin_to_display, nbr_minutes_ww, runners) {
    
    //Message acceptation of the WW
    bot.sendMessage({
        to: channelID,
        message: 'Ok, la WW ' + name_ww + ' commencera à ' + heure_deb_to_display + ' pour ' + nbr_minutes_ww + ' minutes ! '
    });

    //Schedule the beginning of the WW
    schedule.scheduleJob('WW', heure_deb_ww, function(params)
    {
        if (is_in_list_ww(name_ww)) {
        
            //Message beginning of the WW
            bot.sendMessage({
                  to: channelID,
                  message: 'C\'est partiiiiiiiiiiiiii !\nDébut de la WW ' + name_ww + ' de ' + heure_deb_to_display + ' à ' + heure_fin_to_display + runners + ' !' 
            });
          
            //Schedule the end of the WW
            schedule.scheduleJob('WW', heure_fin_ww, function(params)
            {
               //Message end of the WW
               bot.sendMessage({
                     to: channelID,
                     message: 'Stop !\nFin de la WW ' + name_ww + ' de ' + heure_deb_to_display + ' à ' + heure_fin_to_display + ' !'
               });
                  
               delete_ww(name_ww);
               console.log(list_ww);

            }.bind(null, null));

        }
        
      }.bind(null, null));
}

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
                        message: 'Pour annoncer une WW (les arguments entre crochets sont optionnels) : ```!ww heureDeDépart NombreDeMinutes [NomDeLaWW] [@Participant1 @Participant2 ...]```'
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
                if (args.length >= 4) {
                    name_ww = args[3];
                }
                else {
                    name_ww = args[1]+args[2];
                }
                if (is_in_list_ww(name_ww)) {
                    bot.sendMessage({
                        to: channelID,
                        message: 'Le nom de la WW est déjà pris ! Il faut trouver autre chose...'
                    });
                    break
                }
                
                //Get runners
                if (args.length >= 5) {
                    //var size_list = args.length-1;
                    var runners = args.slice(4);
                }
                else {
                    var runners = [];
                }
                
                //Hour and minutes are between 0-24 and 0-59
                if (hour >= 0 && hour < 25 && minutes >=0 && minutes < 60 && !Number.isNaN(nbr_minutes_ww)) {
                
                    var heure_deb_ww = new Date();
                    heure_deb_ww.setHours(hour, minutes, 0);
                    var heure_fin_ww = new Date(heure_deb_ww);
                    heure_fin_ww.setMinutes(heure_deb_ww.getMinutes() + nbr_minutes_ww);
                    
                    //if the ww is too late for today, it is for tomorrow
                    if (heure_deb_ww < Date.now()) {
                        heure_deb_ww.setDate(heure_deb_ww.getDate()+1);
                        heure_fin_ww.setDate(heure_fin_ww.getDate()+1);
                    }
                    
                    //Add WW to list
                    var heure_deb_to_display = heure_deb_ww.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
                    var heure_fin_to_display = heure_fin_ww.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
                    
                    list_ww.push([name_ww, heure_deb_to_display, heure_fin_to_display]);
                    
                    console.log(list_ww);
                    
                    //begin and end of the WW
                    deb_and_end_ww(channelID, name_ww, heure_deb_ww, heure_fin_ww, heure_deb_to_display, heure_fin_to_display, nbr_minutes_ww, runners);
                
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: 'L\'heure indiquée n\'est pas valide !'
                    });
                }
                break;
                
            case 'wwkill':
                if (args.length == 2) {
                    var name_ww_to_delete = args[1];
                    delete_ww(name_ww_to_delete);
                    bot.sendMessage({
                        to: channelID,
                        message: 'Word War supprimée !'
                    });
                    
                    console.log(list_ww);
                    break;
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: 'Pour supprimer une Word War : ```!wwkill nomDeLaWW```'
                    });
                    break;
                }
            
            case 'wwall':
                var arrayLength = list_ww.length;
                var message_to_display = "";
                for (var i = 0; i < arrayLength; i++) {
                    var name_i = list_ww[i][0];
                    var deb_i = list_ww[i][1];
                    var fin_i = list_ww[i][2];
                    
                    message_to_display = message_to_display + "WW " + name_i + " de " + deb_i + " à " + fin_i + "\n";
                }
                    bot.sendMessage({
                        to: channelID,
                        message: message_to_display
                });
                break;
         }
     }
});

/* TODO
DONE - Donner un nom à la WW 
- Ajouter des gens à une WW
DONE - Annuler une WW
DONE - Afficher les WW
*/
