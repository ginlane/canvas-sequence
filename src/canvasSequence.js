class CanvasSequence {

    /**
     * @see ctor
     */
    constructor(
        canvasOrOpts,
        sequencePath,
        sequenceStart,
        sequenceEnd,
        fileType,
        loadCallback,
        onDraw,
        mode = CanvasSequence.PlayMode.SCROLL,
        fps = 24,
        playOnce = false
    ) {
        if (typeof canvasOrOpts === 'object') {
            // first param is an object of options
            return this.ctor(canvasOrOpts);
        }

        this.ctor({
            canvas: canvasOrOpts,
            sequencePath,
            sequenceStart,
            sequenceEnd,
            fileType,
            loadCallback,
            onDraw,
            mode,
            fps,
            playOnce
        });
    }
    /**
     * @param opts.fileType {String} - the file extension you want to use (ex.
     * 'jpg')
     * @param opts.loadCallback {function} - a callback to be notified when all
     * images are loaded and ready to use
     * @param opts.onDraw {function(previousFrame:Int, currentFrame:Int)`} - a
     * callback to be notified when the drawn frame changes
     * @param [opts.mode] {String} - Defaults to `'SCROLL'`. Method to use for
     * controlling playback of the sequence
     * See `CanvasSequence.PlayMode` for full list of supported play modes
     * @param opts.fps {Number} - Defaults to `24`. Frames per second to use for
     * @param opts.isPaused {Number} - Defaults to `false`. `true` to initialize
     * with paused auto playback state.
     * @param opts.playOnce {Boolean} - Defaults to `false`. a flag to make the
     * sequence play only once
     */
    ctor({
      canvas,
      sequencePath,
      sequenceStart,
      sequenceEnd,
      fileType,
      loadCallback,
      onDraw,
      mode = CanvasSequence.PlayMode.SCROLL,
      fps = 24,
      isPaused = false,
      playOnce = false
    }) {
        this.sequence = [];

        this.canvas = document.getElementById(canvas);

        if(this.canvas !== null) {
            this.context = this.canvas.getContext('2d');
        } else {
            console.log("Please ensure the lib is loaded when DOM is loaded.")
        }

        this.sequencePath = sequencePath;
        this.sequenceStart = sequenceStart;
        this.sequenceEnd = sequenceEnd;
        this.sequenceLength = this.sequenceEnd - this.sequenceStart;

        this.fileType = fileType || '.png';

        this.progress = 0;
        this.scrollHeight = document.body.scrollHeight;
        this.loadCallback = loadCallback || function() {};
        this.onDraw = typeof onDraw === 'function' ? onDraw : null;
        this.mode = mode;
        this.isPaused = isPaused;
        this.firstLoopEnd = false;
        this.fps = fps;
        this.playOnce = playOnce;

        this.loadSequence();
    }

    pause() {
        this.isPaused = true;
    }

    play() {
        if (!this.isPaused) {
            return;
        }

        // reset startTime so that it is relative to the current replay time
        const now = +new Date();
        this.startTime = now - (this.currentFrame / this.fps * 1000)
        this.isPaused = false;
        this.firstLoopEnd = false;
    }

    addLeadingZeros(n) {
        var length = this.sequenceEnd.toString().length;
        var str = (n > 0 ? n : -n) + "";
        var zeros = "";
        for (var i = length - str.length; i > 0; i--)
            zeros += "0";
        zeros += str;
        return n >= 0 ? zeros : "-" + zeros;
    }

    loadSequence() {
        var promises = [];

        for (var i = this.sequenceStart; i <= this.sequenceEnd; i++) {
            var frameNumber = this.addLeadingZeros(i);
            var filename = this.sequencePath + frameNumber + this.fileType;
            var img = new Image;
            img.src = filename;

            var promise = new Promise(function(resolve, reject) {
                img.onload = resolve;
                img.onerror = reject;
            });

            promises.push(promise);

            this.sequence.push(img);
        }

        Promise.all(promises).then(() => {
            this.renderFrame();
            this.loadCallback();
        }).catch((e) => {
            console.log(e);
        });
    }

    getNextFrameNumber() {
      return Math.min(
        this.sequenceLength,
        Math.max(
          0,
          Math.round(this.progress * this.sequenceLength)
        )
      );
    }

    syncScrollPosition() {
        const scrollOffset =
            window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        return scrollOffset / this.scrollHeight;
    }

    syncAutoPlayPosition() {
        const now = +new Date();
        if (!this.startTime) {
            this.startTime = now;
        }

        if (!this.isPaused) {
            const sequenceDuration = this.sequenceLength / this.fps;
            // Modulo to loop
            const playOffset = ((now - this.startTime) / 1000) % sequenceDuration;
            return playOffset / sequenceDuration;
        }

        return this.progress;
    }

    syncPlayPosition() {
        switch (this.mode) {
            case CanvasSequence.PlayMode.AUTO: {
                this.progress = this.syncAutoPlayPosition();
                break;
            }

            case CanvasSequence.PlayMode.MANUAL:
                // Do Nothing
                break;

            case CanvasSequence.PlayMode.SCROLL:
            default:
                this.progress = this.syncScrollPosition();
        }
    }

    setProgress(progress) {
        this.progress = progress;
        if (this.mode === CanvasSequence.PlayMode.MANUAL) {
            requestAnimationFrame(this.renderFrame.bind(this));
        }
    }

    drawImage(frame) {
        if(frame >= 0 && frame < this.sequence.length) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if(this.sequence[frame].complete) {
                this.context.drawImage(this.sequence[frame], 0, 0, this.canvas.width, this.canvas.height);
            } else {
                console.log("The current frame has not been loaded. Please ensure all images are loaded before updating the canvas.")
            }
        }
    }

    renderFrame() {
        this.syncPlayPosition();
        if ( this.playOnce && this.firstLoopEnd ) {
            this.pause();
        }

        if (this.mode !== CanvasSequence.PlayMode.MANUAL) {
            requestAnimationFrame(this.renderFrame.bind(this));
        }

        this.previousFrame = this.currentFrame;
        this.currentFrame = this.getNextFrameNumber();

        if ((this.currentFrame != this.previousFrame) || this.firstLoad) {
            this.drawImage(this.currentFrame);
            this.onDraw && this.onDraw.call(null, this.previousFrame, this.currentFrame);
        }

        if ( this.getNextFrameNumber() === this.sequenceEnd - 1 ) {
            this.firstLoopEnd = true;
        }

        this.firstLoad = false;
    }

}

/**
 * Supported playback control options
 */
CanvasSequence.PlayMode = {
    // SCROLL - (Default) progress is bound to scroll position relative to height
    // of document
    SCROLL: 'SCROLL',

    // AUTO - not bound to scroll, plays like a regular video
    AUTO  : 'AUTO',

    // MANUAL - playback management is left to the owner. Frame is updatable with
    // `.setProgress` method.
    MANUAL: 'MANUAL'
}

if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function() {
        return window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame || // comment out if FF4 is slow (it caps framerate at ~30fps: https://bugzilla.mozilla.org/show_bug.cgi?id=630127)
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();
}

if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
    define(function() {
        return CanvasSequence;
    });
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasSequence;
} else {
    window.CanvasSequence = CanvasSequence;
}
