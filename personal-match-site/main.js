(() => {
  'use strict';

  // All preferences stay in memory; clipboard access only writes the public address on click.
  const root = document.documentElement;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionToggle = document.getElementById('motion-toggle');
  const motionIcon = document.getElementById('motion-icon');
  const revealTargets = [...document.querySelectorAll('.section-heading, .player-card, .trait, .wish, .relationship h2, .contact-layout')];
  let manualPaused = false;
  let responseAnimation;
  const motionPaused = () => manualPaused || motionQuery.matches;

  function updateMotion() {
    const paused = motionPaused();
    root.classList.toggle('motion-paused', paused);
    if (paused) {
      responseAnimation?.cancel();
      revealTargets.forEach(node => node.classList.add('is-visible'));
    }
    if (motionToggle) {
      motionToggle.hidden = motionQuery.matches;
      motionToggle.setAttribute('aria-pressed', String(paused));
      const label = paused ? '播放页面动画' : '暂停页面动画';
      motionToggle.setAttribute('aria-label', label);
      motionToggle.title = label;
    }
    if (motionIcon) motionIcon.textContent = paused ? '▶' : 'Ⅱ';
  }
  updateMotion();
  motionQuery.addEventListener('change', updateMotion);
  motionToggle?.addEventListener('click', () => {
    manualPaused = !manualPaused;
    updateMotion();
  });
  const updateVisibility = () => {
    root.classList.toggle('page-hidden', document.hidden);
    if (document.hidden) responseAnimation?.cancel();
  };
  document.addEventListener('visibilitychange', updateVisibility);
  updateVisibility();

  if ('IntersectionObserver' in window && !motionQuery.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -30px 0px' });
    root.classList.add('reveal-ready');
    revealTargets.forEach(node => {
      node.classList.add('reveal-target');
      observer.observe(node);
    });
  }

  const emailAddress = document.getElementById('email-address');
  const email = emailAddress?.textContent.trim();
  const copyButton = document.getElementById('copy-email');
  const copyStatus = document.getElementById('copy-status');
  let copyTimer;
  if (copyButton && emailAddress && email && copyStatus) {
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      clearTimeout(copyTimer);
      copyButton.disabled = true;
      let copied = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(email);
          copied = true;
        }
      } catch {
        // Some local files or browser permissions require the selected-text fallback.
      }
      if (!copied) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(emailAddress);
        selection?.removeAllRanges();
        selection?.addRange(range);
        try { copied = document.execCommand('copy'); } catch { copied = false; }
        if (copied) selection?.removeAllRanges();
      }
      copyButton.disabled = false;
      copyButton.classList.toggle('is-copied', copied);
      copyButton.querySelector('span').textContent = copied ? '已复制' : '复制';
      copyStatus.textContent = copied
        ? `已复制 ${email}，可以粘贴到邮箱或聊天窗口。`
        : '自动复制未完成，已选中完整邮箱，请长按或手动复制。';
      copyTimer = setTimeout(() => {
        copyButton.classList.remove('is-copied');
        copyButton.querySelector('span').textContent = '复制';
      }, 2200);
    });
  }

  const quests = {
    walk: { response: '第一站：找一条舒服的小路，慢慢聊。', topic: '一起散步' },
    game: { response: '第一关：不用急着赢，先一起玩得开心。', topic: '双人游戏' },
    meal: { response: '第一餐：你来选小店，我来认真期待。', topic: '好好吃饭' },
  };
  const picker = document.getElementById('quest-picker');
  const response = document.getElementById('quest-response');
  const hello = document.getElementById('hello-link');
  const wishCards = [...document.querySelectorAll('.wish')];
  if (!picker || !response || !hello || !email) return;

  function chooseQuest(key, animate = true) {
    const quest = quests[key];
    if (!quest) return;
    picker.querySelectorAll('button').forEach(option => {
      option.setAttribute('aria-pressed', String(option.dataset.quest === key));
    });
    wishCards.forEach((card, index) => {
      card.classList.toggle('is-selected', Object.keys(quests)[index] === key);
    });
    response.textContent = quest.response;
    responseAnimation?.cancel();
    if (animate && !motionPaused() && !document.hidden && response.animate) {
      responseAnimation = response.animate([
        { opacity: .3, transform: 'translateY(5px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 260, easing: 'ease-out' });
    }
    const subject = encodeURIComponent(`来自二号玩家的你好 · ${quest.topic}`);
    const body = encodeURIComponent(`你好 Breeze，看到你的双人邀请函，想从「${quest.topic}」聊起。`);
    hello.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  picker.hidden = false;
  chooseQuest('walk', false);
  picker.addEventListener('click', event => {
    const button = event.target.closest('button[data-quest]');
    if (!button || !picker.contains(button)) return;
    chooseQuest(button.dataset.quest);
  });
})();
