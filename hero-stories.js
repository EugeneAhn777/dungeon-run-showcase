(() => {
  'use strict';

  const stories = window.DUNGEON_RUN_STORIES || {};
  const heroGallery = document.getElementById('hero-stories');
  function showStory(gallery, key) {
    const story = stories[key];
    if (!gallery || !story?.scenes?.length) return false;
    if (gallery === heroGallery) {
      const name = document.getElementById('hero-detail-title').textContent;
      gallery.querySelector('h3').textContent = name + '의 순간들';
    }
    const tagline = gallery.querySelector('[data-story-tagline]');
    if (tagline) {
      tagline.textContent = story.tagline || '';
      tagline.hidden = !story.tagline;
    }

    const figures = story.scenes.map(({src, alt, title, width, height}) => {
      const frame = document.createElement('div');
      frame.className = 'story-image-frame';
      const image = document.createElement('img');
      image.width = width;
      image.height = height;
      image.alt = alt;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.src = src;
      frame.append(image);
      const caption = document.createElement('figcaption');
      caption.textContent = title;
      const figure = document.createElement('figure');
      figure.append(frame, caption);
      return figure;
    });
    gallery.querySelector('.story-grid').replaceChildren(...figures);
    gallery.hidden = false;
    return true;
  }

  for (const card of document.querySelectorAll('.character-card')) {
    card.addEventListener('click', (event) => {
      if (!showStory(heroGallery, card.dataset.hero)) return;
      if (event.detail > 0 && window.matchMedia('(max-width: 600px)').matches) {
        const {top} = heroGallery.getBoundingClientRect();
        if (top < 100 || top > innerHeight - 140) {
          const reduced = document.documentElement.classList.contains('motion-reduced') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          heroGallery.scrollIntoView({block: 'start', behavior: reduced ? 'instant' : 'smooth'});
        }
      }
    });
  }

  const selected = document.querySelector('.character-card.is-selected');
  if (selected) showStory(heroGallery, selected.dataset.hero);
  showStory(document.getElementById('lumi-stories'), 'lumi');
  showStory(document.getElementById('guild-stories'), 'guild');
})();
