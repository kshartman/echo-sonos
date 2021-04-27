// You should not have to change this file at all.  Instead, change the environment variables
// in Lambda. The README.md will walk you through this.
//
// This file remains for backward compatibility, and if you want to hardcode anything (for whatever reason).


// If you setup basic auth in node-sonos-http-api's settings.json, change the username
// and password here.  Otherwise, just leave this alone and it will work without auth.
var username = getDefault("AUTH_USERNAME", "basic_auth_username");
var password = getDefault("AUTH_PASSWORD", "basic_auth_password");

var auth = new Buffer.from(username + ":" + password).toString("base64");

var options = {
  homes: [],
  roomAliases: getDefault("ROOM_ALIASES", "[]"),             //>>> KSH array of room { room: <room-name>, alias: [ <string-alias1>, ... ] }
  presets: getDefault("PRESETS", "[]"),                      //>>> KSH array of preset names [ "preset" ... ] 
  presetAliases: getDefault("PRESET_ALIASES", "[]"),         //>>> KSH array of presets [ {name: "preset", alias: ["preset alias", ... ]}, ... ] 
  home: getDefault("HOME", ""),                              //>>> KSH which home is this
  useHomeRooms: getDefault("USE_HOME_ROOMS", false),         //>>> KSH if true, use hardcoded rooms
  useHomePresets: getDefault("USE_HOME_PRESETS", false),     //>>> KSH if true, use hardcoded presets
  debug: getDefault("DEBUG_CODE", false),                    //>>> KSH
  appid: getDefault("APPID", "yourappidhere"),
  host: getDefault("HOST", "yourhosthere"),
  port: getDefault("PORT", "5005"),
  headers: {
      "Authorization": "Basic " + auth,
      "Content-Type": "application/json"
  },

  useHttps: getDefault("USE_HTTPS", false), // Change to true if you setup node-sonos-http-api with HTTPS
  rejectUnauthorized: getDefault("REJECT_UNAUTHORIZED", true), // Change to false if you self-signed your certificate
  defaultRoom: getDefault("DEFAULT_ROOM", ""),				        // Allows you to specify a default room when one is not specified in the utterance
  defaultMusicService: getDefault("DEFAULT_MUSIC_SERVICE", "presets"), // Supports presets, apple, spotify, deezer, or library
  advancedMode: getDefault("ADVANCED_MODE", false),             // Allows you to specify and change default rooms and music services. Requires additional AWS setup
  useSQS: getDefault("USE_SQS", false),        // Use AWS SQS and node-sqs-proxy for secure communications
  defaultLinein: getDefault("DEFAULT_LINEIN", false)              // Allows you to specify a default Linein (e.g. with a dot connected) 
};

// >>> Hard coded.  only used if USE_HOME is true
// >>> Otherwise, environment variable ROOM_ALIASES is used

var middleglenRoomAliases = [ { "name": "shanesoffice",
                            alias:
                            [ "shane\"s office",
                              "my office",
                              "myoffice",
                              "shanes office",
                              "his office",
                              "shines office",
                              "shinesoffice",
                              "shine\"s office" ] },
                          { "name": "kathysoffice",
                            alias:
                            [ "kathys office",
                              "kathy\"s office",
                              "cathys office",
                              "cathy\"s office",
                              "cathysoffice",
                              "her office" ] },
                          { "name": "livingroom", alias: [ "living room", "den" ] },
                          { "name": "patio", alias: [ "pool", "backyard", "back yard" ] },
                          { "name": "kitchen" },
                          { "name": "diningroom", alias: ["dining room"] },
                          { "name": "mediaroom", alias: ["media room"] },
                          { "name": "sunroom",
                            alias: [ "sun room", "pool room", "poolroom" ] },
                          { "name": "livingroom", alias: [ "living room", "den" ] },
                          { "name": "bedroom", alias: [ "master", "master bedroom", "our bedroom" ] } ];


/*
[{"name":"shanesoffice","alias":["shane"s office","my office","myoffice","shanes office","his office","shines office","shinesoffice","shine"s office"]},{"name":"kathysoffice","alias":["kathys office","kathy"s office","cathys office","cathy"s office","cathysoffice","her office"]},{"name":"livingroom","alias":["living room","den"]},{"name":"patio","alias":["pool","backyard","back yard"]},{"name":"kitchen"},{"name":"diningroom","alias":["dining room"]},{"name":"mediaroom","alias":["media room"]},{"name":"sunroom","alias":["sun room","pool room","poolroom"]},{"name":"livingroom","alias":["living room","den"]},{"name":"bedroom","alias":["master","master bedroom", "our bedroom"]}]
*/


var lakehouseRoomAliases = [
    { "name": "Office Speakers", "alias": [ "Office", "My Office", "Shane\'s Office"]},
    { "name": "Porch Speakers", "alias": [ "Porch" ]},
    { "name": "Patio Speakers", "alias": [ "Downstairs", "Patio" ] },
    { "name": "Bedroom Speakers", "alias": [ "Bedroom" ] },
    { "name": "Great Room Speakers", "alias": [ "Great Room", "Greatroom", "Den", "Living Room", "Livingroom", "Upstairs" ] },
    { "name": "Front Room Speakers", "alias": [ "Front Room", "Frontroom" ] },    
    { "name": "Spa Speakers", "alias": [ "Spa", "Hot Tub"]},
    { "name": "Dock Speakers", "alias": [ "Dock" ]}
];

/*
[{"name":"Office Speakers","alias":["Office","My Office","Shane\'s Office"]},{"name":"Porch Speakers","alias":["Porch" ]},{"name":"Patio Speakers","alias":["Downstairs","Patio" ] },{"name":"Bedroom Speakers","alias":["Bedroom" ] },{"name":"Great Room Speakers","alias":["Great Room","Greatroom","Den","Living Room","Livingroom","Upstairs" ] },{"name":"Front Room Speakers","alias":["Front Room","Frontroom" ] },{"name":"Spa Speakers","alias":["Spa","Hot Tub"]},{"name":"Dock Speakers","alias":["Dock" ]}]
*/

var middleglenPresetAliases = [];

var lakehousePresetAliases = [
    {"name": "ambient_radio", "alias": ["ambient radio", "ambient", "ambient music"]},
    {"name": "an_african_night", "alias": ["an african night", "africa", "african night"]},
    {"name": "archaic_beats", "alias": ["archaic beats", "archaic beat", "ancient beat", "ancient beats"]},
    {"name": "blues_acoustic", "alias": ["acoustic blues", "blues acoustic"]},
    {"name": "blues_chicago", "alias": ["chicago blues", "classic blues", "blues chicago"]},
    {"name": "blues_electric", "alias": ["electric blues", "blues electric"]},
    {"name": "blues_radio", "alias": ["blues", "blues radio", "blues music"]},
    {"name": "blues_uk_radio", "alias": ["blues uk", "blues uk radio"]},
    {"name": "boot_liquor", "alias": ["boot liquor", "shit kicker music", "boot liquor radio", "country music", "country", "shit kicker"]},
    {"name": "classical_baroque", "alias": ["baroque", "baroque classical", "classical baroque", "baroque music"]},
    {"name": "classical_guitar", "alias": ["classical guitar", "classical guitar music"]},
    {"name": "classical_quiet", "alias": ["classical quiet", "quiet classical music", "quiet classical"]},
    {"name": "classical_radio", "alias": ["classical radio", "classical", "classical 101", "classical music", "wrr"]},
    {"name": "crickets_summer_night", "alias": ["crickets summer night", "crickets", "summer crickets"]},
    {"name": "electronic_radio", "alias": ["electronic radio", "electronic", "electronic music"]},
    {"name": "gangsta_rap_radio", "alias": ["gangsta rap", "gangster radio", "gangsta radio", "gangsta", "gangster", "gangsta rap radio"]},
    {"name": "hearts_of_space", "alias": ["hearts of space", "hos"]},
    {"name": "jazz_radio", "alias": ["jazz radio", "jazz music", "jazz"]},
    {"name": "jazz_smooth", "alias": ["smooth jazz", "quiet jazz", "jazz smooth"]},
    {"name": "kera", "alias": ["kera", "public radio", "kera radio", "npr", "npr radio", "pbs"]},
    {"name": "middle_eastern", "alias": ["middle eastern", "middle eastern music"]},
    {"name": "ocean_sounds", "alias": ["ocean sounds", "ocean surf"]},
    {"name": "ocean_waves", "alias": ["ocean waves"]},
    {"name": "reggae_music", "alias": ["reggae music"]},
    {"name": "reggae_radio", "alias": ["reggae radio", "reggae"]},
    {"name": "reggae_roots", "alias": ["roots reggae", "reggae roots music", "roots reggae music", "reggae roots"]},
    {"name": "rock_classic", "alias": ["classic rock", "classic rock music"]},
    {"name": "rock_radio", "alias": ["rock radio", "rock", "rock music"]},
    {"name": "sahara_sunset_radio", "alias": ["sahara sunset", "sahara sunset radio"]},
    {"name": "secret_agent", "alias": ["secret agent", "spy music radio", "secret agent radio", "spy music", "music for spys"]},
    {"name": "this_weeks_show", "alias": ["this weeks show", "this week's show"]},
    {"name": "thundering_rainstorm", "alias": ["thundering rainstorm", "thunder storm", "thunderstorm", "rain", "thunder"]},
    {"name": "toad_trills_and_thunder", "alias": ["toad trills and thunder", "thunder toads", "thunder tongues", "thunder tones", "frogs", "toads"]}
];

/*
[{"name":"ambient_radio","alias":["ambient radio","ambient","ambient music"]},{"name":"an_african_night","alias":["an african night","africa","african night"]},{"name":"archaic_beats","alias":["archaic beats","archaic beat","ancient beat","ancient beats"]},{"name":"blues_acoustic","alias":["acoustic blues","blues acoustic"]},{"name":"blues_chicago","alias":["chicago blues","classic blues","blues chicago"]},{"name":"blues_electric","alias":["electric blues","blues electric"]},{"name":"blues_radio","alias":["blues","blues radio","blues music"]},{"name":"blues_uk_radio","alias":["blues uk","blues uk radio"]},{"name":"boot_liquor","alias":["boot liquor","shit kicker music","boot liquor radio","country music","country","shit kicker"]},{"name":"classical_baroque","alias":["baroque","baroque classical","classical baroque","baroque music"]},{"name":"classical_guitar","alias":["classical guitar","classical guitar music"]},{"name":"classical_quiet","alias":["classical quiet","quiet classical music","quiet classical"]},{"name":"classical_radio","alias":["classical radio","classical","classical 101","classical music","wrr"]},{"name":"crickets_summer_night","alias":["crickets summer night","crickets","summer crickets"]},{"name":"electronic_radio","alias":["electronic radio","electronic","electronic music"]},{"name":"gangsta_rap_radio","alias":["gangsta rap","gangster radio","gangsta radio","gangsta","gangster","gangsta rap radio"]},{"name":"hearts_of_space","alias":["hearts of space","hos"]},{"name":"jazz_radio","alias":["jazz radio","jazz music","jazz"]},{"name":"jazz_smooth","alias":["smooth jazz","quiet jazz","jazz smooth"]},{"name":"kera","alias":["kera","public radio","kera radio","npr","npr radio","pbs"]},{"name":"middle_eastern","alias":["middle eastern","middle eastern music"]},{"name":"ocean_sounds","alias":["ocean sounds","ocean surf"]},{"name":"ocean_waves","alias":["ocean waves"]},{"name":"reggae_music","alias":["reggae music"]},{"name":"reggae_radio","alias":["reggae radio","reggae"]},{"name":"reggae_roots","alias":["roots reggae","reggae roots music","roots reggae music","reggae roots"]},{"name":"rock_classic","alias":["classic rock","classic rock music"]},{"name":"rock_radio","alias":["rock radio","rock","rock music"]},{"name":"sahara_sunset_radio","alias":["sahara sunset","sahara sunset radio"]},{"name":"secret_agent","alias":["secret agent","spy music radio","secret agent radio","spy music","music for spys"]},{"name":"this_weeks_show","alias":["this weeks show", "this week's show"]},{"name":"thundering_rainstorm","alias":["thundering rainstorm","thunder storm","thunderstorm","rain","thunder"]},{"name":"toad_trills_and_thunder","alias":["toad trills and thunder","thunder toads","thunder tongues","thunder tones","frogs","toads"]}]
*/

function defineHome(name, roomAliases, presetAliases) {
    options.homes.push({
        "name": name,
        "rooms": roomAliases,
        "presets": presetAliases});
    options.home.useId = !!presetAliases;
}

var myHomes = [
    {
        name: "lakehouse",
        rooms: lakehouseRoomAliases,
        presets: lakehousePresetAliases
    },
    {
        name: "middleglen",
        rooms: middleglenRoomAliases,
        presets: middleglenPresetAliases
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
