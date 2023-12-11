import Experience from '../Experience.js';
import Archive from '../Components/Archive.js';
import CodeUnlock from '../Components/CodeUnlock.js';
import HiddenItems from '../Games/HiddenItems.js';
import QuestionAndCode from '../Extras/QuestionAndCode.js';
import Video from '../Extras/Video.js';
import Quiz from '../Components/Quiz.js';
import MultipleChoiceWithPicture from '../Extras/MultipleChoiceWithPicture.js';
import VideoWithQuestion from '../Extras/VideoWithQuestion.js';
import Congrats from '../Extras/Congrats.js';
import Pause from '../Extras/Pause.js';
import Dialogue from '../Components/Dialogue.js';
import Message from '../Components/Message.js';
import GameDescription from '../Components/GameDescription.js';
import ConfirmationScreen from '../Components/ConfirmationScreen.js';
import _e from '../Utils/Events.js';

let instance = null;

export default class Program {
  constructor() {
    instance = this;
    instance.experience = new Experience();
    instance.resources = instance.experience.resources;
    instance.world = instance.experience.world;
    instance.programData = instance.world.selectedChapter.program;
    instance.audio = instance.world.audio;
    instance.debug = instance.experience.debug;

    instance.archive = new Archive();
    instance.video = new Video();
    instance.codeUnlock = new CodeUnlock();
    instance.pictureAndCode = new HiddenItems();
    instance.questionAndCode = new QuestionAndCode();
    instance.quiz = new Quiz();
    instance.multipleChoiceWithPicture = new MultipleChoiceWithPicture();
    instance.videoWithQuestion = new VideoWithQuestion();
    instance.congrats = new Congrats();
    instance.pause = new Pause();
    instance.dialogue = new Dialogue();
    instance.message = new Message();
    instance.gameDescription = new GameDescription();
    instance.confirmationScreen = new ConfirmationScreen();

    instance.gamesData = {
      pictureAndCode: {
        circles: [],
      },
    };

    // Get instance variables
    instance.chapterProgress = () => 0;
    instance.currentCheckpoint = 0;
    instance.getCurrentCheckpointData = () =>
      instance.currentCheckpoint in instance.programData
        ? instance.programData[instance.currentCheckpoint]
        : null;

    instance.currentStep = 0;
    instance.getCurrentStepData = () =>
      instance.getCurrentCheckpointData()
        ? instance.getCurrentCheckpointData().steps[instance.currentStep]
        : null;
    instance.stepType = () =>
      instance.getCurrentStepData()
        ? instance.getCurrentStepData().details.step_type
        : null;
    instance.taskType = () =>
      instance.getCurrentStepData()
        ? instance.getCurrentStepData().details.task_type
        : null;

    instance.updateAssetInProgramData = (field, newValue) => {
      instance.programData[instance.currentCheckpoint].steps[
        instance.currentStep
      ][field] = newValue;
    };

    instance.irisInteraction = document.querySelector('.iris-interaction');
    instance.totalCheckpoints = Object.keys(instance.programData).length;
    instance.clickCallback = () => {};
    instance.canClick = () =>
      !document.body.classList.contains('freeze') &&
      !document.body.classList.contains('modal-on') &&
      !document.body.classList.contains('camera-is-moving');

    instance.startInteractivity();
    instance.addEventListeners();
    instance.stepToggled();
  }

  addEventListeners() {
    instance.experience.navigation.prev.addEventListener(
      'click',
      instance.previousStep,
    );
    instance.experience.navigation.next.addEventListener(
      'click',
      instance.nextStep,
    );

    instance.irisInteraction.addEventListener('click', instance.startAction);
  }

  previousStep() {
    // If there is a multi-action step, go to the first step of the checkpoint instead of going to the previous step
    // if (instance.points.previousLabel) {
    //   instance.goToCheckpoint(instance.currentCheckpoint);
    //   return;
    // }

    instance.currentStep--;
    instance.toggleStep();
  }

  nextStep() {
    instance.currentStep++;
    instance.toggleStep();
  }

  toggleStep() {
    instance.world.progressBar.hide();

    if (instance.currentStep < 0) {
      // Back to previous checkpoint
      instance.previousCheckpoint();
      instance.stepToggled();
      instance.startInteractivity();
    } else {
      if (
        instance.currentStep == instance.getCurrentCheckpointData().steps.length
      ) {
        // Advance to next checkpoint
        instance.nextCheckpoint();
        instance.stepToggled();
        instance.startInteractivity();
      } else {
        // Start next task
        instance.stepToggled();
        instance.startTask();
      }
    }
  }

  stepToggled() {
    document.dispatchEvent(_e.EVENTS.STEP_TOGGLED);
  }

  startTask() {
    if (instance.stepType() == 'video') {
      instance.video.load(instance.currentVideo());

      if (instance.getCurrentStepData().details.play_video_directly) {
        instance.video.play();
      }
    } else {
      if (instance.stepType() == 'iris') {
        instance.message.show();
      } else if (instance.stepType() == 'task') {
        if (instance.taskType() == 'code_to_unlock') {
          instance.codeUnlock.toggleCodeUnlock();
        } else if (instance.taskType() == 'picture_and_code') {
          instance.pictureAndCode.togglePictureAndCode();
        } else if (instance.taskType() == 'question_and_code') {
          instance.questionAndCode.toggleQuestionAndCode();
        } else if (instance.taskType() == 'questions') {
          // instance.questions.toggleQuestions()
        } else if (instance.taskType() == 'dialog') {
          instance.dialogue.toggle();
        }

        // Games
        else if (
          instance.taskType() == 'cables' ||
          instance.taskType() == 'sorting' ||
          instance.taskType() == 'simon_says' ||
          instance.taskType() == 'flip_cards' ||
          instance.taskType() == 'choose_new_king' ||
          instance.taskType() == 'heart_defense' ||
          instance.taskType() == 'davids_refuge' ||
          instance.taskType() == 'labyrinth'
        ) {
          instance.gameDescription.show();
        } else if (instance.taskType() == 'multiple_choice_with_picture') {
          instance.multipleChoiceWithPicture.show();
        } else if (instance.taskType() == 'video_with_question') {
          instance.videoWithQuestion.toggleVideoWithQuestion();
        } else if (instance.taskType() == 'confirmation_screen') {
          instance.confirmationScreen.show();
        }
      } else if (instance.stepType() == 'quiz') {
        instance.quiz.toggleQuiz();
      } else if (instance.stepType() == 'pause') {
        instance.pause.togglePause();
      }
    }

    // Check if it was the last step in the last checkpoint
    if (instance.currentCheckpoint == instance.totalCheckpoints)
      instance.congrats.toggleBibleCardsReminder();
  }

  previousCheckpoint() {
    instance.updateCurrentCheckpoint(--instance.currentCheckpoint);
    instance.currentStep =
      instance.programData[instance.currentCheckpoint].steps.length - 1;
  }

  nextCheckpoint() {
    instance.updateCurrentCheckpoint(++instance.currentCheckpoint);
    instance.currentStep = 0;
  }

  goToCheckpoint(checkpoint) {
    instance.updateCurrentCheckpoint(checkpoint);
    instance.currentStep = 0;

    instance.stepToggled();
    instance.startInteractivity();
  }

  updateCurrentCheckpoint(newCheckpoint) {
    instance.currentCheckpoint = newCheckpoint;
  }

  startInteractivity() {
    if (instance.stepType() != 'video') instance.video.defocus();

    if (instance.stepType() == 'iris') {
      setTimeout(function () {
        instance.world.progressBar.show();
        instance.irisInteraction.style.display = 'flex';
      }, 1000);
    } else if (instance.stepType() == 'pause') {
      instance.world.progressBar?.hide();
      instance.startTask();
    } else {
      instance.world.progressBar?.hide();
      instance.startTask();
    }
  }

  startAction() {
    instance.world.progressBar.hide();
    instance.irisInteraction.style.display = 'none';
    instance.message.show();
  }

  currentVideo() {
    if (instance.currentCheckpoint >= instance.programData.length) return null;

    return instance.programData[instance.currentCheckpoint].steps[
      instance.currentStep
    ].videoId;
  }

  nextVideo() {
    for (
      let checkpoint = instance.currentCheckpoint;
      checkpoint < instance.totalCheckpoints;
      checkpoint++
    ) {
      const startingStep =
        checkpoint == instance.currentCheckpoint ? instance.currentStep : 0;

      for (
        let step = startingStep;
        step < instance.programData[checkpoint].steps.length;
        step++
      ) {
        if (
          instance.programData[checkpoint].steps[step].details.step_type ==
          'video'
        )
          return instance.programData[checkpoint].steps[step].videoId;
      }
    }

    return null;
  }

  removeEventListeners() {
    instance.experience.navigation.prev.removeEventListener(
      'click',
      instance.previousStep,
    );
    instance.experience.navigation.next.removeEventListener(
      'click',
      instance.nextStep,
    );
  }

  destroy() {
    instance.removeEventListeners();
    instance.message.destroy();
    instance.dialogue.destroy();
  }
}
