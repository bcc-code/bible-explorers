import Experience from '../Experience.js';
import _s from '../Utils/Strings.js';
import _gl from '../Utils/Globals.js';
import _lang from '../Utils/Lang.js';
import _appInsights from '../Utils/AppInsights.js';

let instance = null;

export default class Menu {
  constructor() {
    instance = this;
    instance.experience = new Experience();

    instance.soundOn = true;

    const defaultVideoQuality = 'high';
    instance.videoQuality =
      localStorage.getItem('videoQuality') || defaultVideoQuality;
    instance.logInLogOut = {
      login: false,
      logout: false,
    };

    instance.init();
    instance.eventListeners();
  }

  init() {
    _appInsights.trackPageView({ name: 'Settings' });

    const settingsTitle = document.querySelector('.menu.side-modal .header h2');
    settingsTitle.innerText = _s.settings.title;

    const selectLang = document.querySelector('.select-language');
    const selectLangLabel = selectLang.querySelector('.heading');
    const selectLangCurrent = selectLang.querySelector('button');
    const selectLangDropdown = selectLang.querySelector('ul');
    selectLangLabel.innerText = _s.settings.language;
    selectLangCurrent.innerText = _lang.getLanguageName();
    selectLangDropdown.innerHTML = _lang.getLanguagesList();

    const selectVQ = document.querySelector('.select-video-quality');
    const selectVQLabel = selectVQ.querySelector('.heading');
    const selectVQCurrent = selectVQ.querySelector('button');
    const selectVQDropdown = selectVQ.querySelector('ul');
    selectVQLabel.innerText = _s.settings.videoQuality.title;
    selectVQCurrent.innerText = _s.settings.videoQuality[instance.videoQuality];
    selectVQDropdown.querySelectorAll('li').forEach((item) => {
      const li = item.getAttribute('data-id');
      if (li === 'low') {
        item.innerText = _s.settings.videoQuality.low;
      } else if (li === 'medium') {
        item.innerText = _s.settings.videoQuality.medium;
      } else if (li === 'high') {
        item.innerText = _s.settings.videoQuality.high;
      }
    });

    const backgroundMusic = document.querySelector('.background-music');
    const backgroundMusicLabel = backgroundMusic.querySelector('.heading span');
    backgroundMusicLabel.innerText = _s.settings.backgroundMusic;

    const soundEFX = document.querySelector('.sound-effects');
    soundEFX.querySelector('.heading').innerText = _s.settings.soundEffects;
    soundEFX
      .querySelector('input')
      .setAttribute(instance.soundOn ? 'checked' : '', '');
    soundEFX.querySelector('label').innerText = instance.soundOn
      ? _s.settings.on
      : _s.settings.off;

    const fullscreen = document.querySelector('.fullscreen-section');
    fullscreen.querySelector('.heading').innerText = _s.settings.fullScreenMode;
    fullscreen.querySelector('input').checked =
      document.fullscreenElement !== null;
    fullscreen.querySelector('label').innerText = !document.fullscreenElement
      ? _s.settings.off
      : _s.settings.on;

    const loginBtn = document.querySelector('[aria-label="Login button"]');
    const logoutBtn = document.querySelector('[aria-label="Logout button"]');
    loginBtn.innerText = _s.settings.logIn;
    logoutBtn.innerText = _s.settings.logOut;

    const bibleExplorersGuide = document.querySelector('[aria-label="Guide"]');
    bibleExplorersGuide.querySelector('span').innerText = _s.howTo;
    bibleExplorersGuide.setAttribute(
      'href',
      `https://biblekids.io/${_lang.getLanguageCode()}/explorers/`,
    );

    const copyrightFooter = document.querySelector('aside.copyright');
    copyrightFooter.innerHTML = `Copyright ${new Date().getFullYear()} © <a href="https://bcc.media" target="_blank">BCC Media STI</a>`;
  }

  eventListeners() {
    document
      .querySelector('[aria-label="Open menu"]')
      .addEventListener('click', instance.open);
    document
      .querySelector('[aria-label="Close menu"]')
      .addEventListener('click', instance.close);

    document
      .querySelector('.menu .overlay')
      .addEventListener('click', instance.close);

    const languageBtn = document.querySelector(
      '[aria-label="current language"]',
    );
    const languageItems = document.querySelectorAll(
      '.select-language .dropdown li',
    );

    languageBtn.addEventListener('click', () => {
      languageBtn.parentElement.classList.toggle('is-open');
    });

    languageItems.forEach(function (language) {
      language.addEventListener('click', () => {
        _lang.updateLanguage(language.getAttribute('data-id'));
      });
    });

    const videoQualityBtn = document.querySelector(
      '[aria-label="current video quality"]',
    );
    const videoQualityItems = document.querySelectorAll(
      '.select-video-quality .dropdown li',
    );

    videoQualityBtn.addEventListener('click', () => {
      videoQualityBtn.parentElement.classList.toggle('is-open');
    });

    videoQualityItems.forEach(function (videoQuality) {
      videoQuality.addEventListener('click', () => {
        instance.videoQuality = videoQuality.getAttribute('data-id');
        videoQualityBtn.textContent =
          _s.settings.videoQuality[instance.videoQuality];
        localStorage.setItem('videoQuality', instance.videoQuality);
        videoQualityBtn.parentElement.classList.toggle('is-open');
      });
    });

    const soundEFX = document.querySelector('.sound-effects');
    soundEFX.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) {
        instance.soundOn = true;
        soundEFX.querySelector('label').innerText = _s.settings.on;
      } else {
        instance.soundOn = false;
        soundEFX.querySelector('label').innerText = _s.settings.off;
      }
    });

    const fullscreen = document.querySelector('.fullscreen-section');
    fullscreen.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    window.addEventListener('resize', (e) => {
      if (window.innerHeight == screen.height) {
        fullscreen.querySelector('input').checked = true;
        fullscreen.querySelector('label').innerText = _s.settings.on;
      } else {
        fullscreen.querySelector('input').checked = false;
        fullscreen.querySelector('label').innerText = _s.settings.off;
      }
    });

    const loginBtn = document.querySelector('[aria-label="Login button"]');
    const logoutBtn = document.querySelector('[aria-label="Logout button"]');

    loginBtn.addEventListener('click', instance.login);
    logoutBtn.addEventListener('click', instance.logout);
  }

  updateUI = async () => {
    instance.logInLogOut.login = instance.experience.auth0.isAuthenticated;
    instance.logInLogOut.logout = !instance.experience.auth0.isAuthenticated;

    const loginBtn = document.querySelector('[aria-label="Login button"]');
    const logoutBtn = document.querySelector('[aria-label="Logout button"]');

    const loginText = document.querySelector('[aria-label="Logged in"]');
    const loginUser = document.querySelector('[aria-label="User"]');
    const loginRole = document.querySelector('[aria-label="Role"]');

    if (loginBtn) {
      loginBtn.disabled = instance.logInLogOut.login;
      logoutBtn.disabled = instance.logInLogOut.logout;

      loginText.innerText = instance.experience.auth0.isAuthenticated
        ? _s.settings.loggedInAs
        : _s.settings.notLoggedIn;
      loginUser.innerText = instance.experience.auth0.userData?.name || '';
      loginRole.innerText =
        instance.experience.auth0.isAuthenticated &&
        document.body.classList.contains('ak_leder')
          ? '(' + _s.settings.mentor + ')'
          : '';
    }
  };

  login = async () => {
    await this.experience.auth0.loginWithRedirect({
      redirect_uri: window.location.origin,
    });
  };

  logout = () => {
    this.experience.auth0.logout({
      returnTo: window.location.origin,
    });
  };

  open() {
    document.querySelector('.menu').classList.add('is-open');
  }

  close() {
    document.querySelector('.menu').classList.remove('is-open');
  }
}
