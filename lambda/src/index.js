/*jslint vars: true, plusplus: true, devel: true, indent: 4, maxerr: 50, node: true */ /*global define */
'use strict';

var http = require('http');
var https = require('https');
var AWS = require('aws-sdk');
var dynamodb = null;

var options = require('./options');
var defaultMusicService = ((options.defaultMusicService !== undefined) && (options.defaultMusicService > '')) ? options.defaultMusicService : 'presets';
var defaultRoom = (options.defaultRoom !== undefined) ? options.defaultRoom : '';

/* >>> KSH - BEGIN room aliases */
function parseJSONArray(js, name) {
    var obj;
    try {
	    obj = JSON.parse(js);
    } catch(err) {
	    obj = [];
    }
    if (name) {
        console.log(name + ": " + JSON.stringify(obj));
    }
    return obj;
}

/*
  Format: [ { "room": "den", "alias": [ "greatroom", "great room", "living room", "upstairs", "downstairs" ] },
  { "room": "bedroom", "alias": [ "master", "master bedroom" ] }
  ...
  ]
*/

// '[ { "room": "den", "alias": [ "greatroom", "great room", "living room", "upstairs", "downstairs" ] }, { "room": "bedroom", "alias": [ "master", "master bedroom" ] } ]'

var myRoomAliases = [];
var myPresets = [];

function setRoomAliases() {
    var home;
    
    if (!options.useHome
        || !options.homes
        || (typeof options.homes) !== 'object'
        || (typeof options.homes[0]) !== 'object'        
        || (typeof options.home) !== 'string'        
        || !options.home
        || !(home = options.homes.find(function(home) { return (((typeof home) === 'object') && (home.name === options.home)); })))
    {
        console.log('Using env.ROOM_ALIASES');
        try {
            myRoomAliases = parseJSONArray(options.roomAliases, "ROOMS");
        }
        catch (err) {
            myRoomAliases = [];
            console.log('ERR', err);
        }
    }
    else {
        console.log('Using hardcoded ROOM_ALIASES');
        myRoomAliases = (home.rooms || []);
    }
    if (options.debug) {
        console.log(myRoomAliases);
    }
}

function setPresets() {
    var home;
    
    if (!options.useHome
        || !options.homes
        || (typeof options.homes) !== 'object'
        || (typeof options.homes[0]) !== 'object'        
        || (typeof options.home) !== 'string'        
        || !options.home
        || !(home = options.homes.find(function(home) { return (((typeof home) === 'object') && (home.name === options.home)); })))
    {
        console.log('Using env.PRESETS');
        try {
            myPresets = parseJSONArray(options.presets, "PRESETS");
        }
        catch (err) {
            myPresets = [];
            console.log('ERR', err);
        }
    }
    else {
        console.log('Using hardcoded PRESETS');
        myRoomAliases = (home.presets || []);
    }
    if (options.debug) {
        console.log(myPresets);
    }
}

setRoomAliases();
setPresets();

function findAlias(room, aliases) {
	var res = room;
	if (!aliases) {
		aliases = myRoomAliases;
	}
	try {
		for (var i = 0; i < aliases.length; i++) {
			for (var j = 0; j < aliases[i].alias.length; j++) {
				if (aliases[i].alias[j] == room) {
					res = aliases[i].room;
					throw res;
				}
			}
		}
	} catch (err) {
        console.log('ERR', err);
	}
	if (options.debug) {
        console.log("FIND ALIAS: " + room + " -> " + res);
    }
	return res;
}

/* >>> KSH - END room aliases */

var serverUrl = '';
var clientUrl = '';
var sqsServer = null;
var sqsClient = null;


var AlexaSkill = require('./AlexaSkill');
var EchoSonos = function () {
    AlexaSkill.call(this, options.appid);
};

var STATE_RESPONSES = [
    "This is $currentTitle by $currentArtist",
    "We're listening to $currentTitle by $currentArtist",
    "$currentTitle by $currentArtist"
];

function slotValue(slot, useId){
    let value = slot.value;
    let authority = (slot.resolutions || {}).resolutionsPerAuthority || [];

    // deal with synonyms
    if (authority.length > 0) {
        let resolution = authority[0];
        if (resolution && resolution.status.code == 'ER_SUCCESS_MATCH'){
            let resolutionValue = resolution.values[0].value;
            value = resolutionValue.id && useId ? resolutionValue.id : resolutionValue.name;
        }
    }
    return value;
}

function checkRoomSlot(intent) {
	try {
        return slotValue(intent.slots.Room);
	}
	catch(err) {
		return '';
	}
}

EchoSonos.prototype = Object.create(AlexaSkill.prototype);
EchoSonos.prototype.constructor = EchoSonos;

EchoSonos.prototype.intentHandlers = {

    AlbumIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("AlbumIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            musicHandler(room, service, '/album/', slotValue(intent.slots.AlbumName), response);
        });
    },

    ArtistIntent: function (intent, session, response) {
		var room = checkRoomSlot(intent);
		console.log("ArtistIntent received for room " + room + " for artist " + intent.slots.ArtistName.value);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            musicHandler(room, service, '/song/', 'artist:' + slotValue(intent.slots.ArtistName), response);
        });
    },

    TrackIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("TrackIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            musicHandler(room, service, '/song/', 'track:' + slotValue(intent.slots.TrackName), response);
        });
    },

    MusicRadioIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("MusicRadioIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            musicHandler(room, service, '/station/', slotValue(intent.slots.ArtistName), response);
        });
    },

    PlayMoreByArtistIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("PlayMoreByArtist received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            moreMusicHandler(room, service, '/song/', response);
        });
    },

    PlayMoreLikeTrackIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("PlayMoreLikeTrackIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            moreMusicHandler(room, service, '/station/', response);
        });
    },

    SiriusXMStationIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("SiriusXMStationIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            siriusXMHandler(room, slotValue(intent.slots.Station), 'station', response);
        });
    },

    SiriusXMChannelIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("SiriusXMChannelIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            siriusXMHandler(room, slotValue(intent.slots.Channel), 'channel', response);
        });
    },

    PandoraMusicIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("PandoraMusicIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            pandoraHandler(room, '/play/', slotValue(intent.slots.Name), response);
        });
    },

    PandoraThumbsUpIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("PandoraThumbsUpIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            pandoraHandler(room, '/thumbsup', '', response);
        });
    },

    PandoraThumbsDownIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("PandoraThumbsDownIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            pandoraHandler(room, '/thumbsdown', '', response);
        });
    },

    PlayPresetIntent: function (intent, session, response) {
        console.log("PlayPresetIntent received");
        options.path = '/preset/' + encodeURIComponent(slotValue(intent.slots.Preset).toLowerCase());
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    },

    PlaylistIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("PlaylistIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            playlistHandler(room, slotValue(intent.slots.Preset), 'playlist', response);
        });
    },

    FavoriteIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
		console.log("FavoriteIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            playlistHandler(room, slotValue(intent.slots.Preset), 'favorite', response);
        });
    },

    ChangeRoomIntent: function (intent, session, response) {
		var room = checkRoomSlot(intent);
        console.log("ChangeRoomIntent received for " + room);
        if (!options.advancedMode) {
            response.tell("This command does not work unless advanced mode is turned on");
        } else {
            changeCurrent('DefaultEcho', room, '', function() {
                genericResponse('', response);
            });
        }
    },

    ChangeServiceIntent: function (intent, session, response) {
        console.log("ChangeSERVICEIntent received");
        if (!options.advancedMode) {
            response.tell("This command does not work unless advanced mode is turned on");
        } else {
            changeCurrent('DefaultEcho', '', slotValue(intent.slots.Service), function() {
                genericResponse('', response);
            });
        }
    },

    ChangeRoomAndServiceIntent: function (intent, session, response) {
        console.log("ChangeRoomAndServiceIntent received");
        if (!options.advancedMode) {
            response.tell("This command does not work unless advanced mode is turned on");
        } else {
            changeCurrent('DefaultEcho', slotValue(intent.slots.Room), slotValue(intent.slots.Service), function() {
                genericResponse('', response);
            });
        }
    },

    ResumeAllIntent: function (intent, session, response) {
        console.log("ResumeAllIntent received");
        options.path = '/resumeAll';
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    },

    ResumeIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("ResumeIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            options.path = '/' + encodeURIComponent(room) + '/play';
            httpreq(options, function(error) {
                genericResponse(error, response);
            });
        });
    },

    PauseAllIntent: function (intent, session, response) {
        console.log("PauseAllIntent received");
        options.path = '/pauseAll';
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    },

    PauseIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("PauseIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            options.path = '/' + encodeURIComponent(room) + '/pause';
            httpreq(options, function(error) {
                genericResponse(error, response);
            });
        });
    },

    VolumeDownIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("VolumeDownIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            volumeHandler(room, response, '-10');
        });
    },

    VolumeUpIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("VolumeUpIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            volumeHandler(room, response, '+10');
        });
    },

    SetVolumeIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("SetVolumeIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            volumeHandler(room, response, slotValue(intent.slots.Percent));
        });
    },

    NextTrackIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("NextTrackIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            actOnCoordinator(options, '/next', room,  function (error, responseBodyJson) {
                genericResponse(error, response);
            });
        });
    },

    PreviousTrackIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("PreviousTrackIntent received room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            actOnCoordinator(options, '/previous', room,  function (error, responseBodyJson) {
                genericResponse(error, response);
            });
        });
    },

    WhatsPlayingIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("WhatsPlayingIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            options.path = '/' + encodeURIComponent(room) + '/state';

            httpreq(options, function (error, responseJson) {
                if (!error) {
                    responseJson = JSON.parse(responseJson);
                    var randResponse = Math.floor(Math.random() * STATE_RESPONSES.length);
                    var responseText = STATE_RESPONSES[randResponse].replace("$currentTitle", responseJson.currentTrack.title).replace("$currentArtist", responseJson.currentTrack.artist);
                    response.tell(responseText);
                } else {
                    response.tell(error.message);
                }
            });
        });
    },

    MuteIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("MuteIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            options.path = '/' + encodeURIComponent(room) + '/mute';
            httpreq(options, function(error) {
                genericResponse(error, response);
            });
        });
    },

    UnmuteIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("UnmuteIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            options.path = '/' + encodeURIComponent(room) + '/unmute';
            httpreq(options, function(error) {
                genericResponse(error, response);
            });
        });
    },

    ClearQueueIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("ClearQueueIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            actOnCoordinator(options, '/clearqueue', room,  function (error, responseBodyJson) {
                genericResponse(error, response);
            });
        });
    },

    RepeatIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("RepeatIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            toggleHandler(room, slotValue(intent.slots.Toggle), "repeat", response);
        });
    },

    ShuffleIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("ShuffleIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            toggleHandler(room, slotValue(intent.slots.Toggle), "shuffle", response);
        });
    },

    CrossfadeIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("CrossfadeIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            toggleHandler(room, slotValue(intent.slots.Toggle), "crossfade", response);
        });
    },

    UngroupIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("UngroupIntent received for room " + room);
        loadCurrentRoomAndService('DefaultEcho', room, function(room, service) {
            options.path = '/' + encodeURIComponent(room) + '/isolate';
            httpreq(options, function(error) {
                genericResponse(error, response);
            });
        });
    },

    JoinGroupIntent: function (intent, session, response) {
        console.log("JoinGroupIntent received");
        options.path = '/' + encodeURIComponent(slotValue(intent.slots.JoiningRoom)) + '/join/' +
            encodeURIComponent(slotValue(intent.slots.PlayingRoom));
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    },

    PlayInRoomIntent: function (intent, session, response) {
        var room = checkRoomSlot(intent);
        console.log("PlayInRoomIntent received for room " + room);

        if (options.defaultLinein === '' || !options.defaultLinein) {
            response.tell("This command does not work unless you set default Linein");
        }
        options.path = '/' + encodeURIComponent(room) + '/linein/' +
            encodeURIComponent(options.defaultLinein);
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    },

    LineInIntent: function (intent, session, response) {
	    var room = checkRoomSlot(intent);
        var lineIn = slotValue(intent.slots.LineIn);

	    console.log("LineInIntent received for room " + room);

        options.path = '/' + encodeURIComponent(room.value) + '/linein/' +
            encodeURIComponent(lineIn.value);
        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    }
};

function isPreset(p) {
	if (options.debug) console.log('isPreset(' + p + ')');
	return myPresets.indexOf(p) != -1;
}

/** Handles Apple Music, Spotify, Deezer, library, or presets. The default can be specified in options.js or changed if advanced mode is turned on */
function musicHandler(roomValue, service, cmdpath, name, response) {

	// >>> KSH check for preset before search
	var p = name.replace('artist:', '');
	if (isPreset(p) || (service == 'presets')) {
		if (isPreset(p)) {
            options.path = '/preset/' + encodeURIComponent(p);
        
		    httpreq(options, function(error) {
			    genericResponse(error, response);
            
		    });
        }
        else {
		    response.tell('I am too stupid to understand that');
        }
	} else if (p === 'undefined') {
		response.tell('I am too stupid to understand that');
    }
    else {
		var skillPath = '/musicsearch/' + service.toLowerCase() + cmdpath + encodeURIComponent(name);
		var msgStart = (cmdpath.startsWith('/station'))?'Started ':'Queued and started ';
		var msgEnd = (cmdpath.startsWith('/station'))?' radio':'';

		actOnCoordinator(options, skillPath, roomValue, function(error, responseBodyJson) {
			if (error) {
				response.tell(error.message);
			} else {
				response.tell(msgStart + name + msgEnd);
			}
		});
	}
}

/** Handles Apple Music - plays artist tracks or plays a radio station for the current track */
function moreMusicHandler(roomValue, service, cmdpath, response) {
    options.path = '/' + encodeURIComponent(roomValue) + '/state';

    httpreq(options, function (error, responseJson) {
        if (!error) {
            responseJson = JSON.parse(responseJson);
            console.log("Currently Playing = " + JSON.stringify(responseJson, null, 2));
            if (responseJson.currentTrack.artist !== undefined) {
                var name = responseJson.currentTrack.artist;
                if (cmdpath.startsWith('/station') && (['apple','spotify','deezer','elite'].indexOf(service) != -1)) {
                    name += ' ' + responseJson.currentTrack.title;
                }
                musicHandler(roomValue, service, cmdpath, name, response);
            } else {
                response.tell("The current artist is not identified");
            }
        } else {
            genericResponse(error, response);
        }
    });
}

/** Handles SiriusXM Radio */
function siriusXMHandler(roomValue, name, type, response) {

    var skillPath = '/siriusxm/' + encodeURIComponent(name.replace(' ','+'));

    actOnCoordinator(options, skillPath, roomValue, function(error, responseBodyJson) {
        if (error) {
            genericResponse(error, response);
        } else {
            response.tell('Sirius XM ' + type + ' ' + name + ' started');
        }
    });
}

/** Handles SiriusXM Radio */
function pandoraHandler(roomValue, cmdpath, name, response) {

    var skillPath = '/pandora' + cmdpath + ((cmdpath=='/play/')?encodeURIComponent(name):'');

    actOnCoordinator(options, skillPath, roomValue, function(error, responseBodyJson) {
        if (error) {
            response.tell(error.message);
        } else {
            if (cmdpath == '/play/') {
                response.tell('Pandora ' + name + ' started');
            } else {
                genericResponse(error, response);
            }
        }
    });
}

/** Handles playlists and favorites */
function playlistHandler(roomValue, presetValue, skillName, response) {
    var skillPath = '/' + skillName + '/' + encodeURIComponent(presetValue.toLowerCase());

    // This first action queues up the playlist / favorite, and it shouldn't say anything unless there's an error
    actOnCoordinator(options, skillPath, roomValue, function(error, responseBodyJson) {
        if (error) {
            genericResponse(error, response);
        }
    });

    // The 2nd action actually plays the playlist / favorite
    actOnCoordinator(options, '/play', roomValue, function(error, responseBodyJson) {
        genericResponse(error, response, "Queued and started " + presetValue);
    });
}

/** Handles all skills of the form /roomname/toggle/[on,off] */
function toggleHandler(roomValue, toggleValue, skillName, response) {
    if (!toggleValue || (toggleValue != 'on' && toggleValue != 'off')) {
        response.tell("I need to know if I should turn  " + skillName + " on or off. Example: Alexa, tell Sonos to turn " + skillName + " on");
        return;
    }

    options.path = '/' + encodeURIComponent(roomValue) + '/' + skillName + '/' + toggleValue;

    httpreq(options, function(error) {
        if (!error) {
            response.tell("Turned " + skillName + " " + toggleValue + " in " + roomValue);
        } else {
            response.tell(error.message);
        }
    });
}

/** Handles up, down, & absolute volume for either an individual room or an entire group */
function volumeHandler(roomValue, response, volume) {
    var roomAndGroup = parseRoomAndGroup(roomValue);

    if (!roomAndGroup.room) {
        response.tell("Please specify a room. For example, turn the volume down in the KITCHEN");
        return;
    }

    if (!roomAndGroup.group) {
        options.path = '/' + encodeURIComponent(roomAndGroup.room) + '/volume/' + volume;

        httpreq(options, function(error) {
            genericResponse(error, response);
        });
    }

    else {
        actOnCoordinator(options, '/groupVolume/' + volume, roomAndGroup.room,  function (error, responseBodyJson) {
            genericResponse(error, response);
        });
    }
}

/* Given a string roomArgument that either looks like "my room" or "my room group",
 * returns an object with two members:
 *   obj.group: true if roomArgument ends with "group", false otherwise.
 *   obj.room: if roomArgument is "my room group", returns "my room"
 */
function parseRoomAndGroup(roomArgument) {
    var roomAndGroupParsed = {};
    roomAndGroupParsed.group = false;
    roomAndGroupParsed.room = false;

    if (!roomArgument) {
        return roomAndGroupParsed;
    }

    var groupIndex = roomArgument.indexOf("group");

    if (groupIndex && (groupIndex + 4 == (roomArgument.length - 1)) && roomArgument.length >= 7) {
        roomAndGroupParsed.group = true;
        roomAndGroupParsed.room = roomArgument.substr(0, groupIndex - 1);
    } else {
        roomAndGroupParsed.room = roomArgument;
    }

    return roomAndGroupParsed;
}

function isBlank(val) {
    return ((val === undefined) || (val === null) || (val === ''));
}

function changeCurrent(echoId, room, service, OnCompleteFun) {
    var updateExpression = '';
    var values = {};

    if (options.advancedMode) {
	    room = findAlias(room); // >>> KSH
	    if (!isBlank(room) && !isBlank(service)) {
	        updateExpression = "set currentRoom=:r, currentMusicService=:s";
	        values = {":r":room, ":s":service};
	    } else if (!isBlank(room)) {
	        updateExpression = "set currentRoom=:r";
	        values = {":r":room};
	    } else if (!isBlank(service)) {
	        updateExpression = "set currentMusicService=:s";
	        values = {":s":service};
	    }
	    if (updateExpression !== '') {
	        var docClient = new AWS.DynamoDB.DocumentClient();
	        var params = {
		        TableName: "echo-sonos",
			    Key: {
			        "echoid": echoId
			    },
			    UpdateExpression: updateExpression,
			    ExpressionAttributeValues:values,
			    ReturnValues:"UPDATED_NEW"
	        };

	        console.log("Updating current defaults...");
	        docClient.update(params, function(err, data) {
		        if (err) {
		            console.error("Unable to update current defaults. Error JSON:", JSON.stringify(err, null, 2));
		        } else {
		            console.log("Update of current defaults succeeded:", JSON.stringify(data, null, 2));
		        }
		        OnCompleteFun();
	        });
	    }
    } else {
	    console.error("Unable to change defaults when not in Advanced Mode");
    }
}

function loadCurrentRoomAndService(echoId, room, OnCompleteFun) {
	var service = '';

	// >>> KSH check if room or service placeholder and default if so
	function checkDefaults() {
		if (isBlank(room) || (room == 'room')) {
			room = defaultRoom;
		}
	}

	// >>> KSH move functions to root of container
	function addCurrent(OnCompleteFun) {
		console.log("Open DynamoDB for write");
		checkDefaults();
		var docClient = new AWS.DynamoDB.DocumentClient();
		var params = {
			TableName: "echo-sonos",
			Item:{
				"echoid": echoId,
				"currentRoom": room,
				"currentMusicService": service
			}
		};
		console.log("Adding current settings record");
		docClient.put(params, function(err, data) {
			console.log("err=" + JSON.stringify(err, null, 2));
			console.log("data=" + JSON.stringify(data, null, 2));
			if (err) {
				console.error("Unable to add default. Error JSON:", JSON.stringify(err, null, 2));
			} else {
				OnCompleteFun(room, service);
			}
		});
	}

	function readCurrent(OnCompleteFun) {
		console.log("Open DynamoDB for read");
		var newRoom = '';
		var newService = '';
		var docClient = new AWS.DynamoDB.DocumentClient();
		var params = {
			TableName: "echo-sonos",
			Key: {
				"echoid": echoId
			}
		};

		console.log("Reading current settings");
		docClient.get(params, function(err, data) {
			//console.log("err=" + JSON.stringify(err, null, 2));
			//console.log("data=" + JSON.stringify(data, null, 2));
			if (err || (data.Item === undefined)) {
				addCurrent(OnCompleteFun);
			} else {
				if (isBlank(room)) {
					room = data.Item.currentRoom;
				} else if (room != data.Item.currentRoom) {
					newRoom = room;
				}
				if (isBlank(service)) {
					service = data.Item.currentMusicService;
				} else if (service != data.Item.currentMusicService) {
					newService = service;
				}
				console.log("room=" + room +" newRoom=" + newRoom + "  service=" + service + " newService=" + newService);
				if (isBlank(newRoom) && isBlank(newService)) {
					OnCompleteFun(room, service);
				} else {
					changeCurrent(echoId, newRoom, newService, function() {
						OnCompleteFun(room, service);
					});
				}
			}
		});
	}

	room = findAlias(room);  // >>> KSH 
	if (isBlank(service) || (service == 'service')) {
		service = defaultMusicService;
	}
	console.log("Advanced Mode = " + options.advancedMode);
	if (options.advancedMode) {
		AWS.config.update({
			region: process.env.AWS_REGION,
			endpoint: "https://dynamodb." + process.env.AWS_REGION + ".amazonaws.com"
		});
		var dynamodb = new AWS.DynamoDB();

		dynamodb.listTables(function(err, data) {
			if (err) {
				console.log(err, err.stack);
			} else if ((data.TableNames.length === 0) || (data.TableNames.indexOf("echo-sonos") == -1))  {
				var params = {
					TableName : "echo-sonos",
					KeySchema: [
						{ AttributeName: "echoid", KeyType: "HASH"}  //Partition key
					],
					AttributeDefinitions: [
						{ AttributeName: "echoid", AttributeType: "S" }
					],
					ProvisionedThroughput: {
						ReadCapacityUnits: 1,
						WriteCapacityUnits: 1
					}
				};

				console.log("Create echo-sonos table");
				dynamodb.createTable(params, function(err, data) {
					if (err) {
						console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
					} else {
						params = {
							TableName : "echo-sonos"
						};

						dynamodb.waitFor('tableExists', params, function(err, data) {
							if (err) {
								console.error("Unable to wait for table table. Error JSON:", JSON.stringify(err, null, 2));
							} else {
								addCurrent(OnCompleteFun);
							}
						});
					}
				});
			} else if (isBlank(service) || isBlank(room)) {
				readCurrent(OnCompleteFun);
			}
			else {
				addCurrent(OnCompleteFun);
			}
		});
	} else {
		checkDefaults();
		OnCompleteFun(room, service);
	}
}

function httpreq(options, responseCallback) {
    if (options.useSQS) {
        sqsServer.purgeQueue({QueueUrl:serverUrl}, function(err, data) {
            console.log("sending SQS " + options.path);
            sqsClient.sendMessage({
                MessageBody: options.path,
                QueueUrl: clientUrl
            }, function(err, data) {
                if (err) {
                    console.log('ERR', err);
                    responseCallback(err);
                } else {
                    console.log(data);
                    sqsServer.receiveMessage({
                        QueueUrl: serverUrl,
                        MaxNumberOfMessages: 1, // how many messages do we wanna retrieve?
                        VisibilityTimeout: 60,  // seconds - how long we want a lock on this job
                        WaitTimeSeconds: 20     // seconds - how long should we wait for a message?
                    }, function(err, data) {
                        var message = data.Messages[0];
                        var response = message.Body;
                        if (!err) {
                            sqsServer.deleteMessage({
                                QueueUrl: serverUrl,
                                ReceiptHandle: message.ReceiptHandle
                            }, function(err, data) {
                                responseCallback(undefined, response);
                                if (err) {
                                    console.log('ERR', err);
                                }
                            });
                        } else {
                            console.log('ERR', err);
                            responseCallback(err);
                        }
                    });
                }

            });
        });
    } else {
        var transport = options.useHttps ? https : http;

        console.log("Sending " + (options.useHttps ? "HTTPS" : "HTTP" ) + " request to: " + options.path);

        var req = transport.request(options, function(httpResponse) {
            var body = '';

            httpResponse.on('data', function(data) {
                body += data;
            });

            httpResponse.on('end', function() {
                responseCallback(undefined, body);
            });
        });

        req.on('error', function(e) {
            responseCallback(e);
        });

        req.end();
    }
}

// 1) grab /zones and find the coordinator for the room being asked for
// 2) perform an action on that coordinator
function actOnCoordinator(options, actionPath, room, onCompleteFun) {
    options.path = '/zones';
    console.log("getting zones...");

    var handleZonesResponse = function (error, responseJson) {
        if (!error) {
            responseJson = JSON.parse(responseJson);
            var coordinatorRoomName = findCoordinatorForRoom(responseJson, room);

            options.path = '/' + encodeURIComponent(coordinatorRoomName) + actionPath;
            console.log(options.path);
            httpreq(options, onCompleteFun);
        } else {
            onCompleteFun(error);
        }
    };
    httpreq(options, handleZonesResponse);
}

function genericResponse(error, response, success) {
    if (!error) {
        if (!success) {
            response.tell("OK");
        } else {
            response.tell(success);
        }
    } else {
        response.tell("The Lambda service encountered an error: " + error.message);
    }
}

// Given a room name, returns the name of the coordinator for that room
function findCoordinatorForRoom(responseJson, room) {
    console.log("finding coordinator for room: " + room);

    for (var i = 0; i < responseJson.length; i++) {
        var zone = responseJson[i];

        for (var j = 0; j < zone.members.length; j++) {
            var member = zone.members[j];

            if ((member.roomName !== undefined) && (member.roomName.toLowerCase() == room.toLowerCase())) {
                return zone.coordinator.roomName;
            }
        }
    }
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the EchoSonos skill.
    var echoSonos = new EchoSonos();
    if (options.useSQS) {
        var region = process.env.AWS_REGION;
        var arn = context.invokedFunctionArn;
        var actLoc = arn.indexOf(region) + region.length + 1;
        var accountId = arn.substring(actLoc,arn.indexOf(':',actLoc));
        var baseSqsUrl = "https://sqs." + region + ".amazonaws.com/" + accountId;
        serverUrl = baseSqsUrl + "/SQS-Proxy-Server";
        clientUrl = baseSqsUrl + "/SQS-Proxy-Client";
        sqsServer = new AWS.SQS({region : region});
        sqsClient = new AWS.SQS({region : region});
    }
    echoSonos.execute(event, context);
};

