;
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.cssvid = factory();
  }
}(this, function () {


  function loadImages(imageList, callback) {
    var imagesToLoad = Object.keys(imageList).length;
    for (var key in imageList) {
      var image = imageList[key];
      image.img = new Image();
      image.img.onload = checkCallback.bind(image);
      image.img.onerror = error.bind(this, 'Error loading image: ' + key + ' (' + image.url + ')');
      image.img.src = image.url;
    }

    function checkCallback() {
      this.rows = Math.ceil(this.frames / this.cols);
      if (--imagesToLoad === 0) {
        callback();
      }
    }
  }


  function error(msg) {
    console.error ? console.error(msg) : console.log(msg);
  }


  function now() {
    return (new Date).getTime();
  }

  function cssVid(opts) {
    var root = typeof opts.root === 'object' ? opts.root : document.querySelector(opts.root);
    if (!root) return error('No root element found.');
    if (!opts.videos || opts.videos.length === 0) return error('Needs list of videos.');

    var defaultOpts = {
      width: root.clientWidth,
      height: root.clientHeight,
      autoPlay: true
    };

    var defaultVideoOpts = {
      fps: 25
    };

    for (var option in defaultOpts) {
      if (defaultOpts.hasOwnProperty(option) && !opts[option]) {
        opts[option] = defaultOpts[option];
      }
    }

    var videos = opts.videos;

    for (var videoKey in videos) {
      var video = videos[videoKey];
      if (!video.url || !video.frames || !video.cols) {
        return error('Videos need {url, frames, cols}.');
      }
      for (option in defaultVideoOpts) {
        if (defaultVideoOpts.hasOwnProperty(option) && !video[option]) {
          video[option] = defaultVideoOpts[option];
        }
      }
    }

    var controls = {
      play: function () {
        error('Not loaded yet.');
      },
      pause: function () {
        error('Not loaded yet.');
      },
      isPlaying: function () {
        error('Not loaded yet.');
      }
    };

    loadImages(videos, startPlayer);

    function drawFrame(root, vid, frame) {
      var x = -(frame % vid.cols) * opts.width;
      var y = -Math.floor(frame / vid.cols) * opts.height;
      root.style.backgroundPosition = x + 'px ' + y + 'px';
    }

    function startPlayer() {
      var isPlaying = !!opts.autoPlay;
      var reverse;
      var currVid;
      var delay;
      var rafId;
      var currFrame = 0;
      var startTime = 0;


      function play() {
        requestAnimationFrame(play);
        var newFrame = Math.floor((now() - startTime) / delay);
        newFrame %= currVid.frames;
        if (newFrame !== currFrame) {
          currFrame = newFrame;
          drawFrame(root, currVid, currFrame);
        }
      }

      controls.play = function (key, playReverse) {
        if (!videos[key]) return error('Video not found: ' + key);
        if (currVid !== videos[key]) {
          currFrame = 0;
          startTime = now();
        }
        currVid = videos[key];
        reverse = !!playReverse;

        delay = 1000 / currVid.fps;
        isPlaying = true;
        root.style.backgroundImage = 'url(' + currVid.url + ')';
        root.style.backgroundSize = (currVid.cols * opts.width) + 'px ' + (currVid.rows * opts.height) + 'px';
        rafId = requestAnimationFrame(play);
      };
      controls.pause = function () {
        isPlaying = false;
        cancelAnimationFrame(rafId);
      };
      controls.isPlaying = function () {
        return isPlaying;
      };
      if (isPlaying) controls.play(Object.keys(videos)[0], false)

    }


    root.style.cssText = 'display:block;width:' + opts.width + 'px;height:' + opts.height + 'px;';

    return controls;
  }

  return cssVid;


}))
;