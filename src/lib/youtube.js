var prefs   = require("sdk/simple-prefs").prefs,
    _prefs  = require("./misc").prefs,
    Request = require("sdk/request").Request,
    {Cc, Ci, Cu}  = require('chrome');



function _getInfo(videoID, callback, pointer) {
  const INFO_URL = 'http://www.youtube.com/get_video_info?hl=en_US&el=detailpage&video_id=';
  const KEYS_TO_SPLIT = ['keywords', 'fmt_list', 'fexp', 'watermark', 'ad_channel_code_overlay'];
  //http://en.wikipedia.org/wiki/YouTube
  const FORMATS = {
    '5': {
      container: 'flv',
      resolution: '240p',
      encoding: 'Sorenson H.283',
      profile: null,
      bitrate: '0.25',
      audioEncoding: 'mp3',
      audioBitrate: 64
    },
    '6': {
      container: 'flv',
      resolution: '270p',
      encoding: 'Sorenson H.263',
      profile: null,
      bitrate: '0.8',
      audioEncoding: 'mp3',
      audioBitrate: 64
    },
    '13': {
      container: '3gp',
      resolution: null,
      encoding: 'MPEG-4 Visual',
      profile: null,
      bitrate: '0.5',
      audioEncoding: 'aac',
      audioBitrate: null
    },
    '17': {
      container: '3gp',
      resolution: '144p',
      encoding: 'MPEG-4 Visual',
      profile: 'simple',
      bitrate: '0.05',
      audioEncoding: 'aac',
      audioBitrate: 24
    },
    '18': {
      container: 'mp4',
      resolution: '360p',
      encoding: 'H.264',
      profile: 'baseline',
      bitrate: '0.5',
      audioEncoding: 'aac',
      audioBitrate: 96
    },
    '22': {
      container: 'mp4',
      resolution: '720p',
      encoding: 'H.264',
      profile: 'high',
      bitrate: '2-2.9',
      audioEncoding: 'aac',
      audioBitrate: 152
    },
    '34': {
      container: 'flv',
      resolution: '360p',
      encoding: 'H.264',
      profile: 'main',
      bitrate: '0.5',
      audioEncoding: 'aac',
      audioBitrate: 128
    },
    '35': {
      container: 'flv',
      resolution: '280p',
      encoding: 'H.264',
      profile: 'main',
      bitrate: '0.8-1',
      audioEncoding: 'aac',
      audioBitrate: 128
    },
    '36': {
      container: '3gp',
      resolution: '240p',
      encoding: 'MPEG-4 Visual',
      profile: 'simple',
      bitrate: '0.17',
      audioEncoding: 'aac',
      audioBitrate: 38
    },
    '37': {
      container: 'mp4',
      resolution: '1080p',
      encoding: 'H.264',
      profile: 'high',
      bitrate: '3-4.3',
      audioEncoding: 'aac',
      audioBitrate: 152
    },
    '38': {
      container: 'mp4',
      resolution: '3072p',
      encoding: 'H.264',
      profile: 'high',
      bitrate: '3.5-5',
      audioEncoding: 'aac',
      audioBitrate: 152
    },
    '43': {
      container: 'webm',
      resolution: '360p',
      encoding: 'VP8',
      profile: null,
      bitrate: '0.5',
      audioEncoding: 'vorbis',
      audioBitrate: 128
    },
    '44': {
      container: 'webm',
      resolution: '480p',
      encoding: 'VP8',
      profile: null,
      bitrate: '1',
      audioEncoding: 'vorbis',
      audioBitrate: 128
    },
    '45': {
      container: 'webm',
      resolution: '720p',
      encoding: 'VP8',
      profile: null,
      bitrate: '2',
      audioEncoding: 'vorbis',
      audioBitrate: 192
    },
    '46': {
      container: 'webm',
      resolution: '1080p',
      encoding: 'vp8',
      profile: null,
      bitrate: null,
      audioEncoding: 'vorbis',
      audioBitrate: 192
    },
    '82': {
      container: 'mp4',
      resolution: '360p',
      encoding: 'H.264',
      profile: '3d',
      bitrate: '0.5',
      audioEncoding: 'aac',
      audioBitrate: 96
    },
    '83': {
      container: 'mp4',
      resolution: '240p',
      encoding: 'H.264',
      profile: '3d',
      bitrate: '0.5',
      audioEncoding: 'aac',
      audioBitrate: 96
    },
    '84': {
      container: 'mp4',
      resolution: '720p',
      encoding: 'H.264',
      profile: '3d',
      bitrate: '2-2.9',
      audioEncoding: 'aac',
      audioBitrate: 152
    },
    '85': {
      container: 'mp4',
      resolution: '520p',
      encoding: 'H.264',
      profile: '3d',
      bitrate: '2-2.9',
      audioEncoding: 'aac',
      audioBitrate: 152
    },
    '100': {
      container: 'webm',
      resolution: '360p',
      encoding: 'VP8',
      profile: '3d',
      bitrate: null,
      audioEncoding: 'vorbis',
      audioBitrate: 128
    },
    '101': {
      container: 'webm',
      resolution: '360p',
      encoding: 'VP8',
      profile: '3d',
      bitrate: null,
      audioEncoding: 'vorbis',
      audioBitrate: 192
    },
    '102': {
      container: 'webm',
      resolution: '720p',
      encoding: 'VP8',
      profile: '3d',
      bitrate: null,
      audioEncoding: 'vorbis',
      audioBitrate: 192
    }
  };

  function quary(str) {
    var temp = {};
    var vars = str.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (pair[0] == "title") { //Issue #4, title problem
        temp[pair[0]] = decodeURIComponent(pair[1]).replace(/\+/g, " ");
      } else {
        temp[pair[0]] = unescape(pair[1]);
      }
    }
    return temp;
  }
  //Fetch data

  function parser(info) {
    //Clean keys
    KEYS_TO_SPLIT.forEach(function (key) {
      if (!info[key]) return;
      info[key] = info[key].split(',').filter(function (v) {
        return v !== '';
      });
    });
    // convert some strings to javascript numbers and booleans
    for (var i in info) {
      var val = info[i],
        intVal = parseInt(val, 10),
        floatVal = parseFloat(val, 10);
      if (intVal.toString() === val) {
        info[i] = intVal;
      } 
      else if (floatVal.toString() === val) {
        info[i] = floatVal;
      } 
      else if (val === 'True') {
        info[i] = true;
      } 
      else if (val === 'False') {
        info[i] = false;
      }
    }
    for (var i in info.fmt_list) {
      info.fmt_list[i] = info.fmt_list[i].split('/');
    }
    info.formats = (function () {
      videoFormats = info.url_encoded_fmt_stream_map;

      // parse the formats map
      var sep1 = '%2C',
        sep2 = '%26',
        sep3 = '%3D';
      if (videoFormats.indexOf(',') > -1) {
        sep1 = ',';
        sep2 = (videoFormats.indexOf('&') > -1) ? '&' : '\\u0026';
        sep3 = '=';
      }

      var objs = new Array();
      var videoFormatsGroup = videoFormats.split(sep1);
      for (var i = 0; i < videoFormatsGroup.length; i++) {
        var videoFormatsElem = videoFormatsGroup[i].split(sep2);
        var videoFormatsPair = {};
        for (var j = 0; j < videoFormatsElem.length; j++) {
          var pair = videoFormatsElem[j].split(sep3);
          if (pair.length == 2) {
            videoFormatsPair[pair[0]] = pair[1];
          }
        }
        if (videoFormatsPair['url'] == null) continue;
        url = unescape(unescape(videoFormatsPair['url'])).replace(/\\\//g, '/').replace(/\\u0026/g, '&');
        if (videoFormatsPair['itag'] == null) continue;
        itag = videoFormatsPair['itag'];
        if (videoFormatsPair['sig']) {
          videoFormatsPair['url'] = url + '&signature=' + videoFormatsPair['sig'];
        } 
        else if (videoFormatsPair['s']) {
          var sig = videoFormatsPair['s'];
          var sandbox = new Cu.Sandbox("http://www.add0n.com/");
          var decoder = Cu.evalInSandbox(_prefs.getCharPref("decoder_function"), sandbox);
          videoFormatsPair.url = decoder(url, sig);
        }
        var format = FORMATS[videoFormatsPair.itag];
        if (!format) {
          err = new Error('No such format for itag ' + data.itag + ' found');
        }
        for (var j in format) {
          videoFormatsPair[j] = format[j]
        }

        objs.push(videoFormatsPair);
      }

      return objs;
    })();
    delete info.url_encoded_fmt_stream_map;
    info.video_verticals = (info.video_verticals ? info.video_verticals : "")
      .slice(1, -1)
      .split(',')
      .filter(function (val) {
        return val !== '';
      });
    for (var i in info.video_verticals) {
      info.video_verticals[i] = parseInt(info.video_verticals[i], 10)
    }

    if (callback) callback.apply(pointer, [info]);
  }

  Request({
    url: INFO_URL + videoID,
    onComplete: function (response) {
      if (response.status != 200) throw 'Error: Cannot connect to Youtube server.';

      var info = quary(response.text);
      if (response.text.indexOf("use_cipher_signature=True") != -1) {
        Request({
          url: "http://www.youtube.com/watch?v=" + videoID,
          onComplete: function (response) {
            if (response.status != 200) throw 'Error: Cannot connect to Youtube server.';

            var tmp = /url\_encoded\_fmt\_stream\_map\"\:\ \"([^\"]*)/.exec(response.text);
            if (!tmp || !tmp.length) {
              throw 'Error: Cannot detect url_encoded_fmt_stream_map from HTML file.';
            } 
            else {
              info.url_encoded_fmt_stream_map = tmp[1];
              parser(info);
            }
          }
        }).get();
      } 
      else {
        parser(info);
      }
    }
  }).get();
}
//Do not localize
var getFormat = function (value) {
  switch (value) {
  case 0:
    return "flv";
  case 1:
    return "3gp";
  case 2:
    return "mp4";
  case 3:
    return "webm";
  }
}
//Do not localize
var getQuality = function (value) {
  switch (value) {
  case 4:
    return "small";
  case 3:
    return "medium";
  case 2:
    return "high";
  case 1:
    return "hd720";
  case 0:
    return "hd1080";
  }
}

var getLink = function (videoID, fIndex, callback, pointer) {
  try {
    _getInfo(videoID, function (info) {
      var quality = prefs.quality;
      if (!fIndex) {
        //format is already sorted high to low
        var tmp = info.formats.filter(function (a) {
          return a.container == getFormat(prefs.extension)
        });
        if (prefs.doExtract && getFormat(prefs.extension) == "flv") {
          var tmp2 = tmp.filter(function (a) {
            return a.audioEncoding == "aac"
          });
          if (tmp2.length) {
            tmp = tmp2;
          }
        }
        tmp.filter(function (a) {});
        var detected;
        var qualityValue = prefs.quality;
        while (tmp.length && !detected && qualityValue > -1) {
          var b = tmp.filter(function (a) {
            if (a.quality == getQuality(qualityValue))
              return true;
            else
              return false
          });
          if (b.length) detected = b[0];
          qualityValue -= 1;
        }
        if (!detected && tmp.length) detected = tmp[0]
        if (!detected) detected = info.formats[0]; //Get highest quality
      } 
      else {
        detected = info.formats[fIndex];
      }
      if (!detected && tmp.length) detected = tmp[0];
      if (!detected) detected = info.formats[0]; //Get highest quality

      if (callback) callback.apply(pointer, [detected, info.title, info.author.replace(/\+/g, " "), null]);
    });
  } catch (e) {
    if (callback) callback.apply(pointer, [null, null, e]);
  }
}
exports.getLink = getLink;

var getInfo = function (videoID, callback, pointer) {
  try {
    _getInfo(videoID, function (info) {
      if (callback) callback.apply(pointer, [info, null]);
    });
  } catch (e) {
    if (callback) callback.apply(pointer, [null, e]);
  }
}
exports.getInfo = getInfo;