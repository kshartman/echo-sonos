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
				 'ocean sounds',
				 'ocean surf',
				 'ocean waves',
				 'rock'
];

var middleglenPresets = [
    "ambient radio", "an african night", "archaic beat", "baroque radio", "blues acoustic", "blues electric",
    "blues uk", "blues", "boot liquor", "chicago blues", "christmas radio", "classic rock", "classical 101",
    "classical guitar", "crickets summer night", "electronic radio", "gangsta rap radio", "hearts of space", "jazz",
    "kera", "middle eastern", "ocean sounds", "ocean surf", "ocean waves", "quiet classical", "reggae", "rock",
    "roots reggae", "sahara sunset radio", "secret agent", "smooth jazz", "this weeks show", "thundering rainstorm",
    "toad trills and thunder", "npr", "public radio", "pbs", "rock music", "kera radio", "npr radio",
    "reggae music", "blues radio", "country", "shit kicker", "quiet jazz", "ancient beat", "ancient beats",
    "archaic beats", "reggae radio", "music for spys", "spy music", "ambient", "baroque", "classical music",
    "classical radio", "classical", "classic blues", "blues", "wrr", "ambient music", "baroque music",
    "acoustic blues", "electric blues", "quiet music", "christmas", "christmas music", "africa", "african night",
    "electronic", "electronic music", "gangster", "gangster radio", "gangsta radio", "gangsta", "lounge",
    "sahara sunset", "rain", "thunder storm", "thunder", "thunderstorm", "summer crickets", "frogs",
    "thunder toads", "thunder tongues", "toads", "thunder tones"
];

/*
var middleglenPresetsJSON = '["ambient radio", "an african night", "archaic beat", "baroque radio", "blues acoustic", "blues electric", "blues uk", "blues", "boot liquor", "chicago blues", "christmas radio", "classic rock", "classical 101", "classical guitar", "crickets summer night", "electronic radio", "gangsta rap radio", "hearts of space", "jazz", "kera", "middle eastern", "ocean sounds", "ocean surf", "ocean waves", "quiet classical", "reggae", "rock", "roots reggae", "sahara sunset radio", "secret agent", "smooth jazz", "this weeks show", "thundering rainstorm", "toad trills and thunder", "npr", "public radio", "pbs", "rock music", "kera radio", "npr radio", "reggae music", "blues radio", "country", "shit kicker", "quiet jazz", "ancient beat", "ancient beats", "archaic beats", "reggae radio", "music for spys", "spy music", "ambient", "baroque", "classical music", "classical radio", "classical", "classic blues", "blues", "wrr", "ambient music", "baroque music", "acoustic blues", "electric blues", "quiet music", "christmas", "christmas music", "africa", "african night", "electronic", "electronic music", "gangster", "gangster radio", "gangsta radio", "gangsta", "lounge", "sahara sunset", "rain", "thunder storm", "thunder", "thunderstorm", "summer crickets", "frogs", "thunder toads", "thunder tongues", "toads", "thunder tones" ]';
*/

var lakehousePresets = [
    "ambient radio", "an african night", "archaic beat", "baroque radio", "blues acoustic", "blues electric",
    "blues uk", "blues", "boot liquor", "chicago blues", "christmas radio", "classic rock", "classical 101",
    "classical guitar", "crickets summer night", "electronic radio", "gangsta rap radio", "hard rock", "hearts of space", "jazz",
    "kera", "middle eastern", "ocean surf", "ocean waves", "quiet classical", "reggae", "rock",
    "roots reggae", "sahara sunset radio", "secret agent", "smooth jazz", "this weeks show", "thundering rainstorm",
    "toad trills and thunder", "npr", "public radio", "pbs", "rock music", "kera radio", "npr radio",
    "reggae music", "blues radio", "country", "shit kicker", "quiet jazz", "ancient beat", "ancient beats",
    "archaic beats", "reggae radio", "music for spys", "spy music", "ambient", "baroque", "classical music",
    "classical radio", "classical", "classic blues", "blues", "wrr", "ambient music", "baroque music",
    "acoustic blues", "electric blues", "quiet music", "christmas", "christmas music", "africa", "african night",
    "electronic", "electronic music", "gangster", "gangster radio", "gangsta radio", "gangsta", "lounge",
    "sahara sunset", "rain", "thunder storm", "thunder", "thunderstorm", "summer crickets", "frogs",
    "thunder toads", "thunder tongues", "toads", "thunder tones"
];

/*
var lakehousePresetsJSON = '["ambient radio", "an african night", "archaic beat", "baroque radio", "blues acoustic", "blues electric", "blues uk", "blues", "boot liquor", "chicago blues", "christmas radio", "classic rock", "classical 101", "classical guitar", "crickets summer night", "electronic radio", "gangsta rap radio", "hearts of space", "jazz", "kera", "middle eastern", "ocean surf", "ocean waves", "quiet classical", "reggae", "rock", "roots reggae", "sahara sunset radio", "secret agent", "smooth jazz", "this weeks show", "thundering rainstorm", "toad trills and thunder", "npr", "public radio", "pbs", "rock music", "kera radio", "npr radio", "reggae music", "blues radio", "country", "shit kicker", "quiet jazz", "ancient beat", "ancient beats", "archaic beats", "reggae radio", "music for spys", "spy music", "ambient", "baroque", "classical music", "classical radio", "classical", "classic blues", "blues", "wrr", "ambient music", "baroque music", "acoustic blues", "electric blues", "quiet music", "christmas", "christmas music", "africa", "african night", "electronic", "electronic music", "gangster", "gangster radio", "gangsta radio", "gangsta", "lounge", "sahara sunset", "rain", "thunder storm", "thunder", "thunderstorm", "summer crickets", "frogs", "thunder toads", "thunder tongues", "toads", "thunder tones" ]';
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
    if (typeof(process.env[key]) === 'undefined') { 
        return defaultVal;
    }
    else if (typeof(process.env[key]) === 'string') {
        var result = process.env[key].trim().toLowerCase();

        if (result === 'false') {
            return false;
        }
        else if (result === 'true') {
            return true;
        }
        else if (result === '' || result === 'undefined') {
            return defaultVal;
        }
    }
    return process.env[key];
}
