document.addEventListener('DOMContentLoaded', () => {
    // ── Card navigation ──────────────────────────────────────────────────────
    document.querySelectorAll('.test-card').forEach(card => {
        card.setAttribute('tabindex', '0');
        card.addEventListener('click', () => {
            window.location.href = card.getAttribute('data-test') + '.html';
        });
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
        });
    });
    document.addEventListener('keydown', e => {
        const cards = Array.from(document.querySelectorAll('.test-card'));
        const idx = cards.indexOf(document.activeElement);
        if (idx === -1) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); cards[(idx + 1) % cards.length].focus(); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); cards[(idx - 1 + cards.length) % cards.length].focus(); }
    });

    // ── Mouse parallax on hero visual ───────────────────────────────────────
    const hero   = document.getElementById('hero');
    const visual = document.getElementById('heroVisual');
    const hvCards = visual ? Array.from(visual.querySelectorAll('.hv-card')) : [];

    if (hero && visual && hvCards.length) {
        hero.addEventListener('mousemove', e => {
            const r  = visual.getBoundingClientRect();
            const cx = r.left + r.width  / 2;
            const cy = r.top  + r.height / 2;
            const dx = (e.clientX - cx) / (r.width  / 2);
            const dy = (e.clientY - cy) / (r.height / 2);
            hvCards.forEach(card => {
                const d  = parseFloat(card.dataset.d) || 0.5;
                card.style.setProperty('--px', (dx * d * 18) + 'px');
                card.style.setProperty('--py', (dy * d * 14) + 'px');
            });
        });
        hero.addEventListener('mouseleave', () => {
            hvCards.forEach(card => {
                card.style.setProperty('--px', '0px');
                card.style.setProperty('--py', '0px');
            });
        });
    }

    // ── Scroll parallax on ambient orbs ─────────────────────────────────────
    const orbA = document.getElementById('orbA');
    const orbB = document.getElementById('orbB');
    if (orbA || orbB) {
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            if (orbA) orbA.style.transform = `translateY(${y * 0.25}px)`;
            if (orbB) orbB.style.transform = `translateY(${y * 0.15}px)`;
        }, { passive: true });
    }
});
