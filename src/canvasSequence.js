class CanvasSequence {

    /**
     * @see ctor
     */
    constructor(canvasOrOpts, sequencePath, sequenceStart, sequenceEnd, fileType, loadCallback, onDraw, autoPlay = false, fps = 24, playOnce = false) {
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
            autoPlay,
            fps,
            playOnce
        });
    }
    /**
     * @param opts.canvasId {String} - id of the canvas tag you want to use
     * @param opts.sequencePath {String} - the path to your image sequence (ex. './img/sequence/'). If your images names are prefixed (ex. img_000.jpg) you must include the prefix in the path.
     * @param opts.sequenceStart {Int} - the number of the first frame (ex. if your first frame is img_00056.jpg then sequenceStart = 56)
     * @param opts.sequenceEnd {Int} - the number of the last frame
     * @param opts.fileType {String} - the file extension you want to use (ex. 'jpg')
     * @param opts.loadCallback {function} - a callback to be notified when all images are loaded and ready to use
     * @param opts.onDraw {function(previousFrame:Int, currentFrame:Int)`} - a callback to be notified when the drawn frame changes
     * @param opts.autoPlay {Boolean} - Defaults to `false`. a flag to make the sequence play without binding to scroll (like a regular video)
     * @param opts.fps {Number} - Defaults to `24`. Frames per second to use for video-like playback
     * @param opts.playOnce {Boolean} - Defaults to `false`. a flag to make the sequence play only once
     */
    ctor({ canvas, sequencePath, sequenceStart, sequenceEnd, fileType, loadCallback, onDraw, autoPlay = false, fps = 24, playOnce = false }) {
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

        this.scrollHeight = document.body.scrollHeight;
        this.scrollOffset = document.body.scrollTop;
        this.clientHeight = window.innerHeight;

        this.loadCallback = loadCallback || function() {};
        this.onDraw = typeof onDraw === 'function' ? onDraw : null;
        this.autoPlay = autoPlay;
        this.isPaused = false;
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

        for(var i = this.sequenceStart; i <= this.sequenceEnd; i++) {

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

    getScrollFrameNumber() {
        var scrollPercentage = (this.scrollOffset/(this.scrollHeight-this.clientHeight))*100;
        var currentFrameNumber = Math.round(scrollPercentage*this.sequenceLength/100);
        return currentFrameNumber;
    }

    getAutoPlayFrameNumber() {
        return Math.round(this.fps * this.playOffset);
    }

    getNextFrameNumber() {
        if (this.autoPlay) {
            return this.getAutoPlayFrameNumber();
        }

        return this.getScrollFrameNumber();
    }

    syncScrollPosition() {
        this.scrollOffset = document.body.scrollTop;
    }

    syncAutoPlayPosition() {
        const now = +new Date();
        if (!this.startTime) {
            this.startTime = now;
            this.isPaused = false;
        }

        if (!this.isPaused) {
            this.playOffset = ((now - this.startTime) / 1000) % (this.sequenceLength / this.fps);
        }
    }

    syncPlayPosition() {
        // no scroll tracking for autoplay
        if (this.autoPlay) {
            return this.syncAutoPlayPosition();
        }

        return this.syncScrollPosition();
    }

    drawImage(frame) {

        if(frame >= 0 && frame < this.sequence.length) {
            // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
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

        requestAnimationFrame(() => {
            this.renderFrame();
        });

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
