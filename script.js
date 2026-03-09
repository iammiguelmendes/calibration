// Animated counter function
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'));
    const duration = 1500;
    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Animate counters
    const counters = document.querySelectorAll('[data-count]');
    setTimeout(() => {
        counters.forEach(counter => animateCounter(counter));
    }, 300);

    // Card click handlers
    document.querySelectorAll('.test-card').forEach(card => {
        card.addEventListener('click', () => {
            const testId = card.getAttribute('data-test');
            window.location.href = `${testId}.html`;
        });
    });

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        const cards = Array.from(document.querySelectorAll('.test-card'));
        const focusedCard = document.activeElement;
        const currentIndex = cards.indexOf(focusedCard);

        if (currentIndex === -1) return;

        let nextIndex;
        switch(e.key) {
            case 'ArrowRight':
                nextIndex = (currentIndex + 1) % cards.length;
                cards[nextIndex].focus();
                e.preventDefault();
                break;
            case 'ArrowLeft':
                nextIndex = (currentIndex - 1 + cards.length) % cards.length;
                cards[nextIndex].focus();
                e.preventDefault();
                break;
            case 'Enter':
                focusedCard.click();
                break;
        }
    });

    // Make cards focusable for keyboard navigation
    document.querySelectorAll('.test-card').forEach(card => {
        card.setAttribute('tabindex', '0');
    });
});