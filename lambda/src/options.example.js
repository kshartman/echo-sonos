//
// You should not have to change this file at all.  Instead, change the environment variables
// in Lambda. The README.md will walk you through this.
//
// This file remains for backward compatibility, and if you want to hardcode anything (for whatever reason).


// If you setup basic auth in node-sonos-http-api's settings.json, change the username
// and password here.  Otherwise, just leave this alone and it will work without auth.
var username = getDefault('AUTH_USERNAME', 'basic_auth_username');
var password = getDefault('AUTH_PASSWORD', 'basic_auth_password');

var auth = new Buffer(username + ":" + password).toString("base64");

var options = {
  roomAliases: getDefault('ROOM_ALIASES', '[]'),             //>>> KSH array of room { room: <room-name>, alias: [ <string-alias1>, ... ] }
  presets: getDefault('PRESETS', '[]'),                      //>>> KSH array of string prse { room: <room-name>, alias: [ <string-alias1>, ... ]} 
  home: getDefault('HOME', ''),                              //>>> KSH which home is this
  useHomeRooms: getDefault('USE_HOME_ROOMS', false),         //>>> KSH if true, use hardcoded rooms
  useHomePresets: getDefault('USE_HOME_PRESETS', false),     //>>> KSH if true, use hardcoded presets
  debug: getDefault('DEBUG_CODE', false),                    //>>> KSH
  appid: getDefault('APPID', 'yourappidhere'),
  host: getDefault('HOST', 'yourhosthere'),
  port: getDefault('PORT', '5005'),
  headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/json'
  },

  useHttps: getDefault('USE_HTTPS', false), // Change to true if you setup node-sonos-http-api with HTTPS
  rejectUnauthorized: getDefault('REJECT_UNAUTHORIZED', true), // Change to false if you self-signed your certificate
  defaultRoom: getDefault('DEFAULT_ROOM', ''),				        // Allows you to specify a default room when one is not specified in the utterance
  defaultMusicService: getDefault('DEFAULT_MUSIC_SERVICE', 'presets'), // Supports presets, apple, spotify, deezer, or library
  advancedMode: getDefault('ADVANCED_MODE', false),             // Allows you to specify and change default rooms and music services. Requires additional AWS setup
  useSQS: getDefault('USE_SQS', false),        // Use AWS SQS and node-sqs-proxy for secure communications
  defaultLinein: getDefault('DEFAULT_LINEIN', false)              // Allows you to specify a default Linein (e.g. with a dot connected) 
};

// >>> Hard coded.  only used if USE_HOME is true
// >>> Otherwise, environment variable ROOM_ALIASES is used
var middleGlenAliases = [ { room: 'shanesoffice',
                            alias:
                            [ 'shane\'s office',
                              'my office',
                              'myoffice',
                              'shanes office',
                              'his office',
                              'shines office',
                              'shinesoffice',
                              'shine\'s office' ] },
                          { room: 'kathysoffice',
                            alias:
                            [ 'kathys office',
                              'kathy\'s office',
                              'cathys office',
                              'cathy\'s office',
                              'cathysoffice',
                              'her office' ] },
                          { room: 'livingroom', alias: [ 'living room', 'den' ] },
                          { room: 'patio', alias: [ 'pool', 'backyard', 'back yard' ] },
                          { room: 'kitchen' },
                          { room: 'diningroom', alias: ['dining room'] },
                          { room: 'mediaroom', alias: ['media room'] },
                          { room: 'sunroom',
                            alias: [ 'sun room', 'pool room', 'poolroom' ] },
                          { room: 'livingroom', alias: [ 'living room', 'den' ] },
                          { room: 'bedroom', alias: [ 'master', 'master bedroom', 'our bedroom' ] } ];

/*
[{"room":"shanesoffice","alias":["shane's office","my office","myoffice","shanes office","his office","shines office","shinesoffice","shine's office"]},{"room":"kathysoffice","alias":["kathys office","kathy's office","cathys office","cathy's office","cathysoffice","her office"]},{"room":"livingroom","alias":["living room","den"]},{"room":"patio","alias":["pool","backyard","back yard"]},{"room":"kitchen"},{"room":"diningroom","alias":["dining room"]},{"room":"mediaroom","alias":["media room"]},{"room":"sunroom","alias":["sun room","pool room","poolroom"]},{"room":"livingroom","alias":["living room","den"]},{"room":"bedroom","alias":["master","master bedroom", "our bedroom"]}]
*/

var lakeHouseAliases = [ { room: 'den',
                           alias:
                           [ 'great room',
                             'greatroom',
                             'living room',
                             'livingroom',
                             'upstairs' ] },
                         { room: 'bedroom', alias: [ 'master', 'master bedroom' ] },
                         { room: 'spa', alias: ['downstairs'] },
                         { room: 'office' }
                       ];

/*
[{"room":"den","alias":["great room","greatroom","living room","livingroom","upstairs"]},{"room":"bedroom","alias":["master","master bedroom"]},{"room":"spa","alias":["downstairs"]},{"room":"office"}]
*/

// >>> KSH check for preset before search
// >>> These are only used if USE_HOME_PRESETS is true, otherwise, the environment variable PRESETS us used

var defaultPresets = [
				 'ambient',
				 'baroque',
				 'blues',
				 'country',
				 'christmas',
				 'classical',
				 'electronic',
				 'jazz',
				 'kera',
				 'ocean surf',
				 'ocean waves',
				 'rock'
];

var middleglenPresets = [
    "ambient radio.json", "an african night.json", "archaic beat.json", "baroque radio.json", "blues acoustic.json", "blues electric.json",
    "blues uk.json", "blues.json", "boot liquor.json", "chicago blues.json", "christmas radio.json", "classic rock.json", "classical 101.json",
    "classical guitar.json", "crickets summer night.json", "electronic radio.json", "gangsta rap radio.json", "hearts of space.json", "jazz.json",
    "kera.json", "middle eastern.json", "ocean surf.json", "ocean waves.json", "quiet classical.json", "reggae.json", "rock.json",
    "roots reggae.json", "sahara sunset radio.json", "secret agent.json", "smooth jazz.json", "this weeks show.json", "thundering rainstorm.json",
    "toad trills and thunder.json", "npr.json", "public radio.json", "pbs.json", "rock music.json", "kera radio.json", "npr radio.json",
    "reggae music.json", "blues radio.json", "country.json", "shit kicker.json", "quiet jazz.json", "ancient beat.json", "ancient beats.json",
    "archaic beats.json", "reggae radio.json", "music for spys.json", "spy music.json", "ambient.json", "baroque.json", "classical music.json",
    "classical radio.json", "classical.json", "classic blues.json", "blues.json", "wrr.json", "ambient music.json", "baroque music.json",
    "acoustic blues.json", "electric blues.json", "quiet music.json", "christmas.json", "christmas music.json", "africa.json", "african night.json",
    "electronic.json", "electronic music.json", "gangster.json", "gangster radio.json", "gangsta radio.json", "gangsta.json", "lounge.json",
    "sahara sunset.json", "rain.json", "thunder storm.json", "thunder.json", "thunderstorm.json", "summer crickets.json", "frogs.json",
    "thunder toads.json", "thunder tongues.json", "toads.json", "thunder tones.json"
];

/*
["ambient radio.json","an african night.json","archaic beat.json","baroque radio.json","blues acoustic.json","blues electric.json","blues uk.json","blues.json","boot liquor.json","chicago blues.json","christmas radio.json","classic rock.json","classical 101.json","classical guitar.json","crickets summer night.json","electronic radio.json","gangsta rap radio.json","hearts of space.json","jazz.json","kera.json","middle eastern.json","ocean surf.json","ocean waves.json","quiet classical.json","reggae.json","rock.json","roots reggae.json","sahara sunset radio.json","secret agent.json","smooth jazz.json","this weeks show.json","thundering rainstorm.json","toad trills and thunder.json","npr.json","public radio.json","pbs.json","rock music.json","kera radio.json","npr radio.json","reggae music.json","blues radio.json","country.json","shit kicker.json","quiet jazz.json","ancient beat.json","ancient beats.json","archaic beats.json","reggae radio.json","music for spys.json","spy music.json","ambient.json","baroque.json","classical music.json","classical radio.json","classical.json","classic blues.json","blues.json","wrr.json","ambient music.json","baroque music.json","acoustic blues.json","electric blues.json","quiet music.json","christmas.json","christmas music.json","africa.json","african night.json","electronic.json","electronic music.json","gangster.json","gangster radio.json","gangsta radio.json","gangsta.json","lounge.json","sahara sunset.json","rain.json","thunder storm.json","thunder.json","thunderstorm.json","summer crickets.json","frogs.json","thunder toads.json","thunder tongues.json","toads.json","thunder tones.json"]
*/


var lakehousePresets = [
    "ambient radio.json", "an african night.json", "archaic beat.json", "baroque radio.json", "blues acoustic.json", "blues electric.json",
    "blues uk.json", "blues.json", "boot liquor.json", "chicago blues.json", "christmas radio.json", "classic rock.json", "classical 101.json",
    "classical guitar.json", "crickets summer night.json", "electronic radio.json", "gangsta rap radio.json", "hard rock", "hearts of space.json", "jazz.json",
    "kera.json", "middle eastern.json", "ocean surf.json", "ocean waves.json", "quiet classical.json", "reggae.json", "rock.json",
    "roots reggae.json", "sahara sunset radio.json", "secret agent.json", "smooth jazz.json", "this weeks show.json", "thundering rainstorm.json",
    "toad trills and thunder.json", "npr.json", "public radio.json", "pbs.json", "rock music.json", "kera radio.json", "npr radio.json",
    "reggae music.json", "blues radio.json", "country.json", "shit kicker.json", "quiet jazz.json", "ancient beat.json", "ancient beats.json",
    "archaic beats.json", "reggae radio.json", "music for spys.json", "spy music.json", "ambient.json", "baroque.json", "classical music.json",
    "classical radio.json", "classical.json", "classic blues.json", "blues.json", "wrr.json", "ambient music.json", "baroque music.json",
    "acoustic blues.json", "electric blues.json", "quiet music.json", "christmas.json", "christmas music.json", "africa.json", "african night.json",
    "electronic.json", "electronic music.json", "gangster.json", "gangster radio.json", "gangsta radio.json", "gangsta.json", "lounge.json",
    "sahara sunset.json", "rain.json", "thunder storm.json", "thunder.json", "thunderstorm.json", "summer crickets.json", "frogs.json",
    "thunder toads.json", "thunder tongues.json", "toads.json", "thunder tones.json"
];


/*
["ambient radio.json","an african night.json","archaic beat.json","baroque radio.json","blues acoustic.json","blues electric.json","blues uk.json","blues.json","boot liquor.json","chicago blues.json","christmas radio.json","classic rock.json","classical 101.json","classical guitar.json","crickets summer night.json","electronic radio.json","gangsta rap radio.json","hard rock","hearts of space.json","jazz.json","kera.json","middle eastern.json","ocean surf.json","ocean waves.json","quiet classical.json","reggae.json","rock.json","roots reggae.json","sahara sunset radio.json","secret agent.json","smooth jazz.json","this weeks show.json","thundering rainstorm.json","toad trills and thunder.json","npr.json","public radio.json","pbs.json","rock music.json","kera radio.json","npr radio.json","reggae music.json","blues radio.json","country.json","shit kicker.json","quiet jazz.json","ancient beat.json","ancient beats.json","archaic beats.json","reggae radio.json","music for spys.json","spy music.json","ambient.json","baroque.json","classical music.json","classical radio.json","classical.json","classic blues.json","blues.json","wrr.json","ambient music.json","baroque music.json","acoustic blues.json","electric blues.json","quiet music.json","christmas.json","christmas music.json","africa.json","african night.json","electronic.json","electronic music.json","gangster.json","gangster radio.json","gangsta radio.json","gangsta.json","lounge.json","sahara sunset.json","rain.json","thunder storm.json","thunder.json","thunderstorm.json","summer crickets.json","frogs.json","thunder toads.json","thunder tongues.json","toads.json","thunder tones.json"]
*/

var myHomes = [
    {
        name: "lakehouse",
        rooms: lakeHouseAliases,
        presets: lakehousePresets
    },
    {
        name: "middleglen",
        rooms: middleGlenAliases,
        presets: middleglenPresets
    }
];

options.homes = myHomes;

module.exports = options;

function getDefault(key, defaultVal) {
  if (typeof(process.env[key]) == 'undefined') { 
    return defaultVal;
  }
  else {
    return process.env[key];
  }
}
