// MOM-IRM Training

console.log("jsPsychHtmlKeyboardResponse:", typeof jsPsychHtmlKeyboardResponse);
console.log("jsPsychVideoAudioKeyboardResponse:", typeof jsPsychVideoAudioKeyboardResponse);

const jsPsych = initJsPsych({
  on_finish: function() {
    jsPsych.data.displayData();
  }
});

const timeline = [];

// ---------- Helpers grafici responsive ----------
const MMO_SCREEN_BG = "#549FFF";

function fullscreenVideoHTML(id, src) {
  return `
    <div style="
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: ${MMO_SCREEN_BG};
      overflow: hidden;
      margin: 0;
      padding: 0;
    ">
      <video
        id="${id}"
        style="
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        "
        playsinline
      >
        <source src="${src}" type="video/mp4">
      </video>
    </div>
  `;
}

// ---------- Richiesta età ----------
let MMO_ageStr = "";

const ask_age = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="mmo-form">
      <h1>MOM</h1>
      <p>Âge du sujet</p>
      <p style="margin-top:18px;">
        <input id="mmo-subject-age" type="text" inputmode="numeric" autocomplete="off" />
      </p>
      <div class="mmo-hint">Appuyez sur <b>ENTRÉE</b> pour continuer</div>
    </div>
  `,
  choices: ["Enter"],
  on_load: () => {
    const el = document.getElementById("mmo-subject-age");
    if (!el) return;
    el.focus();
    el.addEventListener("input", () => {
      MMO_ageStr = el.value;
    });
    MMO_ageStr = el.value;
  },
  on_finish: () => {
    const age = parseInt((MMO_ageStr || "").trim(), 10);

    if (!Number.isFinite(age) || age < 1 || age > 120) {
      alert("Veuillez saisir un âge valide.");
      jsPsych.endExperiment("Âge invalide.");
      return;
    }

    window.MMO_SUBJECT_AGE = age;
    jsPsych.data.addProperties({ subject_age: age });
  },
};

timeline.push(ask_age);

// ---------- Intro ----------
const intro_screen = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="mmo-form">
      <p>Appuie sur la touche Espace pour écouter l'explication !</p>
    </div>
  `,
  choices: [" "]
};

timeline.push(intro_screen);

// ---------- Vidéo explication ----------
const explanation_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: fullscreenVideoHTML("explication-video", "video/CompleteExplication.mp4"),
  choices: "NO_KEYS",

  on_load: function() {
    const video = document.getElementById("explication-video");
    const audio = new Audio("audio/CompleteExplication_IRM.wav");

    video.loop = true;
    video.play();
    audio.play();

    audio.onended = function() {
      video.pause();
      jsPsych.finishTrial();
    };
  }
};

timeline.push(explanation_trial);

// ---------- Avant training ----------
const before_training = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="mmo-form">
      <p>Appuie sur la touche Espace pour commencer l'êntrainement !</p>
    </div>
  `,
  choices: [" "]
};

timeline.push(before_training);

// ---------- Intro training ----------
const training_introduction = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: fullscreenVideoHTML("training-introduction-video", "video/RobotQuiParle_loop.mp4"),
  choices: "NO_KEYS",

  on_load: function() {
    const video = document.getElementById("training-introduction-video");
    const audio = new Audio("audio/TrainingExplication.wav");

    video.loop = true;
    video.play();
    audio.play();

    audio.onended = function() {
      video.pause();
      jsPsych.finishTrial();
    };
  }
};

timeline.push(training_introduction);

// ---------- Stimoli training ----------
const training_stimuli = [
  {
    phrase_audio: "audio/Phrase1_False.wav",
    phrase_video: "video/RobotQuiParle_loopTraining.mp4",
    content_feedback_audio: "audio/FeedbackPhrase1.wav",
    content_feedback_video: "video/FeedbackFalse.mp4"
  },
  {
    phrase_audio: "audio/Phrase2_True.wav",
    phrase_video: "video/RobotQuiParle_loopTraining.mp4",
    content_feedback_audio: "audio/FeedbackPhrase2.wav",
    content_feedback_video: "video/FeedbackTrue.mp4"
  },
  {
    phrase_audio: "audio/Phrase3_Meaningless.wav",
    phrase_video: "video/RobotQuiParle_loopTraining.mp4",
    content_feedback_audio: "audio/FeedbackPhrase3.wav",
    content_feedback_video: "video/FeedbackFalse.mp4"
  },
  {
    phrase_audio: "audio/Phrase4_Meaningless.wav",
    phrase_video: "video/RobotQuiParle_loopTraining.mp4",
    content_feedback_audio: "audio/FeedbackPhrase4.wav",
    content_feedback_video: "video/FeedbackFalse.mp4"
  }
];

let gotRespDuringPhrase = false;
let gotRespDuringWait = false;
let firstResponseKey = null;
let firstResponsePhase = null;
let currentBehaviorFeedback = null;

// ---------- Pause ----------
const pausa_2s = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "",
  choices: "NO_KEYS",
  trial_duration: 2000
};

const pausa_1s = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "",
  choices: "NO_KEYS",
  trial_duration: 1000
};

timeline.push(pausa_2s);

// ---------- Training: phrase ----------
function makePhraseTrial(cfg) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: fullscreenVideoHTML("phrase-video", cfg.phrase_video),
    choices: "NO_KEYS",

    on_load: function() {
      const video = document.getElementById("phrase-video");
      const audio = new Audio(cfg.phrase_audio);

      gotRespDuringPhrase = false;
      firstResponseKey = null;
      firstResponsePhase = null;

      video.loop = true;
      video.play();
      audio.play();

      const onKeyDown = (e) => {
        const key = e.key.toLowerCase();

        if (key !== "q" && key !== "m") return;

        if (!gotRespDuringPhrase && !gotRespDuringWait) {
          gotRespDuringPhrase = true;
          firstResponseKey = key;
          firstResponsePhase = "phrase";
        }
      };

      window.addEventListener("keydown", onKeyDown);
      this._phraseKeyHandler = onKeyDown;

      audio.onended = () => {
        video.pause();
        jsPsych.finishTrial();
      };
    },

    on_finish: function() {
      if (this._phraseKeyHandler) {
        window.removeEventListener("keydown", this._phraseKeyHandler);
      }
    },

    data: {
      phase: "phrase"
    }
  };
}

// ---------- Training: wait ----------
function makeWaitTrial() {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: fullscreenVideoHTML("wait-video", "video/RobotNeParlePas.mp4"),
    choices: "NO_KEYS",
    trial_duration: 4000,

    on_load: function() {
      const video = document.getElementById("wait-video");

      gotRespDuringWait = false;

      video.loop = true;
      video.play();

      const onKeyDown = (e) => {
        const key = e.key.toLowerCase();

        if (key !== "q" && key !== "m") return;

        if (!gotRespDuringPhrase && !gotRespDuringWait) {
          gotRespDuringWait = true;
          firstResponseKey = key;
          firstResponsePhase = "wait";
        }
      };

      window.addEventListener("keydown", onKeyDown);
      this._waitKeyHandler = onKeyDown;
    },

    on_finish: function() {
      if (this._waitKeyHandler) {
        window.removeEventListener("keydown", this._waitKeyHandler);
      }
    },

    data: {
      phase: "wait"
    }
  };
}

// ---------- Training: feedback comportamento ----------
const computeBehaviorFeedback = {
  type: jsPsychCallFunction,
  func: function() {
    if (gotRespDuringPhrase) {
      currentBehaviorFeedback = 1;
    } else if (gotRespDuringWait) {
      currentBehaviorFeedback = 2;
    } else {
      currentBehaviorFeedback = 3;
    }
  }
};

function makeBehaviorFeedbackTrial() {
  return {
    type: jsPsychHtmlKeyboardResponse,

    stimulus: function() {
      let videoSrc;
      if (currentBehaviorFeedback === 1) {
        videoSrc = "video/RobotQuiParle_loop.mp4";
      } else if (currentBehaviorFeedback === 2) {
        videoSrc = "video/FeedbackOkRobot.mp4";
      } else {
        videoSrc = "video/FeedbackNotOkRobot.mp4";
      }

      return fullscreenVideoHTML("behavior-feedback-video", videoSrc);
    },

    choices: "NO_KEYS",

    on_load: function() {
      const video = document.getElementById("behavior-feedback-video");

      let audioFile;
      if (currentBehaviorFeedback === 1) {
        audioFile = "audio/Feedback1Training.wav";
      } else if (currentBehaviorFeedback === 2) {
        audioFile = "audio/Feedback2Training.wav";
      } else {
        audioFile = "audio/Feedback3Training.wav";
      }

      const audio = new Audio(audioFile);

      video.loop = true;
      video.play();
      audio.play();

      audio.onended = () => {
        video.pause();
        jsPsych.finishTrial();
      };
    },

    data: { phase: "behavior_feedback" }
  };
}

// ---------- Training: feedback contenuto ----------
function makeContentFeedbackTrial(cfg) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: fullscreenVideoHTML("content-feedback-video", cfg.content_feedback_video),
    choices: "NO_KEYS",

    on_load: function() {
      const video = document.getElementById("content-feedback-video");
      const audio = new Audio(cfg.content_feedback_audio);

      video.loop = true;
      video.play();
      audio.play();

      audio.onended = () => {
        video.pause();
        jsPsych.finishTrial();
      };
    },

    data: {
      phase: "content_feedback"
    }
  };
}

function addTrainingTrialBlock(timeline, cfg) {
  timeline.push(makePhraseTrial(cfg));
  timeline.push(makeWaitTrial());
  timeline.push(computeBehaviorFeedback);
  timeline.push(makeBehaviorFeedbackTrial());
  timeline.push(pausa_1s);
  timeline.push(makeContentFeedbackTrial(cfg));
  timeline.push(pausa_2s);
}

for (let i = 0; i < training_stimuli.length; i++) {
  addTrainingTrialBlock(timeline, training_stimuli[i]);
}

// ---------- Fine training ----------
const training_end = {
  type: jsPsychHtmlKeyboardResponse,

  stimulus: function() {
    const age = window.MMO_SUBJECT_AGE;
    const videoSrc = age < 12
      ? "video/TrainingEndVideo.mp4"
      : "video/TrainingEndVideo_old.mp4";

    return fullscreenVideoHTML("training-end-video", videoSrc);
  },

  choices: "NO_KEYS",

  on_load: function() {
    const age = window.MMO_SUBJECT_AGE;
    const audioFile = age < 12
      ? "audio/TrainingEnd.wav"
      : "audio/TrainingEnd_old.wav";

    const video = document.getElementById("training-end-video");
    const audio = new Audio(audioFile);

    video.loop = true;
    video.play();
    audio.play();

    audio.onended = () => {
      video.pause();
      jsPsych.finishTrial();
    };
  },

  data: { phase: "training_end" }
};

timeline.push(training_end);

// ---------- Schermata finale ----------
const finish_screen = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="mmo-form">
      <p>L'êntrainement est terminé !</p>
    </div>
  `,
  choices: [" "]
};

timeline.push(finish_screen);

// ---------- Run ----------
jsPsych.run(timeline);
