// ================================
// FS Business Forum - Premium Interactions
// ================================

// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// ================================
// Initialize Lenis Smooth Scroll
// ================================
let lenis;

// Check if Lenis is available
if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
} else {
    // Fallback: create mock lenis object
    lenis = {
        stop: () => {},
        start: () => {},
        scrollTo: (target, options) => {
            // Handle scroll to top (position 0)
            if (target === 0 || target === '0') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            // Handle element targets
            const element = typeof target === 'string' ? document.querySelector(target) : target;
            if (element) {
                const offset = options?.offset || 0;
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition + offset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }
    };
}

// ================================
// Custom Cursor
// ================================
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');

let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateCursor() {
    // Smooth cursor movement
    cursorX += (mouseX - cursorX) * 0.2;
    cursorY += (mouseY - cursorY) * 0.2;
    followerX += (mouseX - followerX) * 0.1;
    followerY += (mouseY - followerY) * 0.1;

    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    cursorFollower.style.left = followerX + 'px';
    cursorFollower.style.top = followerY + 'px';

    requestAnimationFrame(animateCursor);
}
animateCursor();

// Cursor hover effects
const hoverElements = document.querySelectorAll('a, button, .speaker-card, .gallery-item, .partner-logo, .feature, .intro-skip');
hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursorFollower.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursorFollower.classList.remove('hover'));
});

// ================================
// Intro Video Animation
// ================================
const introOverlay = document.getElementById('introOverlay');
const introVideo = document.getElementById('introVideo');
const introSkip = document.getElementById('introSkip');

// Add intro-playing class to body
document.body.classList.add('intro-playing');

// Disable scrolling during intro
lenis.stop();

// Force video to load and start playing
introVideo.load();

// Handle video load error
introVideo.addEventListener('error', () => {
    console.log('Video failed to load, skipping intro');
    endIntro();
});

// Try to play the video immediately when it can play
introVideo.addEventListener('canplay', () => {
    introVideo.play().catch(e => {
        console.log('Autoplay failed:', e);
        endIntro();
    });
}, { once: true });

// Also try to play immediately
setTimeout(() => {
    introVideo.play().catch(e => {
        console.log('Initial play failed:', e);
    });
}, 100);

// Fallback: if video doesn't start within 3 seconds, skip
setTimeout(() => {
    if (!introOverlay.classList.contains('fade-out')) {
        if (introVideo.paused || introVideo.readyState < 2) {
            console.log('Video not playing, skipping intro');
            endIntro();
        }
    }
}, 3000);

// Handle video end
introVideo.addEventListener('ended', () => {
    endIntro();
});

// Fallback: End intro after video duration + buffer (in case 'ended' event doesn't fire)
introVideo.addEventListener('loadedmetadata', () => {
    const videoDuration = introVideo.duration;
    if (videoDuration && videoDuration > 0) {
        setTimeout(() => {
            if (!introOverlay.classList.contains('fade-out')) {
                console.log('Video duration timeout - ending intro');
                endIntro();
            }
        }, (videoDuration * 1000) + 2500); // Video duration + 2.5s buffer
    }
});

// Ultimate fallback: End intro after 8 seconds no matter what
setTimeout(() => {
    if (!introOverlay.classList.contains('fade-out')) {
        console.log('Ultimate timeout - ending intro');
        endIntro();
    }
}, 8000);

// Skip button functionality
introSkip.addEventListener('click', () => {
    endIntro();
});

// Keyboard skip (Enter or Space)
document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !introOverlay.classList.contains('fade-out')) {
        e.preventDefault();
        endIntro();
    }
});

function endIntro() {
    if (introOverlay.classList.contains('fade-out')) return; // Prevent double trigger

    // Start hero video playing before transition
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) {
        heroVideo.play().catch(() => {});
    }

    // Pre-initialize animations before visual transition
    initAnimations();

    // Use requestAnimationFrame for smoother transition
    requestAnimationFrame(() => {
        introOverlay.classList.add('fade-out');
        document.body.classList.remove('intro-playing');
        document.body.classList.add('intro-complete');

        // Re-enable scrolling after frame
        requestAnimationFrame(() => {
            lenis.start();
        });

    });

    // Remove intro overlay from DOM after animation completes
    setTimeout(() => {
        introOverlay.remove();
    }, 1400);
}

// ================================
// Navigation
// ================================
const nav = document.querySelector('.nav');
const navMenuBtn = document.querySelector('.nav-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

// Nav scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Mobile menu toggle
navMenuBtn.addEventListener('click', () => {
    navMenuBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
});

// Close mobile menu on link click
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            // Get nav height dynamically and add extra padding for section headings
            const navHeight = nav.offsetHeight;
            const extraPadding = 20; // Extra space so headline isn't right under nav
            const offset = -(navHeight + extraPadding);
            lenis.scrollTo(target, { offset: offset });
        }
    });
});

// ================================
// Initialize Animations
// ================================
function initAnimations() {
    // Hero animations
    const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    heroTl
        .to('.hero-badge', { opacity: 1, y: 0, duration: 0.8 })
        .to('.title-line', { opacity: 1, y: 0, duration: 1, stagger: 0.15 }, '-=0.4')
        .to('.hero-description', { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
        .to('.hero-stats', { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
        .to('.hero-cta', { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
        .to('.hero-scroll', { opacity: 1, duration: 0.8 }, '-=0.3');

    // Animate stat numbers
    animateCounters();

    // Section animations
    initSectionAnimations();

    // Parallax effects
    initParallax();

    // Gallery animations
    initGalleryAnimations();
}

// ================================
// Counter Animation
// ================================
function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const isYear = target > 1000;

        ScrollTrigger.create({
            trigger: counter,
            start: 'top 80%',
            onEnter: () => {
                gsap.to(counter, {
                    innerHTML: target,
                    duration: isYear ? 0.5 : 5,
                    ease: 'power2.out',
                    snap: { innerHTML: 1 },
                    onUpdate: function() {
                        counter.innerHTML = Math.round(this.targets()[0].innerHTML);
                    }
                });
            },
            once: true
        });
    });
}

// ================================
// Section Animations
// ================================
function initSectionAnimations() {
    // About section
    gsap.from('.about .section-tag', {
        scrollTrigger: {
            trigger: '.about',
            start: 'top 70%',
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out'
    });

    gsap.from('.about .title-reveal', {
        scrollTrigger: {
            trigger: '.about .section-title',
            start: 'top 70%',
        },
        opacity: 0,
        y: 50,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out'
    });

    gsap.from('.about-lead', {
        scrollTrigger: {
            trigger: '.about-main',
            start: 'top 70%',
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out'
    });

    gsap.from('.about-text', {
        scrollTrigger: {
            trigger: '.about-main',
            start: 'top 60%',
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        delay: 0.2,
        ease: 'power3.out'
    });

    // Features
    gsap.from('.feature', {
        scrollTrigger: {
            trigger: '.about-features',
            start: 'top 70%',
        },
        opacity: 0,
        y: 60,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
    });

    // Speakers section
    gsap.from('.speakers .section-tag', {
        scrollTrigger: {
            trigger: '.speakers',
            start: 'top 70%',
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out'
    });

    gsap.from('.speakers .title-reveal', {
        scrollTrigger: {
            trigger: '.speakers .section-title',
            start: 'top 70%',
        },
        opacity: 0,
        y: 50,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out'
    });

    gsap.from('.speakers .section-subtitle', {
        scrollTrigger: {
            trigger: '.speakers .section-header',
            start: 'top 75%',
        },
        opacity: 0,
        y: 40,
        duration: 1,
        delay: 0.4,
        ease: 'power3.out'
    });

    // Speaker cards - optimized for performance
    gsap.from('.speaker-card', {
        scrollTrigger: {
            trigger: '.speakers-grid',
            start: 'top 75%',
        },
        opacity: 0,
        y: 40,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out',
        force3D: true
    });

    // Experience section
    gsap.from('.experience .section-tag', {
        scrollTrigger: {
            trigger: '.experience',
            start: 'top 70%',
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out'
    });

    gsap.from('.experience .title-reveal', {
        scrollTrigger: {
            trigger: '.experience .section-title',
            start: 'top 70%',
        },
        opacity: 0,
        y: 50,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out'
    });

    // Partners section
    gsap.from('.partners .title-reveal', {
        scrollTrigger: {
            trigger: '.partners',
            start: 'top 70%',
        },
        opacity: 0,
        y: 50,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out'
    });

    // Partner logos - fade in with stagger
    gsap.from('.partner-logo', {
        scrollTrigger: {
            trigger: '.partners-grid',
            start: 'top 85%',
        },
        opacity: 0,
        y: 40,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        force3D: true
    });

    // Stats section
    gsap.from('.stat-item', {
        scrollTrigger: {
            trigger: '.stats-section',
            start: 'top 70%',
        },
        opacity: 0,
        y: 60,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out'
    });

    // Contact section
    gsap.from('.contact-content > *', {
        scrollTrigger: {
            trigger: '.contact',
            start: 'top 70%',
        },
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
    });

    // Speaker Highlight Cards - animated entrance
    gsap.from('.speaker-highlight-card', {
        scrollTrigger: {
            trigger: '.speaker-highlights',
            start: 'top 80%',
        },
        opacity: 0,
        y: 80,
        scale: 0.9,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out'
    });

    // About Photo Grid - smooth reveal
    gsap.from('.about-photo-grid .photo-grid-item', {
        scrollTrigger: {
            trigger: '.about-photo-grid',
            start: 'top 85%',
        },
        opacity: 0,
        y: 40,
        scale: 0.95,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        force3D: true
    });

    // Panel Highlights - each panel animates separately
    gsap.utils.toArray('.panel-highlight').forEach((panel) => {
        const content = panel.querySelector('.panel-content');
        const isReverse = panel.classList.contains('reverse');

        gsap.from(content, {
            scrollTrigger: {
                trigger: panel,
                start: 'top 80%',
            },
            opacity: 0,
            x: isReverse ? -50 : 50,
            duration: 1,
            ease: 'power3.out'
        });
    });

    // Team Section
    gsap.from('.team .title-reveal', {
        scrollTrigger: {
            trigger: '.team',
            start: 'top 70%',
        },
        opacity: 0,
        y: 50,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out'
    });

    gsap.from('.team-photo-wrapper', {
        scrollTrigger: {
            trigger: '.team-photo-wrapper',
            start: 'top 70%',
        },
        opacity: 0,
        y: 60,
        scale: 0.95,
        duration: 1,
        ease: 'power3.out'
    });

    gsap.from('.chairman-card', {
        scrollTrigger: {
            trigger: '.chairmen-grid',
            start: 'top 80%',
        },
        opacity: 0,
        y: 40,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out'
    });

    gsap.from('.team-departments span', {
        scrollTrigger: {
            trigger: '.team-departments',
            start: 'top 85%',
        },
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power3.out'
    });
}

// ================================
// Parallax Effects
// ================================
function initParallax() {
    // Hero parallax - disabled on mobile to prevent black gap on scroll-to-top
    if (window.innerWidth > 768) {
        gsap.to('.hero-video', {
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1
            },
            y: 200,
            scale: 1.1
        });
    }

    gsap.to('.hero-content', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
        },
        y: 100,
        opacity: 0
    });

    // Panel highlights parallax (multiple panels)
    gsap.utils.toArray('.panel-highlight').forEach((panel) => {
        const bgImg = panel.querySelector('.panel-bg img');
        if (bgImg) {
            gsap.to(bgImg, {
                scrollTrigger: {
                    trigger: panel,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1
                },
                y: -80,
                scale: 1.1
            });
        }
    });

    // About photo grid parallax
    gsap.to('.about-photo-grid .photo-grid-item.main img', {
        scrollTrigger: {
            trigger: '.about-photo-grid',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
        },
        y: -30,
    });

    // Stats background text
    gsap.to('.stats-bg-text', {
        scrollTrigger: {
            trigger: '.stats-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
        },
        x: -100,
    });

    // Gallery items parallax
    document.querySelectorAll('.gallery-item').forEach(item => {
        const speed = parseFloat(item.getAttribute('data-speed')) || 1;
        const yOffset = (speed - 1) * 100;

        gsap.to(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1
            },
            y: yOffset
        });
    });
}

// ================================
// Gallery Animations
// ================================
function initGalleryAnimations() {
    gsap.from('.gallery-item', {
        scrollTrigger: {
            trigger: '.experience-gallery',
            start: 'top 70%',
        },
        opacity: 0,
        y: 100,
        scale: 0.95,
        duration: 0.8,
        stagger: {
            amount: 0.6,
            grid: 'auto',
            from: 'start'
        },
        ease: 'power3.out'
    });
}

// ================================
// Marquee Animation Enhancement
// ================================
const marquee = document.querySelector('.marquee-content');
if (marquee) {
    // Clone content for seamless loop
    marquee.innerHTML += marquee.innerHTML;
}

// ================================
// Scroll Progress Indicator
// ================================
const scrollProgress = document.createElement('div');
scrollProgress.className = 'scroll-progress';
document.body.appendChild(scrollProgress);

gsap.to(scrollProgress, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3
    }
});

// ================================
// Image Reveal Effect
// ================================
document.querySelectorAll('.image-wrapper').forEach(wrapper => {
    gsap.from(wrapper.querySelector('img'), {
        scrollTrigger: {
            trigger: wrapper,
            start: 'top 80%',
        },
        scale: 1.2,
        duration: 1.5,
        ease: 'power3.out'
    });
});

// ================================
// Magnetic Effect for Buttons
// ================================
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, {
            x: x * 0.2,
            y: y * 0.2,
            duration: 0.3,
            ease: 'power2.out'
        });
    });

    btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.3,
            ease: 'power2.out'
        });
    });
});

// ================================
// Speaker Card 3D Tilt Effect
// ================================
document.querySelectorAll('.speaker-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        gsap.to(card, {
            rotateY: x * 10,
            rotateX: -y * 10,
            duration: 0.3,
            ease: 'power2.out',
            transformPerspective: 1000
        });
    });

    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.5,
            ease: 'power2.out'
        });
    });
});

// ================================
// Text Split Animation Helper
// ================================
function splitText(element) {
    const text = element.textContent;
    element.innerHTML = '';
    text.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        span.style.transitionDelay = `${i * 0.03}s`;
        element.appendChild(span);
    });
}

// ================================
// Intersection Observer for Reveals
// ================================
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
};

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
});

// ================================
// Video Optimization
// ================================
const heroVideo = document.querySelector('.hero-video');
if (heroVideo) {
    // Pause video when not visible
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                heroVideo.play();
            } else {
                heroVideo.pause();
            }
        });
    }, { threshold: 0.25 });

    videoObserver.observe(heroVideo);
}

// ================================
// Keyboard Navigation
// ================================
document.addEventListener('keydown', (e) => {
    // Close mobile menu on Escape
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        navMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ================================
// Performance: Disable animations on low-end devices
// ================================
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.globalTimeline.pause();
    if (lenis && typeof lenis.destroy === 'function') {
        lenis.destroy();
    }
}

// ================================
// Resize Handler
// ================================
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
    }, 250);
});

// ================================
// Log Ready State
// ================================
console.log('%c FS Business Forum ', 'background: #c9a962; color: #0a0a0b; font-size: 16px; padding: 8px; border-radius: 4px;');
console.log('%c Website initialized successfully ', 'color: #a0a0a5;');

// ================================
// PREMIUM EXPERIENCE ENHANCEMENTS
// ================================

// SplitType Text Animations
if (typeof SplitType !== 'undefined') {
    // Animate section titles with character reveal
    document.querySelectorAll('.title-reveal').forEach(title => {
        const split = new SplitType(title, { types: 'chars, words' });

        gsap.from(split.chars, {
            scrollTrigger: {
                trigger: title,
                start: 'top 85%',
                once: true
            },
            opacity: 0,
            y: 50,
            rotateX: -90,
            stagger: 0.02,
            duration: 0.8,
            ease: 'back.out(1.7)'
        });
    });

}

// Enhanced Parallax Images - reduced movement to prevent black space
document.querySelectorAll('.parallax-container img, .gallery-item img').forEach(img => {
    gsap.to(img, {
        scrollTrigger: {
            trigger: img.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5
        },
        y: -15,
        scale: 1.03,
        ease: 'none'
    });
});

// Floating Elements Animation
document.querySelectorAll('.visual-circle').forEach((circle, i) => {
    gsap.to(circle, {
        y: -30 - (i * 10),
        x: 20 + (i * 5),
        rotation: 360,
        duration: 20 + (i * 5),
        repeat: -1,
        ease: 'none'
    });
});

// Enhanced Section Reveals - only for sections AFTER hero (excluding about/speakers which have their own animations)
document.querySelectorAll('section:not(.hero):not(.speakers):not(.about)').forEach(section => {
    const elements = section.querySelectorAll('.section-tag, .section-subtitle');

    if (elements.length > 0) {
        gsap.from(elements, {
            scrollTrigger: {
                trigger: section,
                start: 'top 75%',
                once: true
            },
            opacity: 0,
            y: 40,
            stagger: 0.1,
            duration: 0.8,
            ease: 'power3.out'
        });
    }
});

// Smooth Scale Effect for Panel Highlights only (headline speakers appear immediately)
document.querySelectorAll('.panel-highlight').forEach(card => {
    gsap.from(card, {
        scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            once: true
        },
        scale: 0.9,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    });
});

// Enhanced Cursor Interactions (uses existing cursor/cursorFollower variables)
// Add special effects for different elements
document.querySelectorAll('.speaker-highlight-card, .gallery-item, .partner-logo').forEach(el => {
    el.addEventListener('mouseenter', () => {
        gsap.to(cursorFollower, {
            scale: 2,
            backgroundColor: 'rgba(201, 169, 98, 0.1)',
            duration: 0.3
        });
    });

    el.addEventListener('mouseleave', () => {
        gsap.to(cursorFollower, {
            scale: 1,
            backgroundColor: 'transparent',
            duration: 0.3
        });
    });
});

// Text links get special cursor
document.querySelectorAll('a:not(.btn), .nav-link').forEach(link => {
    link.addEventListener('mouseenter', () => {
        gsap.to(cursor, { scale: 0.5, duration: 0.2 });
        gsap.to(cursorFollower, { scale: 1.5, duration: 0.2 });
    });

    link.addEventListener('mouseleave', () => {
        gsap.to(cursor, { scale: 1, duration: 0.2 });
        gsap.to(cursorFollower, { scale: 1, duration: 0.2 });
    });
});

// Scroll-triggered Background Color Transitions
const colorSections = [
    { selector: '.hero', color: '#0a0a0b' },
    { selector: '.speakers', color: '#0a0a0b' },
    { selector: '.stats-section', color: '#c9a962' }
];

// Smooth scroll progress updates
const scrollProgressBar = document.querySelector('.scroll-progress');
if (scrollProgressBar) {
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        scrollProgressBar.style.width = scrollPercent + '%';
    }, { passive: true });
}

// Enhanced Navigation Scroll Effect (uses existing nav variable)
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 200) {
        // Scrolling down - hide nav
        gsap.to(nav, { y: -100, duration: 0.3, ease: 'power2.out' });
    } else {
        // Scrolling up - show nav
        gsap.to(nav, { y: 0, duration: 0.3, ease: 'power2.out' });
    }

    lastScrollTop = scrollTop;
}, { passive: true });



// Animate numbers with counting effect
document.querySelectorAll('.stat-number').forEach(stat => {
    const finalValue = parseInt(stat.textContent.replace(/[^0-9]/g, ''));
    const suffix = stat.textContent.replace(/[0-9]/g, '');

    ScrollTrigger.create({
        trigger: stat,
        start: 'top 85%',
        once: true,
        onEnter: () => {
            gsap.from(stat, {
                textContent: 0,
                duration: 2,
                ease: 'power2.out',
                snap: { textContent: 1 },
                onUpdate: function() {
                    stat.textContent = Math.ceil(this.targets()[0].textContent) + suffix;
                }
            });
        }
    });
});

// Add smooth entrance for chairman cards
document.querySelectorAll('.chairman-card').forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            once: true
        },
        opacity: 0,
        y: 80,
        rotateY: 15,
        duration: 1,
        delay: i * 0.15,
        ease: 'power3.out'
    });
});

// Footer reveal animation
const footer = document.querySelector('.footer');
if (footer) {
    gsap.from(footer.children, {
        scrollTrigger: {
            trigger: footer,
            start: 'top 90%',
            once: true
        },
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out'
    });
}

// Back to Top Button
const backToTopBtn = document.querySelector('.back-to-top');
if (backToTopBtn) {
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    }, { passive: true });

    // Scroll to top on click
    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Use Lenis for smooth scroll if available and initialized
        if (lenis && typeof lenis.scrollTo === 'function') {
            lenis.scrollTo(0, { duration: 1.5 });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

// ================================
// Show More Speakers Functionality
// ================================
const showMoreBtn = document.getElementById('showMoreSpeakers');
const showMoreContainer = document.querySelector('.show-more-container');

if (showMoreBtn) {
    showMoreBtn.addEventListener('click', () => {
        // Get all hidden speaker cards
        const hiddenSpeakers = document.querySelectorAll('.speaker-card-hidden');

        if (hiddenSpeakers.length > 0) {
            // Animate button out
            gsap.to(showMoreContainer, {
                opacity: 0,
                scale: 0.9,
                duration: 0.4,
                ease: 'power2.in',
                onComplete: () => {
                    showMoreContainer.classList.add('hidden');
                }
            });

            // Reveal speakers with staggered animation
            hiddenSpeakers.forEach((speaker, index) => {
                // Remove hidden class and add visible class
                speaker.classList.remove('speaker-card-hidden');
                speaker.classList.add('speaker-card-visible');

                // Set display to block for animation
                speaker.style.display = 'block';

                // Animate with GSAP for smoother control and stagger
                gsap.fromTo(speaker,
                    {
                        opacity: 0,
                        y: 30,
                        scale: 0.95
                    },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.6,
                        delay: 0.3 + (index * 0.08), // Stagger delay
                        ease: 'power3.out',
                        onComplete: () => {
                            // Clear inline styles after animation
                            speaker.style.opacity = '';
                            speaker.style.transform = '';
                        }
                    }
                );
            });

            // Add hover cursor effect to newly revealed speakers
            hiddenSpeakers.forEach(speaker => {
                speaker.addEventListener('mouseenter', () => cursorFollower.classList.add('hover'));
                speaker.addEventListener('mouseleave', () => cursorFollower.classList.remove('hover'));
            });
        }
    });
}

console.log('%c Premium Experience Loaded ', 'background: linear-gradient(90deg, #c9a962, #e8d5a3); color: #040810; font-size: 12px; padding: 4px 8px; border-radius: 4px;');
