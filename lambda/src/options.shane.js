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
    { "name": "OfficeSpeakers", "alias": [ "Office Speakers", "Office", "My Office", "Shane\'s Office"]},
    { "name": "PorchSpeakers", "alias": [ "Porch Speakers", "Porch" ]},
    { "name": "PatioSpeakers", "alias": [ "Patio Speakers", "Downstairs", "Patio" ] },
    { "name": "BedroomSpeakers", "alias": [ "Bedroom Speakers", "Bedroom" ] },
    { "name": "GreatRoomSpeakers", "alias": [ "Great Room Speakers", "Great Room", "Greatroom", "Den", "Living Room", "Livingroom", "Upstairs" ] },
    { "name": "FrontRoomSpeakers", "alias": [ "FrontRoom Speakers", "Front Room", "Frontroom" ] },    
    { "name": "SpaSpeakers", "alias": [ "Spa Speakers", "Spa", "Hot Tub"]},
    { "name": "DockSpeakers", "alias": [ "Dock Speakers", "Dock" ]}
];

/*[{ "name": "OfficeSpeakers", "alias": [ "Office Speakers", "Office", "My Office", "Shane\'s Office"]},{ "name": "PorchSpeakers", "alias": [ "Porch Speakers", "Porch" ]},{ "name": "PatioSpeakers", "alias": [ "Patio Speakers", "Downstairs", "Patio" ] },{ "name": "BedroomSpeakers", "alias": [ "Bedroom Speakers", "Bedroom" ] },{ "name": "GreatRoomSpeakers", "alias": [ "Great Room Speakers", "Great Room", "Greatroom", "Den", "Living Room", "Livingroom", "Upstairs" ] },{ "name": "FrontRoomSpeakers", "alias": [ "FrontRoom Speakers", "Front Room", "Frontroom" ] },{ "name": "SpaSpeakers", "alias": [ "Spa Speakers", "Spa", "Hot Tub"]},{ "name": "DockSpeakers", "alias": [ "Dock Speakers", "Dock" ]}]*/
