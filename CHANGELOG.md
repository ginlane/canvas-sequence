# 1.3.6

* Skip RAF calls For MANUAL play mode

# 1.3.5

* Cross browser scrolltop support

# 1.3.4 (skipped)

# 1.3.3

* Fix: canvas should not be blank on first render (#6)

# 1.3.2

* Fix bug where canvas isn't cleared for images with transparency

# 1.3.1

* Fix of 1.3.0
* Builds dist

# 1.3.0 (Bad)

* Replaces `autoPlay` with `mode`
* Adds support for `manual` playback mode

# 1.2.1

* Adds `playOnce` flag for use with `auto` playback mode

# 1.2.0

* Canvas now initializes with natural size, not window dimensions

# 1.1.3

* Fix package.json `main` definition

# 1.1.2

* Adds `autoPlay` and `fps` options.
  * Can be used to switch player to a regular video-like playing mode. Playback
would no longer be bound to scroll position
* Adds `.play()` and `.pause()` functions for use with `autoPlay`
* Constructor can now accept a single `object` of options

# 1.1.1

* replace `frameCallbacks` option with `onDraw` callback. `onDraw` can achieve
the same thing as `frameCallbacks` with a simpler API while being more flexible.

# 1.1.0

* add `frameCallbacks` option so owners can receive notifications when certain
frames are drawn

# 1.0.0

* Initial fork from [simoncorompt/canvas-sequence](https://github.com/simoncorompt/canvas-sequence)
