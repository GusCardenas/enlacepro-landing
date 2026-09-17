(() => {
    'use strict';

    const tagline = 'Cada activo bajo control';

    document.title = `EnlacePro · ${tagline}`;

    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) {
        heroTitle.innerHTML = 'Cada activo <span>bajo control.</span>';
    }

    document.querySelectorAll('.brand-logo').forEach((logo) => {
        logo.alt = `EnlacePro · ${tagline}`;
    });

    const footerBottom = document.querySelector('.site-footer__bottom');
    if (footerBottom) {
        const footerTagline = footerBottom.querySelector('span:last-child');
        if (footerTagline) footerTagline.textContent = `${tagline}.`;
    }

    const companyFooter = [...document.querySelectorAll('.footer-links')].find((group) => {
        return group.querySelector('strong')?.textContent.trim() === 'Empresa';
    });

    if (companyFooter && !companyFooter.querySelector('a[href*="linkedin.com/company/enlacepro-cl"]')) {
        const linkedin = document.createElement('a');
        linkedin.href = 'https://www.linkedin.com/company/enlacepro-cl';
        linkedin.target = '_blank';
        linkedin.rel = 'noopener noreferrer';
        linkedin.innerHTML = '<i class="ti ti-brand-linkedin" aria-hidden="true"></i> LinkedIn';
        companyFooter.appendChild(linkedin);
    }

    const chapters = [
        { selector: '#problema .section-heading', number: '01', label: 'El problema' },
        { selector: '#producto .identity__copy', number: '02', label: 'El producto' },
        { selector: '#seguridad .security-copy', number: '03', label: 'Control y continuidad' },
        { selector: '.fit-section .fit-card__copy', number: '04', label: 'Adopción' },
        { selector: '#planes .plans-intro', number: '05', label: 'Evaluación' }
    ];

    document.querySelectorAll('.section-index').forEach((index) => {
        index.setAttribute('aria-hidden', 'true');
    });

    chapters.forEach(({ selector, number, label }) => {
        const target = document.querySelector(selector);
        if (!target || target.querySelector(':scope > .chapter-marker')) return;

        const marker = document.createElement('div');
        marker.className = 'chapter-marker';
        marker.setAttribute('aria-label', `Capítulo ${number}: ${label}`);
        marker.innerHTML = `<span class="chapter-marker__number">${number}</span>`;
        target.prepend(marker);
    });

    const securityCards = document.querySelector('#seguridad .security-cards');
    if (securityCards && !document.querySelector('#seguridad .security-transparency')) {
        const note = document.createElement('div');
        note.className = 'security-transparency';
        note.innerHTML = `
            <span class="security-transparency__icon" aria-hidden="true"><i class="ti ti-shield-question"></i></span>
            <p><strong>Transparencia sobre seguridad.</strong> EnlacePro no comunica certificaciones ni controles técnicos que aún no estén formalmente definidos y verificados. Las políticas de respaldo, cifrado, recuperación y otros controles se documentarán antes de asumir compromisos comerciales sobre ellos.</p>
        `;
        securityCards.insertAdjacentElement('afterend', note);
    }

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
        '.chapter-marker',
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
        '.security-transparency',
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
