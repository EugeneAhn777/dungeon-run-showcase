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
  const messages = ['오늘의 한 걸음도 멋진 모험이에요!', '잘하고 있어요! 우리 함께 끝까지 가봐요!', '천천히 가도 괜찮아요. 루미가 곁에 있어요!', '한 걸음 더! 새로운 이야기가 기다려요!'];
  let messageIndex = 0;
  let cheering = false;

  function updateDistance() {
    const tenths = Math.min(100, Math.max(0, Math.round(Number(distance.value) * 10)));
    const km = tenths / 10;
    distance.value = km.toFixed(1);
    $('#distance-output').textContent = km.toFixed(1);
    $('#remaining-output').textContent = ((100 - tenths) / 10).toFixed(1);
    $('#percent-output').textContent = String(tenths);
    $('#scene-progress').style.width = `${tenths}%`;
    $('#traveler').style.left = `${tenths}%`;
    distance.setAttribute('aria-valuetext', `${km.toFixed(1)}킬로미터, 전체의 ${tenths}퍼센트`);
    if (tenths === 100) stop();
  }
  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    playButton.innerHTML = '▶ <span>자동 재생</span>';
    playButton.setAttribute('aria-label', '가상 여정 자동 재생');
  }
  function syncMotion() {
    document.documentElement.classList.toggle('motion-reduced', reduced);
    motionButton.setAttribute('aria-pressed', String(reduced));
    motionButton.textContent = reduced ? '움직임 줄이기 켜짐' : '움직임 줄이기';
    if (reduced) stop();
    playButton.disabled = reduced;
    playButton.title = reduced ? '자동 재생을 사용하려면 움직임 줄이기를 꺼주세요.' : '';
  }
  distance.addEventListener('input', () => { stop(); updateDistance(); });
  playButton.addEventListener('click', () => {
    if (timer !== null) { stop(); return; }
    if (Number(distance.value) >= 10) distance.value = '0';
    updateDistance();
    playButton.innerHTML = 'Ⅱ <span>일시 정지</span>';
    playButton.setAttribute('aria-label', '가상 여정 일시 정지');
    timer = setInterval(() => {
      distance.value = (Math.round(Number(distance.value) * 10) + 1) / 10;
      updateDistance();
    }, 250);
  });
  $('#reset-button').addEventListener('click', () => { stop(); distance.value = '0'; updateDistance(); });
  motionButton.addEventListener('click', () => { reduced = !reduced; syncMotion(); });
  preference.addEventListener?.('change', (event) => { reduced = event.matches; syncMotion(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

  $$('.character-card').forEach((button) => button.addEventListener('click', () => {
    const key = button.dataset.hero;
    const hero = heroes[key];
    $$('.character-card').forEach((item) => { const selected = item === button; item.classList.toggle('is-selected', selected); item.setAttribute('aria-pressed', String(selected)); });
    $('#hero-detail-title').textContent = hero.name;
    $('#hero-detail-text').textContent = hero.text;
    $('#traveler-image').src = `images/${key}.png`;
    $('#traveler-name').textContent = hero.name;
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
  $('#cheer-button').addEventListener('click', () => {
    cheering = !cheering;
    messageIndex = (messageIndex + 1) % messages.length;
    $('#lumi-image').src = cheering ? 'images/lumi-cheer.png' : 'images/lumi-companion.png';
    $('#lumi-image').alt = cheering ? '응원하는 루미의 표정' : '루미의 기본 표정';
    $('#lumi-message').textContent = messages[messageIndex];
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
