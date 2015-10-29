;
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory()
  } else if (typeof define === 'function' && define.amd) {
    define([], factory)
  } else {
    root.cssvid = factory()
  }
}(this, function () {

  function loadImages (imageList, callback) {
    var imagesToLoad = Object.keys(imageList).length
    for (var key in imageList) {
      var image = imageList[key]
      image.img = new Image
      image.img.onload = checkCallback.bind(image)
      image.img.onerror = error.bind(this, 'Error loading image: ' + key + ' (' + image.url + ')')
      image.img.src = image.url
    }

    function checkCallback () {
      this.rows = Math.ceil(this.frames / this.cols)
      if (--imagesToLoad === 0) {
        callback()
      }
    }
  }

  function error (msg) {
    console.error ? console.error(msg) : console.log(msg)
  }

  var now = typeof Date.now === 'function' ? Date.now : function () {
    return (new Date).getTime()
  }

  function cssVid (opts) {
    var root = typeof opts.root === 'string' ? document.querySelector(opts.root) : opts.root
    if (!root) return error('No root element found.')
    if (!opts.videos || opts.videos.length === 0) return error('Needs list of videos.')

    var defaultOpts = {
      width: root.clientWidth,
      height: root.clientHeight,
      autoPlay: true
    }

    var defaultVideoOpts = {
      fps: 25
    }

    for (var option in defaultOpts) {
      if (defaultOpts.hasOwnProperty(option) && !opts[option]) {
        opts[option] = defaultOpts[option]
      }
    }

    var videos = opts.videos

    for (var videoKey in videos) {
      var video = videos[videoKey]
      if (!video.url || !video.frames || !video.cols) {
        return error('Videos need {url, frames, cols}.')
      }
      for (option in defaultVideoOpts) {
        if (defaultVideoOpts.hasOwnProperty(option) && !video[option]) {
          video[option] = defaultVideoOpts[option]
        }
      }
    }

    var playContainer = document.createElement('div')
    playContainer.style.cssText = 'width:' + opts.width + 'px;height:' + opts.height + 'px;overflow:hidden'
    root.appendChild(playContainer)

    function notloaded () {
      error('Not loaded yet.')
    }

    var controls = {
      play: notloaded,
      pause: notloaded,
      isPlaying: notloaded
    }

    loadImages(videos, startPlayer)

    var transform = (function () {
      var possibleTransforms = ['transform', 'WebkitTransform', 'MozTransform', 'msTransform', 'OTransform']
      var img = new Image
      for (var i = 0; i < possibleTransforms.length; i++) {
        var p = possibleTransforms[i]
        if (typeof img.style[p] !== 'undefined') return p
      }
    }())

    function drawFrame (vid, frame) {
      var x = -(frame % vid.cols) * opts.width
      var y = -Math.floor(frame / vid.cols) * opts.height
      vid.img.style[transform] = 'translate3d(' + x + 'px,' + y + 'px,0)'
    }

    function startPlayer () {
      var isPlaying = !!opts.autoPlay
      var reverse
      var currVid
      var delay
      var rafId
      var currFrame = 0
      var startTime = 0

      function play () {
        if (!isPlaying) return
        requestAnimationFrame(play)
        var newFrame = Math.floor((now() - startTime) / delay)
        newFrame %= currVid.frames
        if (newFrame !== currFrame) {
          currFrame = newFrame
          drawFrame(currVid, reverse ? currVid.frames - currFrame : currFrame)
        }
      }

      controls.play = function (key, playReverse) {
        if (typeof key === 'undefined' && currVid) {
          rafId = requestAnimationFrame(play)
          isPlaying = true
          return
        }
        if (!videos[key]) return error('Video not found: ' + key)
        if (currVid !== videos[key]) {
          currFrame = 0
          startTime = now()
        }
        currVid = videos[key]
        reverse = !!playReverse

        delay = 1000 / currVid.fps
        isPlaying = true
        playContainer.innerHTML = ''
        playContainer.appendChild(currVid.img)
        currVid.img.width = currVid.cols * opts.width
        currVid.img.height = currVid.rows * opts.height
        rafId = requestAnimationFrame(play)
      }

      controls.pause = function () {
        isPlaying = false
        cancelAnimationFrame(rafId)
      }

      controls.isPlaying = function () {
        return isPlaying
      }

      if (isPlaying) controls.play(Object.keys(videos)[0], false)
    }

    return controls
  }

  return cssVid
}))