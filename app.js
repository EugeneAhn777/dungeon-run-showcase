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
  const scene = $('.journey-scene');
  const sceneBackground = $('.scene-background');
  let cameraPosition = 0;
  let cameraRange = 1;
  let cameraFrame = null;
  let cameraTime = null;
  const sceneHero = $('#scene-hero');
  const sceneMonster = $('#scene-monster');
  const battleButton = $('#battle-button');
  const maxTenths = 20;
  const titleImage = $('#ultimate-title');
  const effectImage = $('#ultimate-fx');
  const impactImage = $('#ultimate-impact');
  const effects = {
    swordsman: ['fx-swordsman-cross', 'fx-swordsman-impact'],
    shield: ['fx-shield-hammer', 'fx-shield-impact'],
    elf: ['fx-elf-arrow', 'fx-elf-hit'],
    mage: ['fx-mage-pillar', null]
  };
  const ultimateNames = { swordsman: '크로스 슬래시', shield: '디바인 해머', elf: '미라지 애로우', mage: '익스플로전' };

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
  function renderHealth(selector, label, value) {
    const element = $(selector);
    element.setAttribute('aria-label', value === null ? `${label} 없음` : `${label} 체력 ${value}/3`);
    const path = 'M12 21s-9-5.5-9-11.2C3 4.6 8.5 2.8 12 7c3.5-4.2 9-2.4 9 2.8C21 15.5 12 21 12 21z';
    const hearts = value === null ? '—' : [0, 1, 2].map((index) => {
      const remaining = value - index;
      const state = remaining >= 1 ? 'full' : remaining > 0 ? 'half' : 'empty';
      return `<svg class="heart heart-${state}" viewBox="0 0 24 24" focusable="false"><path class="heart-base" d="${path}"/><path class="heart-fill" d="${path}"/></svg>`;
    }).join('');
    element.innerHTML = `<span class="health-label">${label}</span><span class="heart-icons" aria-hidden="true">${hearts}</span>`;
  }
  function setScene(hero, monster, caption, heroHealth = 3, monsterHealth = null) {
    currentHeroHealth = heroHealth;
    heroFrame(hero);
    sceneMonster.hidden = monster === null;
    if (monster !== null) monsterFrame(monster);
    renderHealth('#scene-hero-health', '모험가', heroHealth);
    renderHealth('#scene-monster-health', '슬라임', monsterHealth);
    $('#scene-caption').textContent = caption;
    $('#scene-caption').removeAttribute('aria-label');
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
    [4, 0, '필살기 준비!', 2.5, 1],
    [6, 0, '100m 자동 필살!', 2.5, 1],
    [6, 1, '필살기 적중!', 2.5, 0],
    [4, 3, '슬라임 패배!', 2.5, 0],
    [8, 3, '승리!', 2.5, 0]
  ];
  const stageDurations = [6, 6, 6, 6, 6, 6, 6, 6, 6, 8, 10, 6, 6];
  function clearUltimate() {
    titleImage.hidden = true;
    effectImage.hidden = true;
    impactImage.hidden = true;
    sceneHero.classList.remove('ultimate-ready', 'ultimate-hit');
    sceneHero.style.removeProperty('transform');
  }
  function showStage(index) {
    clearUltimate();
    setScene(...battleStages[index]);
    if (index === 9 || index === 10) {
      $('#scene-caption').setAttribute('aria-label', `${battleStages[index][2]} ${ultimateNames[selectedHero]}`);
      titleImage.src = `images/demo/title-${selectedHero}.webp`;
      titleImage.hidden = false;
      sceneHero.classList.add(index === 9 ? 'ultimate-ready' : 'ultimate-hit');
    }
    if (index === 10) {
      effectImage.src = `images/demo/${effects[selectedHero][0]}.webp`;
      effectImage.hidden = false;
      effectImage.style.left = selectedHero === 'mage' ? '67%' : '52%';
      if (effects[selectedHero][1]) {
        impactImage.src = `images/demo/${effects[selectedHero][1]}.webp`;
        impactImage.hidden = false;
      }
    }
  }
  function resetScene() { battleTick = -1; returnTicks = -1; reducedStep = -1; clearUltimate(); setScene(4, null, '달릴 준비 완료'); }
  function loadImage(src) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = resolve; image.onerror = reject; image.src = src; }); }
  sceneHero.style.backgroundImage = `url('images/demo/${selectedHero}-sprite.webp')`;
  Promise.all([...Object.keys(heroes).map((key) => loadImage(`images/demo/${key}-sprite.webp`)), loadImage('images/demo/slime-sprite.webp'), ...Object.keys(heroes).map((key) => loadImage(`images/demo/title-${key}.webp`)), ...Object.values(effects).flat().filter(Boolean).map((name) => loadImage(`images/demo/${name}.webp`))]).then(() => {
    assetsReady = true;
    $('#scene-loading').hidden = true;
    resetScene();
    syncMotion();
  }).catch(() => { $('#scene-loading').textContent = '모험가 이미지를 불러오지 못했어요. 새로고침해 주세요.'; });

  function updateDistance() {
    const tenths = Math.min(maxTenths, Math.max(0, Math.round(Number(distance.value) * 10)));
    const km = tenths / 10;
    const percent = tenths * 100 / maxTenths;
    distance.value = km.toFixed(1);
    $('#distance-output').textContent = km.toFixed(1);
    $('#remaining-output').textContent = ((maxTenths - tenths) / 10).toFixed(1);
    $('#percent-output').textContent = String(percent);
    distance.setAttribute('aria-valuetext', `${km.toFixed(1)}킬로미터, 전체의 ${percent}퍼센트`);
  }
  // Keep the panorama and distance independent: combat can add distance without moving the scenery.
  function renderCamera() {
    const { width, height } = scene.getBoundingClientRect();
    cameraRange = Math.max(1, height * 3 - width);
    sceneBackground.style.backgroundSize = 'auto 100%';
    sceneBackground.style.backgroundPosition = `${-cameraPosition * cameraRange}px 0px`;
  }
  function cameraFromDistance() {
    cameraPosition = Number(distance.value) / (maxTenths / 10) * 0.5;
    renderCamera();
  }
  function stopCamera() {
    if (cameraFrame !== null) cancelAnimationFrame(cameraFrame);
    cameraFrame = null;
    cameraTime = null;
  }
  function moveCamera(time) {
    if (cameraTime !== null) {
      cameraPosition = Math.min(1, cameraPosition + 20 * Math.min(time - cameraTime, 100) / 1000 / cameraRange);
      renderCamera();
    }
    cameraTime = time;
    cameraFrame = requestAnimationFrame(moveCamera);
  }
  function syncCamera() {
    const shouldMove = !reduced && timer !== null && battleTick < 0 && (playing || returnTicks >= 0);
    if (shouldMove && cameraFrame === null) cameraFrame = requestAnimationFrame(moveCamera);
    else if (!shouldMove) stopCamera();
  }
  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    stopCamera();
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
    stopCamera();
    playing = false;
    paused = true;
    playButton.innerHTML = '▶ <span>이어 재생</span>';
    playButton.setAttribute('aria-label', manualPreview ? '전투 시연 이어 재생' : '가상 여정 이어 재생');
  }
  function finish() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    stopCamera();
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
  distance.addEventListener('input', () => { stop(); updateDistance(); cameraFromDistance(); });
  function startTimer() {
    timer = setInterval(() => {
      ticks += 1;
      if (playing && !automaticBattleShown && ticks >= 25 && battleTick < 0 && returnTicks < 0) {
        battleTick = 0;
        battleIsPreview = false;
        automaticBattleShown = true;
      }
      if (battleTick >= 0) {
        let elapsed = battleTick;
        let stage = 0;
        while (stage < stageDurations.length && elapsed >= stageDurations[stage]) { elapsed -= stageDurations[stage]; stage += 1; }
        if (stage < battleStages.length) {
          if (elapsed === 0) {
            showStage(stage);
            if (stage === 10 && playing && !battleIsPreview) {
              distance.value = Math.min(maxTenths / 10, (Math.round(Number(distance.value) * 10) + 1) / 10);
              updateDistance();
            }
          }
          if (stage === 9) sceneHero.style.transform = `translate(${4 + elapsed}px, ${-elapsed}px)`;
          if (stage === 10) {
            sceneHero.style.transform = `translate(${12 + elapsed}px, ${-7 + Math.min(elapsed, 7)}px)`;
            if (selectedHero !== 'mage') effectImage.style.left = `${52 + elapsed * 1.5}%`;
          }
          battleTick += 1;
        }
        else {
          battleTick = -1;
          returnTicks = 0;
          frame = 0;
          clearUltimate();
          setScene(0, null, '다시 달려요!', 2.5);
        }
      } else if (returnTicks >= 0) {
        returnTicks += 1;
        if (returnTicks % 2 === 0) { frame = (frame + 1) % 4; heroFrame(frame); }
        if (returnTicks >= 8) {
          returnTicks = -1;
          if (!playing || Number(distance.value) >= maxTenths / 10) { finish(); return; }
        }
      } else if (playing) {
        if (ticks % 2 === 0) { frame = (frame + 1) % 4; heroFrame(frame); }
        if (ticks % 4 === 0) {
          const next = (Math.round(Number(distance.value) * 10) + 1) / 10;
          if (next >= maxTenths / 10) {
            if (automaticBattleShown) { battleTick = 0; battleIsPreview = false; }
          } else { distance.value = next; updateDistance(); }
        }
      }
      syncCamera();
    }, 100);
    syncCamera();
  }
  playButton.addEventListener('click', () => {
    if (timer !== null) { pause(); return; }
    if (!paused) {
      const health = currentHeroHealth;
      stop();
      if (Number(distance.value) >= maxTenths / 10) { distance.value = '0'; cameraFromDistance(); }
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
      cameraFromDistance();
      ticks = 0;
      manualPreview = true;
      playButton.innerHTML = 'Ⅱ <span>일시 정지</span>';
      playButton.setAttribute('aria-label', '전투 시연 일시 정지');
      startTimer();
    }
    returnTicks = -1;
    battleIsPreview = true;
    battleTick = 0;
    syncCamera();
    showStage(0);
  });
  $('#reset-button').addEventListener('click', () => { stop(); distance.value = '0'; updateDistance(); cameraFromDistance(); });
  motionButton.addEventListener('click', () => { reduced = !reduced; syncMotion(); });
  preference.addEventListener?.('change', (event) => { reduced = event.matches; syncMotion(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); stopAudio(); } });
  window.addEventListener('pagehide', () => { stop(); stopAudio(); });
  window.addEventListener('resize', renderCamera);

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
  renderCamera();
  syncMotion();
})();
