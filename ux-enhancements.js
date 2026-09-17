(() => {
    'use strict';

    const bar = document.querySelector('.reading-progress__bar');
    let ticking = false;

    const updateProgress = () => {
        if (!bar) return;

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

    if (bar) {
        updateProgress();
        window.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', requestUpdate);
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('motion-enabled');

    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const selectors = [
        '.section-heading',
        '.fragmentation-map',
        '.problem-copy',
        '.impact-card',
        '.identity__copy',
        '.generic-image-card',
        '.process-step',
        '.persona-card',
        '.feature-card',
        '.operational-outcomes__intro',
        '.operational-outcome',
        '.security-copy',
        '.security-card',
        '.ownership__visual',
        '.ownership__copy',
        '.qr-section__copy',
        '.public-preview',
        '.fit-card',
        '.migration-copy',
        '.migration-board',
        '.plans-intro',
        '.plan-card',
        '.faq-copy',
        '.faq-list',
        '.contact-copy',
        '.lead-form'
    ];

    const elements = [...document.querySelectorAll(selectors.join(','))];
    const groupedParents = new Map();

    elements.forEach((element) => {
        element.classList.add('reveal-item');

        if (element.matches('.impact-card, .process-step, .persona-card, .feature-card, .operational-outcome, .security-card, .plan-card')) {
            const parent = element.parentElement;
            if (!groupedParents.has(parent)) groupedParents.set(parent, []);
            groupedParents.get(parent).push(element);
        } else {
            element.classList.add('reveal-soft');
        }
    });

    groupedParents.forEach((children) => {
        children.forEach((element, index) => {
            element.style.setProperty('--reveal-delay', `${Math.min(index * 55, 220)}ms`);
        });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, {
        rootMargin: '0px 0px -9% 0px',
        threshold: 0.08
    });

    elements.forEach((element) => observer.observe(element));
})();
