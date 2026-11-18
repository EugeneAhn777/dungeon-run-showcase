window.DUNGEON_RUN_STORIES = (() => {
  const scene = (file, title, alt, width = 1152, height = 648) => ({
    src: `images/characters/${file}.webp`, title, alt, width, height
  });
  return {
    swordsman: {
      tagline: '푸른 망토를 휘날리며 모험의 첫발을 내딛는 검사.',
      scenes: [
        scene('swordsman-riverside', '강가의 짧은 여유', '햇살이 비치는 강가에서 뒤를 돌아보며 미소 짓는 검사'),
        scene('swordsman-draw', '검에 손을 얹고', '검집에서 칼날을 반쯤 뽑은 채 달리는 검사'),
        scene('swordsman-ready', '길을 열어라', '푸른 망토를 휘날리며 검을 완전히 뽑아 든 검사'),
        scene('swordsman-swing', '멈추지 않는 발걸음', '달리던 기세 그대로 검을 휘두르는 검사')
      ]
    },
    shield: {
      tagline: '한 걸음 앞에 서서, 든든한 방패로 동료의 길을 지키는 전사.',
      scenes: [
        scene('shield-action', '빗속의 방패막기', '쏟아지는 비 속에서 방패로 거대한 바위를 막아내는 방패 여전사'),
        scene('shield-cat', '훈련보다 낮잠', '방패 위에 늘어져 잠든 고양이를 지켜보는 방패 여전사'),
        scene('shield-charge', '방패를 앞세워', '푸른 하늘 아래에서 검과 방패를 들고 달려드는 방패 여전사'),
        scene('shield-barrier', '성문의 황금 결계', '성문 앞에서 방패를 앞세워 벌집 모양의 황금빛 결계를 펼치는 방패 여전사')
      ]
    },
    elf: {
      tagline: '바람의 방향을 살피고, 멀리서도 한 발로 길을 여는 궁수.',
      scenes: [
        scene('elf-action', '협곡을 가르는 화살', '해 질 무렵 높은 협곡 가장자리에서 건너편을 향해 활을 쏘는 엘프 궁수'),
        scene('elf-birds', '화살통의 새 식구', '엘프 궁수의 화살통에 둥지를 튼 어린 새들과 머리 위에 앉은 새'),
        scene('elf-aim', '놓기 직전의 한 발', '강가에서 활시위를 당겨 조준하는 엘프 궁수'),
        scene('elf-wind', '바람의 길 읽기', '달빛 아래 손바닥 위의 나뭇잎으로 바람을 읽는 엘프 궁수')
      ]
    },
    mage: {
      tagline: '화려한 불꽃부터 작은 소환 사고까지, 지팡이 끝이 늘 바쁜 마법사.',
      scenes: [
        scene('mage-phoenix', '옥상의 불사조', '노을빛 옥상에서 불꽃의 불사조를 불러낸 마법사'),
        scene('mage-stars', '별자리 조율', '서고에서 지팡이와 손끝 사이에 별자리 모양의 마법진을 조율하는 마법사'),
        scene('mage-cast', '앗, 너무 셌나?', '뜰에서 튀어 오른 둥근 불꽃을 보고 놀라는 마법사'),
        scene('mage-chick', '대마법의 결과는 병아리', '커다란 황금빛 마법진 한가운데 작은 불꽃 병아리가 나타난 모습')
      ]
    },
    lumi: {
      tagline: '응원을 건네고, 힘이 빠질 때 곁을 지키는 작은 동료.',
      scenes: [
        scene('lumi-guide', '루미가 길을 안내해요', '숲길 갈림길에서 공중에 떠 한 손으로 길을 가리키는 루미'),
        scene('lumi-map', '지도야, 어디 가!', '돌풍에 휘날리는 커다란 지도를 붙잡고 당황한 루미'),
        scene('lumi-prayer', '루미의 기도', '반투명한 날개를 펼치고 두 손을 모아 따뜻한 빛을 밝히는 루미', 640, 360),
        scene('lumi-party', '작은 동료의 큰 응원', '네 모험가의 한가운데서 커다란 황금빛 원을 밝히는 루미', 1152, 649)
      ]
    },
    guild: {
      scenes: [
        scene('guild-clerk-action', '길드누나 · 밤샘 원정 지휘', '커다란 지도 앞에서 손짓하며 원정 계획을 안내하는 길드 접수원'),
        scene('guild-clerk-letters', '길드누나 · 편지 소동', '편지 한 장을 이마에 붙인 채 날아가는 편지를 붙잡는 길드 접수원'),
        scene('guild-master-rescue', '길드마스터 · 폭풍 속 구조', '폭우가 쏟아지는 바위 위에서 밧줄을 단단히 잡고 버티는 길드마스터'),
        scene('guild-master-guest', '길드마스터 · 돋보기 아래 숨은 손님', '탁자 위 지도에 잠든 고슴도치를 돋보기로 살피는 길드마스터')
      ]
    }
  };
})();
