(() => {
    'use strict';

    const bar = document.querySelector('.reading-progress__bar');
    if (!bar) return;

    let ticking = false;

    const updateProgress = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? Math.min(Math.max(window.scrollY / scrollable, 0), 1) : 0;

        bar.style.transform = `scaleX(${progress})`;
        ticking = false;
    };

    const requestUpdate = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
})();
