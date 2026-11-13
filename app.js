(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const distance = $('#distance');
  const playButton = $('#play-button');
  const motionButton = $('.motion-toggle');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = preference.matches;
  let timer = null;
  let playing = false;
  let paused = false;
  let manualPreview = false;
  let assetsReady = false;
  let selectedHero = 'swordsman';
  let currentHeroHealth = 3;
  let frame = 0;
  let ticks = 0;
  let battleTick = -1;
  let returnTicks = -1;
  let battleIsPreview = false;
  let automaticBattleShown = false;
  let reducedStep = -1;
  const sceneHero = $('#scene-hero');
  const sceneMonster = $('#scene-monster');
  const battleButton = $('#battle-button');

  const heroes = {
    swordsman: { name: '검사', text: '처음부터 함께할 수 있는 기본 모험가. 검을 들고 힘찬 발걸음으로 여정을 시작해요.' },
    shield: { name: '방패 여전사', text: '검사로 한 번에 5km를 달리면 만나는 모험가. 든든한 방패를 앞세워 길을 지켜요.' },
    elf: { name: '엘프 궁수', text: '방패 여전사로 한 번에 5km를 달리면 만나는 모험가. 활을 들고 새로운 길을 찾아요.' },
    mage: { name: '마법사', text: '엘프 궁수로 한 번에 5km를 달리면 만나는 모험가. 마법과 함께 신비로운 여정을 떠나요.' }
  };
  const monsters = {
    slime: { label: 'THE FIRST ENCOUNTER', title: '말랑한 첫 만남, 슬라임', text: '모험의 시작에서 만나는 첫 몬스터. 작고 말랑한 모습으로 러너를 맞이합니다.', number: '01' },
    wolf: { label: 'THE WILD ENCOUNTER', title: '숲길의 추격자, 늑대', text: '날카로운 눈빛으로 길 위에 나타나는 늑대. 모험에 긴장감을 더해주는 상대입니다.', number: '02' },
    goblin: { label: 'THE MISCHIEVOUS ENCOUNTER', title: '장난기 가득한 고블린', text: '모험가의 앞길을 가로막는 고블린. 예상치 못한 만남으로 여정을 한층 다채롭게 만듭니다.', number: '03' },
    dragon: { label: 'THE RARE ENCOUNTER', title: '주말의 귀한 손님, 드래곤', text: '주말에 드물게 만날 수 있는 드래곤. 거대한 모습이 특별한 모험의 순간을 장식합니다.', number: '04' }
  };
  const messages = ['한 걸음씩, 잘하고 있어요!', '모험가님, 루미가 응원해요!', '영차영차! 루미도 힘낼게요!'];
  let messageIndex = -1;
  let currentAudio = null;
  let audioToken = 0;

  function heroFrame(index) { sceneHero.style.backgroundPosition = `${index * 12.5}% 0`; sceneHero.classList.toggle('is-attacking', index === 5 || index === 6); }
  function monsterFrame(index) { sceneMonster.style.backgroundPosition = `${index * 100 / 3}% 0`; }
  function setScene(hero, monster, caption, heroHealth = 3, monsterHealth = null) {
    currentHeroHealth = heroHealth;
    heroFrame(hero);
    sceneMonster.hidden = monster === null;
    if (monster !== null) monsterFrame(monster);
    $('#scene-hero-health').textContent = `모험가 ♥ ${heroHealth}/3`;
    $('#scene-monster-health').textContent = monsterHealth === null ? '슬라임 —' : `슬라임 ♥ ${monsterHealth}/3`;
    $('#scene-caption').textContent = caption;
  }
  const battleStages = [
    [4, 0, '슬라임 등장!', 3, 3],
    [5, 1, '일반 공격!', 3, 2.5],
    [4, 0, '다시 준비!', 3, 2.5],
    [5, 1, '일반 공격!', 3, 2],
    [7, 2, '슬라임의 반격!', 2.5, 2],
    [5, 1, '일반 공격!', 2.5, 1.5],
    [4, 0, '다시 준비!', 2.5, 1.5],
    [5, 1, '일반 공격!', 2.5, 1],
    [6, 1, '100m 자동 필살!', 2.5, 0],
    [4, 3, '슬라임 패배!', 2.5, 0],
    [8, 3, '승리!', 2.5, 0]
  ];
  function showStage(index) { setScene(...battleStages[index]); }
  function resetScene() { battleTick = -1; returnTicks = -1; reducedStep = -1; setScene(4, null, '달릴 준비 완료'); }
  function loadImage(src) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = resolve; image.onerror = reject; image.src = src; }); }
  sceneHero.style.backgroundImage = `url('images/demo/${selectedHero}-sprite.webp')`;
  Promise.all([...Object.keys(heroes).map((key) => loadImage(`images/demo/${key}-sprite.webp`)), loadImage('images/demo/slime-sprite.webp')]).then(() => {
    assetsReady = true;
    $('#scene-loading').hidden = true;
    resetScene();
    syncMotion();
  }).catch(() => { $('#scene-loading').textContent = '모험가 이미지를 불러오지 못했어요. 새로고침해 주세요.'; });

  function updateDistance() {
    const tenths = Math.min(100, Math.max(0, Math.round(Number(distance.value) * 10)));
    const km = tenths / 10;
    distance.value = km.toFixed(1);
    $('#distance-output').textContent = km.toFixed(1);
    $('#remaining-output').textContent = ((100 - tenths) / 10).toFixed(1);
    $('#percent-output').textContent = String(tenths);
    $('.journey-scene').style.backgroundPosition = `${35 + tenths * 0.3}% bottom`;
    distance.setAttribute('aria-valuetext', `${km.toFixed(1)}킬로미터, 전체의 ${tenths}퍼센트`);
  }
  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    playing = false;
    paused = false;
    manualPreview = false;
    ticks = 0;
    automaticBattleShown = false;
    playButton.innerHTML = '▶ <span>자동 재생</span>';
    playButton.setAttribute('aria-label', '가상 여정 자동 재생');
    if (assetsReady) resetScene();
  }
  function pause() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    playing = false;
    paused = true;
    playButton.innerHTML = '▶ <span>이어 재생</span>';
    playButton.setAttribute('aria-label', manualPreview ? '전투 시연 이어 재생' : '가상 여정 이어 재생');
  }
  function finish() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    playing = false;
    paused = false;
    manualPreview = false;
    ticks = 0;
    automaticBattleShown = false;
    playButton.innerHTML = '▶ <span>자동 재생</span>';
    playButton.setAttribute('aria-label', '가상 여정 자동 재생');
  }
  function syncMotion() {
    document.documentElement.classList.toggle('motion-reduced', reduced);
    motionButton.setAttribute('aria-pressed', String(reduced));
    motionButton.textContent = reduced ? '움직임 줄이기 켜짐' : '움직임 줄이기';
    stop();
    playButton.disabled = reduced || !assetsReady;
    playButton.title = reduced ? '자동 재생을 사용하려면 움직임 줄이기를 꺼주세요.' : '';
    battleButton.disabled = !assetsReady;
    battleButton.textContent = reduced ? '전투 단계 보기' : '전투 장면 보기';
  }
  distance.addEventListener('input', () => { stop(); updateDistance(); });
  function startTimer() {
    timer = setInterval(() => {
      ticks += 1;
      if (playing && !automaticBattleShown && ticks >= 25 && battleTick < 0 && returnTicks < 0) {
        battleTick = 0;
        battleIsPreview = false;
        automaticBattleShown = true;
      }
      if (battleTick >= 0) {
        const stage = Math.floor(battleTick / 6);
        if (stage < battleStages.length) {
          if (battleTick % 6 === 0) {
            showStage(stage);
            if (stage === 8 && playing && !battleIsPreview) {
              distance.value = Math.min(10, (Math.round(Number(distance.value) * 10) + 1) / 10);
              updateDistance();
            }
          }
          battleTick += 1;
        }
        else {
          battleTick = -1;
          returnTicks = 0;
          frame = 0;
          setScene(0, null, '다시 달려요!', 2.5);
        }
      } else if (returnTicks >= 0) {
        returnTicks += 1;
        if (returnTicks % 2 === 0) { frame = (frame + 1) % 4; heroFrame(frame); }
        if (returnTicks >= 8) {
          returnTicks = -1;
          if (!playing || Number(distance.value) >= 10) { finish(); return; }
        }
      } else if (playing) {
        if (ticks % 2 === 0) { frame = (frame + 1) % 4; heroFrame(frame); }
        if (ticks % 4 === 0) {
          const next = (Math.round(Number(distance.value) * 10) + 1) / 10;
          if (next >= 10) {
            if (automaticBattleShown) { battleTick = 0; battleIsPreview = false; }
          } else { distance.value = next; updateDistance(); }
        }
      }
    }, 100);
  }
  playButton.addEventListener('click', () => {
    if (timer !== null) { pause(); return; }
    if (!paused) {
      const health = currentHeroHealth;
      stop();
      if (Number(distance.value) >= 10) distance.value = '0';
      updateDistance();
      setScene(0, null, '달리는 중', health);
    }
    paused = false;
    playing = !manualPreview;
    playButton.innerHTML = 'Ⅱ <span>일시 정지</span>';
    playButton.setAttribute('aria-label', manualPreview ? '전투 시연 일시 정지' : '가상 여정 일시 정지');
    startTimer();
  });
  battleButton.addEventListener('click', () => {
    if (reduced) {
      reducedStep = (reducedStep + 1) % (battleStages.length + 1);
      if (reducedStep === battleStages.length) resetScene(); else showStage(reducedStep);
      return;
    }
    if (paused) stop();
    if (timer === null) {
      ticks = 0;
      manualPreview = true;
      playButton.innerHTML = 'Ⅱ <span>일시 정지</span>';
      playButton.setAttribute('aria-label', '전투 시연 일시 정지');
      startTimer();
    }
    returnTicks = -1;
    battleIsPreview = true;
    battleTick = 0;
    showStage(0);
  });
  $('#reset-button').addEventListener('click', () => { stop(); distance.value = '0'; updateDistance(); });
  motionButton.addEventListener('click', () => { reduced = !reduced; syncMotion(); });
  preference.addEventListener?.('change', (event) => { reduced = event.matches; syncMotion(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); stopAudio(); } });
  window.addEventListener('pagehide', () => { stop(); stopAudio(); });

  $$('.character-card').forEach((button) => button.addEventListener('click', () => {
    const key = button.dataset.hero;
    const hero = heroes[key];
    $$('.character-card').forEach((item) => { const selected = item === button; item.classList.toggle('is-selected', selected); item.setAttribute('aria-pressed', String(selected)); });
    $('#hero-detail-title').textContent = hero.name;
    $('#hero-detail-text').textContent = hero.text;
    stop();
    selectedHero = key;
    sceneHero.style.backgroundImage = `url('images/demo/${key}-sprite.webp')`;
  }));
  $$('.monster-card').forEach((button) => button.addEventListener('click', () => {
    const key = button.dataset.monster;
    const monster = monsters[key];
    $$('.monster-card').forEach((item) => { const selected = item === button; item.classList.toggle('is-selected', selected); item.setAttribute('aria-pressed', String(selected)); });
    $('#monster-detail-image').src = `images/monster-${key}.png`;
    $('#monster-detail-label').textContent = monster.label;
    $('#monster-detail-title').textContent = monster.title;
    $('#monster-detail-text').textContent = monster.text;
    $('.monster-detail-copy small').textContent = `MONSTER FIELD NOTES · ${monster.number}`;
  }));
  function stopAudio(message = '음성을 정지했어요.') {
    audioToken += 1;
    if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; currentAudio = null; }
    $('#cheer-status').textContent = message;
  }
  $('#cheer-button').addEventListener('click', () => {
    stopAudio();
    messageIndex = (messageIndex + 1) % messages.length;
    $('#lumi-image').src = messageIndex % 2 === 0 ? 'images/lumi-cheer.png' : 'images/lumi-companion.png';
    $('#lumi-image').alt = messageIndex % 2 === 0 ? '응원하는 루미의 표정' : '루미의 기본 표정';
    $('#lumi-message').textContent = messages[messageIndex];
    const token = audioToken;
    const audio = new Audio();
    currentAudio = audio;
    audio.preload = 'none';
    audio.volume = 0.7;
    audio.muted = $('#cheer-mute').checked;
    $('#cheer-status').textContent = '응원 음성을 불러오는 중이에요.';
    audio.src = `audio/cheer-${messageIndex + 1}.m4a`;
    audio.addEventListener('playing', () => { if (token === audioToken) $('#cheer-status').textContent = audio.muted ? 'AI 생성 음성 재생 중 · 음소거' : 'AI 생성 음성 재생 중'; });
    audio.addEventListener('ended', () => { if (token === audioToken) { currentAudio = null; $('#cheer-status').textContent = '응원 음성 재생이 끝났어요.'; } });
    audio.addEventListener('error', () => { if (token === audioToken) $('#cheer-status').textContent = '음성을 재생할 수 없어요. 응원 문구를 확인해 주세요.'; });
    const promise = audio.play();
    if (promise) promise.catch(() => { if (token === audioToken) $('#cheer-status').textContent = '음성을 재생할 수 없어요. 응원 문구를 확인해 주세요.'; });
  });
  $('#cheer-stop').addEventListener('click', () => stopAudio());
  $('#cheer-mute').addEventListener('change', (event) => {
    if (currentAudio) { currentAudio.muted = event.target.checked; $('#cheer-status').textContent = event.target.checked ? 'AI 생성 음성 재생 중 · 음소거' : 'AI 생성 음성 재생 중'; }
  });
  const navLinks = $$('.site-header nav a');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    ['adventure', 'heroes', 'monsters', 'lumi'].forEach((id) => observer.observe(document.getElementById(id)));
  }
  $$('.distance-row output').forEach((output) => output.setAttribute('aria-live', 'off'));
  updateDistance();
  syncMotion();
})();
