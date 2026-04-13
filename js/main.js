/* =============================================
   FRENVOX - Main JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

    // --- Navbar scroll effect ---
    const navbar = document.getElementById('navbar');

    const handleNavScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    };

    window.addEventListener('scroll', handleNavScroll, { passive: true });

    // --- Mobile menu toggle ---
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('open');
    });

    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('open');
        });
    });

    // --- Active nav link on scroll ---
    const sections = document.querySelectorAll('section[id]');

    const updateActiveLink = () => {
        const scrollY = window.scrollY + 100;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-link[href="#${id}"]`);

            if (link) {
                link.classList.toggle('active', scrollY >= top && scrollY < top + height);
            }
        });
    };

    window.addEventListener('scroll', updateActiveLink, { passive: true });

    // --- Scroll reveal animations ---
    const revealElements = document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // --- Hero particles ---
    const particlesContainer = document.getElementById('heroParticles');

    const createParticle = () => {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        const size = Math.random() * 3 + 1;
        const x = Math.random() * 100;
        const duration = Math.random() * 8 + 6;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x}%`;
        particle.style.bottom = '0';
        particle.style.animationDuration = `${duration}s`;

        particlesContainer.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, duration * 1000);
    };

    // Generate particles periodically
    const particleInterval = setInterval(createParticle, 400);

    // Initial batch
    for (let i = 0; i < 15; i++) {
        setTimeout(createParticle, i * 200);
    }

    // Clean up on page hide
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(particleInterval);
        }
    });

    // --- Contact form handler ---
    const contactForm = document.getElementById('contactForm');

    contactForm.addEventListener('submit', () => {
        const btn = contactForm.querySelector('.submit-button');
        btn.textContent = '送信中...';
        btn.disabled = true;
    });

    // --- Service cards stagger animation ---
    const serviceCards = document.querySelectorAll('.service-card.reveal-up');
    serviceCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });

    // --- Value cards: stagger, interactive glow, count-up ---
    const valueCards = document.querySelectorAll('.value-card');
    valueCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.12}s`;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const mx = ((e.clientX - rect.left) / rect.width) * 100;
            const my = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mx', `${mx}%`);
            card.style.setProperty('--my', `${my}%`);
        });

        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--mx', `50%`);
            card.style.setProperty('--my', `0%`);
        });
    });

    const animateCount = (el) => {
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        if (Number.isNaN(target)) return;

        const duration = 1600;
        const startTime = performance.now();

        const tick = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(target * eased);
            el.textContent = `${current}${suffix}`;
            if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    };

    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCount(entry.target);
                statObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.value-stat-num[data-target]').forEach(el => statObserver.observe(el));
});
