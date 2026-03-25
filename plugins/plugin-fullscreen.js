var jsPsychFullscreen = (function (jspsych) {
  "use strict";

  const info = {
    name: "fullscreen",
    parameters: {
      fullscreen_mode: { type: jspsych.ParameterType.BOOL, default: true },
      message: { type: jspsych.ParameterType.HTML_STRING, default: "<p>The experiment will switch to full screen mode when you press the button below</p>" },
      button_label: { type: jspsych.ParameterType.STRING, default: "Continue" },
      delay_after: { type: jspsych.ParameterType.INT, default: 1000 },
    }
  };

  class FullscreenPlugin {
    constructor(jsPsych) { this.jsPsych = jsPsych; this.rt = null; this.start_time = 0; }

    trial(display_element, trial) {
      var keyboardNotAllowed = typeof Element !== "undefined" && "ALLOW_KEYBOARD_INPUT" in Element;
      if (keyboardNotAllowed) {
        this.endTrial(display_element, false, trial);
      } else {
        if (trial.fullscreen_mode) {
          this.showDisplay(display_element, trial);
        } else {
          this.exitFullScreen();
          this.endTrial(display_element, true, trial);
        }
      }
    }

    showDisplay(display_element, trial) {
      display_element.innerHTML = `${trial.message}<button id="jspsych-fullscreen-btn" class="jspsych-btn">${trial.button_label}</button>`;
      display_element.querySelector("#jspsych-fullscreen-btn").addEventListener("click", () => {
        this.rt = Math.round(performance.now() - this.start_time);
        this.enterFullScreen();
        this.endTrial(display_element, true, trial);
      });
      this.start_time = performance.now();
    }

    endTrial(display_element, success, trial) {
      display_element.innerHTML = "";
      this.jsPsych.pluginAPI.setTimeout(() => {
        this.jsPsych.finishTrial({ success: success, rt: this.rt });
      }, trial.delay_after);
    }

    enterFullScreen() {
      var el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    }

    exitFullScreen() {
      if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    }
  }

  FullscreenPlugin.info = info;
  return FullscreenPlugin;
})(jsPsychModule);