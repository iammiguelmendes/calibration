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

    // ── Hero canvas animation ────────────────────────────────────────────────
    const canvas = document.getElementById('hvCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const C = '#00ff9d';

        // [startAngle, pulsePhase] per node
        const orbitals = [
            { r: 66,  speed:  0.38, nodes: [[0, 0.0], [Math.PI, 1.9]] },
            { r: 126, speed: -0.22, nodes: [[0, 0.7], [2.09, 2.5], [4.19, 4.2]] },
            { r: 192, speed:  0.14, nodes: [[0, 1.3], [1.57, 3.1], [3.14, 0.5], [4.71, 2.8]] },
        ];

        let t = 0;
        let mouseX = null, mouseY = null;
        let offsetX = 0, offsetY = 0, rotateOffset = 0; // smoothed parallax state

        function resize() {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        const EXTEND = 260; // canvas extends this many px to the left of hero-visual
        const heroVisual = canvas.parentElement;
        const heroSection = heroVisual.closest('section');
        heroSection?.addEventListener('mousemove', e => {
            const r = heroVisual.getBoundingClientRect();
            mouseX = e.clientX - r.left;  // relative to hero-visual, not canvas
            mouseY = e.clientY - r.top;
        });
        heroSection?.addEventListener('mouseleave', () => { mouseX = null; mouseY = null; });

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const visualW = canvas.width - EXTEND;
            const baseCx  = EXTEND + visualW / 2; // center of hero-visual within extended canvas
            const baseCy  = canvas.height / 2;

            // Mouse coords are relative to hero-visual; convert to offset from visual center
            const targetX = mouseX != null ? (mouseX - visualW / 2) * 0.08 : 0;
            const targetY = mouseY != null ? (mouseY - baseCy)       * 0.08 : 0;
            const targetR = mouseX != null ? (mouseX - visualW / 2) * 0.00013 : 0; // max ~1.5deg
            offsetX    += (targetX - offsetX)    * 0.05;
            offsetY    += (targetY - offsetY)    * 0.05;
            rotateOffset += (targetR - rotateOffset) * 0.03;

            const cx = baseCx + offsetX;
            const cy = baseCy + offsetY;

            // Apply subtle rotation around the composition center
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rotateOffset);
            ctx.translate(-cx, -cy);

            // Center glow
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 58);
            grd.addColorStop(0, 'rgba(0,255,157,0.18)');
            grd.addColorStop(1, 'rgba(0,255,157,0)');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(cx, cy, 58, 0, Math.PI * 2);
            ctx.fill();

            // Center dot
            ctx.fillStyle = C;
            ctx.beginPath();
            ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
            ctx.fill();

            // Collect all particle positions
            const pts = [];
            orbitals.forEach(orb => {
                // Ring
                ctx.strokeStyle = 'rgba(0,255,157,0.06)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(cx, cy, orb.r, 0, Math.PI * 2);
                ctx.stroke();

                orb.nodes.forEach(([startAngle, pulsePhase]) => {
                    const a  = startAngle + t * orb.speed;
                    const px = cx + Math.cos(a) * orb.r;
                    const py = cy + Math.sin(a) * orb.r;
                    pts.push({ x: px, y: py });

                    // Pulsing node dot — radius and opacity breathe on independent phases
                    const pulse  = 1 + 0.45 * (Math.sin(t * 2.2 + pulsePhase) * 0.5 + 0.5);
                    const alpha  = 0.55 + 0.35 * (Math.sin(t * 1.8 + pulsePhase + 1) * 0.5 + 0.5);
                    ctx.fillStyle   = C;
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.arc(px, py, 3 * pulse, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                });
            });

            // Connection lines between nearby nodes
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx   = pts[i].x - pts[j].x;
                    const dy   = pts[i].y - pts[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 156) {
                        ctx.strokeStyle = C;
                        ctx.globalAlpha = (1 - dist / 156) * 0.12;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(pts[i].x, pts[i].y);
                        ctx.lineTo(pts[j].x, pts[j].y);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                }
            }

            ctx.restore(); // end rotation transform

            // Lines from center to each node on innermost ring
            orbitals[0].nodes.forEach(([startAngle]) => {
                const a  = startAngle + t * orbitals[0].speed;
                const px = cx + Math.cos(a) * orbitals[0].r;
                const py = cy + Math.sin(a) * orbitals[0].r;
                ctx.strokeStyle = C;
                ctx.globalAlpha = 0.08;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(px, py);
                ctx.stroke();
                ctx.globalAlpha = 1;
            });

            t += 0.008;
            if (!prefersReducedMotion) requestAnimationFrame(draw);
        }
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) draw();
    }

    // ── Sticky header scroll animation ──────────────────────────────────────
    const header = document.querySelector('header');
    if (header) {
        const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // set correct state on load
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
