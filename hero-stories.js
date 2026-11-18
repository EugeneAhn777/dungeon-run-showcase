(() => {
  'use strict';

  const stories = window.DUNGEON_RUN_STORIES || {};
  const heroGallery = document.getElementById('hero-stories');
  const lumiGallery = document.getElementById('lumi-stories');

  function showStory(gallery, key) {
    if (!gallery) return false;
    const story = stories[key];
    const scenes = Array.isArray(story?.scenes) ? story.scenes.filter((scene) => scene && scene.src) : [];
    if (!scenes.length) {
      gallery.hidden = true;
      return false;
    }

    const image = gallery.querySelector('[data-story-image]');
    const choices = gallery.querySelector('[data-story-choices]');
    if (gallery === heroGallery) {
      const name = document.getElementById('hero-detail-title').textContent;
      document.getElementById('hero-stories-heading').textContent = `${name}의 순간들`;
    }
    gallery.querySelector('[data-story-tagline]').textContent = story.tagline || '';
    choices.replaceChildren();

    function selectScene(index) {
      const scene = scenes[index];
      image.src = scene.src;
      image.alt = scene.alt || '';
      if (scene.width && scene.height) {
        image.width = scene.width;
        image.height = scene.height;
      } else {
        image.removeAttribute('width');
        image.removeAttribute('height');
      }
      gallery.querySelector('[data-story-category]').textContent = scene.category || '';
      gallery.querySelector('[data-story-title]').textContent = scene.title || '';
      gallery.querySelector('[data-story-text]').textContent = scene.text || '';
      choices.querySelectorAll('button').forEach((button, buttonIndex) => {
        button.setAttribute('aria-pressed', String(buttonIndex === index));
      });
    }

    scenes.forEach((scene, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'story-choice';
      button.textContent = scene.category || scene.title || `장면 ${index + 1}`;
      if (scene.category && scene.title) button.setAttribute('aria-label', `${scene.category}: ${scene.title}`);
      button.setAttribute('aria-controls', gallery.id);
      button.addEventListener('click', () => selectScene(index));
      choices.append(button);
    });
    selectScene(0);
    gallery.hidden = false;
    return true;
  }

  document.querySelectorAll('.character-card').forEach((card) => {
    card.addEventListener('click', (event) => {
      const visible = showStory(heroGallery, card.dataset.hero);
      if (visible && event.detail > 0 && window.matchMedia('(max-width: 600px)').matches) {
        const bounds = heroGallery.getBoundingClientRect();
        if (bounds.top < 110 || bounds.top > window.innerHeight - 100) {
          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-reduced') || document.body.classList.contains('motion-reduced');
          heroGallery.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        }
      }
    });
  });

  const selected = document.querySelector('.character-card.is-selected');
  if (selected) showStory(heroGallery, selected.dataset.hero);
  showStory(lumiGallery, 'lumi');
})();
