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
        linkedin.innerHTML = '<svg class="ti-svg" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 11v5" /><path d="M8 8v.01" /><path d="M12 16v-5" /><path d="M16 16v-3a2 2 0 1 0 -4 0" /><path d="M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4l0 -10" /></svg> LinkedIn';
        companyFooter.appendChild(linkedin);
    }

    document.querySelectorAll('.section-index').forEach((index) => {
        index.setAttribute('aria-hidden', 'true');
    });

    const securityCards = document.querySelector('#seguridad .security-cards');
    if (securityCards && !document.querySelector('#seguridad .security-transparency')) {
        const note = document.createElement('div');
        note.className = 'security-transparency';
        note.innerHTML = `
            <span class="security-transparency__icon" aria-hidden="true"><svg class="ti-svg" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15.065 19.732c-.95 .557 -1.98 .986 -3.065 1.268a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3c.51 1.738 .617 3.55 .333 5.303" /><path d="M19 22v.01" /><path d="M19 19a2.003 2.003 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" /></svg></span>
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

    const leadForm = document.getElementById('lead-form');
    if (leadForm) {
        const statusEl = leadForm.querySelector('.lead-form__status');
        const submitBtn = leadForm.querySelector('button[type="submit"]');
        const submitLabel = submitBtn ? submitBtn.textContent : '';

        const setStatus = (message, kind) => {
            if (!statusEl) return;
            statusEl.textContent = message;
            statusEl.classList.remove('is-success', 'is-error');
            if (kind) statusEl.classList.add(`is-${kind}`);
        };

        leadForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (leadForm.querySelector('.lead-form__honeypot')?.checked) return;

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando…';
            }
            setStatus('', null);

            try {
                const formData = new FormData(leadForm);
                const response = await fetch(leadForm.action, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json().catch(() => ({}));

                if (response.ok && result.success !== false) {
                    leadForm.reset();
                    setStatus('Listo. Recibimos tu solicitud y te contactaremos a la brevedad.', 'success');
                } else {
                    setStatus('No pudimos enviar tu solicitud. Escríbenos directo a contacto@enlacepro.cl.', 'error');
                }
            } catch (error) {
                setStatus('No pudimos enviar tu solicitud. Escríbenos directo a contacto@enlacepro.cl.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitLabel;
                }
            }
        });
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
