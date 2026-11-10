var triggerThriveHaptic = function (durationOrPattern = 15) {
    try {
        if (
            typeof window !== 'undefined' &&
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            return false;
        }
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            let pattern = 15;
            if (typeof durationOrPattern === 'number' && Number.isFinite(durationOrPattern) && durationOrPattern >= 0) {
                pattern = durationOrPattern;
            } else if (typeof durationOrPattern === 'string' && durationOrPattern.trim() !== '' && Number.isFinite(Number(durationOrPattern)) && Number(durationOrPattern) >= 0) {
                pattern = Number(durationOrPattern);
            } else if (Array.isArray(durationOrPattern)) {
                const valid = durationOrPattern.filter(n => typeof n === 'number' && Number.isFinite(n) && n >= 0);
                if (valid.length > 0) pattern = valid;
            }
            const res = navigator.vibrate(pattern);
            return res !== false;
        }
    } catch (_) {
        // Silently no-op on browsers/platforms without Web Vibration API support
    }
    return false;
};

if (typeof window !== 'undefined') {
    window.triggerThriveHaptic = triggerThriveHaptic;
}

var fireThriveHaptic = function (durationOrPattern = 15) {
    try {
        if (typeof window !== 'undefined' && typeof window.triggerThriveHaptic === 'function') {
            return window.triggerThriveHaptic(durationOrPattern);
        }
        return triggerThriveHaptic(durationOrPattern);
    } catch (_) {
        return false;
    }
};

const initThriveUI = () => {
    // Hamburger Menu Logic
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (hamburger && navMenu) {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.addEventListener('click', () => {
            const isOpen = navMenu.classList.toggle('open');
            hamburger.classList.toggle('open', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                hamburger.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('open')) {
                navMenu.classList.remove('open');
                hamburger.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Active Page & Section Highlighting in Desktop Navbar & Mobile Drawer
    const KNOWN_PAGE_SLUGS = new Set([
        'index',
        'survey',
        'profile',
        'hope-survey',
        'approach',
        'how-to-use',
        'rebuilding-life-challenges',
        'employment-challenges',
        'mockup-landing',
        'funnel',
        'landingpage',
        'results',
        'classes',
        'schedule',
        'onboarding'
    ]);

    const normalizePageSlug = (rawPath) => {
        const cleaned = String(rawPath || '')
            .split('?')[0]
            .split('#')[0]
            .replace(/\/+$/, '');
        const lastSegment = cleaned.split('/').pop() || '';
        const slug = lastSegment.replace(/\.html$/i, '').trim().toLowerCase();
        return slug || 'index';
    };

    const resolveCurrentPageSlug = (rawPathname, isCustomPathname = false) => {
        const rawStr = String(rawPathname || '').trim();
        const pathBeforeQueryHash = rawStr.split('?')[0].split('#')[0];
        const hasExplicitPath = Boolean(pathBeforeQueryHash);
        if (
            (!isCustomPathname || !hasExplicitPath) &&
            typeof document !== 'undefined' &&
            document.body &&
            (document.body.getAttribute('data-page') === '404' || document.body.classList.contains('error-404-page'))
        ) {
            return '404';
        }
        const effectivePath = hasExplicitPath
            ? pathBeforeQueryHash
            : (typeof window !== 'undefined' ? String(window.location?.pathname || '').split('?')[0].split('#')[0] : '');
        if (/\.html\/+/i.test(effectivePath)) {
            return '404';
        }
        const cleaned = effectivePath.replace(/\/+$/, '');
        if (!cleaned) {
            return 'index';
        }
        const segments = cleaned.replace(/^\/+/, '').split('/').filter(Boolean);
        const isHttpOrigin = typeof window !== 'undefined' && /^https?:$/i.test(window.location?.protocol || '');
        if ((isHttpOrigin || isCustomPathname) && segments.length > 1) {
            return '404';
        }
        const slug = normalizePageSlug(cleaned);
        if (slug === '404' || !KNOWN_PAGE_SLUGS.has(slug)) {
            return '404';
        }
        return slug;
    };

    const parseNavLinkHref = (rawHref, currentSlug) => {
        const trimmed = String(rawHref || '').trim();
        if (!trimmed || /^(javascript:|mailto:|tel:)/i.test(trimmed)) {
            return null;
        }
        if (/^https?:\/\//i.test(trimmed)) {
            try {
                const u = new URL(trimmed, window.location.origin);
                if (window.location.origin && window.location.origin !== 'null' && u.origin !== window.location.origin) {
                    return null;
                }
                return {
                    slug: normalizePageSlug(u.pathname),
                    hash: String(u.hash || '').toLowerCase()
                };
            } catch (_) {
                return null;
            }
        }
        if (trimmed.startsWith('#')) {
            return {
                slug: currentSlug,
                hash: trimmed.toLowerCase()
            };
        }
        const hashIdx = trimmed.indexOf('#');
        const pathPart = hashIdx >= 0 ? trimmed.slice(0, hashIdx) : trimmed;
        const cleanPath = pathPart.split('?')[0].trim();
        const hashPart = hashIdx >= 0 ? trimmed.slice(hashIdx).toLowerCase() : '';
        return {
            slug: cleanPath ? normalizePageSlug(cleanPath) : currentSlug,
            hash: hashPart
        };
    };

    const updateActiveNavLinks = (customPathname, customHash) => {
        const isCustomPathname = typeof customPathname === 'string';
        const pathname = isCustomPathname ? customPathname : (window.location.pathname || '');
        let rawHash = '';
        if (typeof customHash === 'string') {
            rawHash = customHash;
        } else if (isCustomPathname) {
            const hashIdx = customPathname.indexOf('#');
            rawHash = hashIdx >= 0 ? customPathname.slice(hashIdx) : '';
        } else {
            rawHash = window.location.hash || '';
        }
        const currentSlug = resolveCurrentPageSlug(pathname, isCustomPathname);
        const currentHash = String(rawHash || '').trim().toLowerCase();
        const effectiveNavSlug = (currentSlug === 'results' || currentSlug === 'funnel' || currentSlug === 'landingpage')
            ? 'mockup-landing'
            : currentSlug;
        const is404Route = currentSlug === '404' || effectiveNavSlug === '404';

        const allNavLinks = Array.from(document.querySelectorAll(
            '.desktop-menu a, .nav-menu a, .nav-links a, .mobile-drawer a, .top-nav a, .challenge-switcher a'
        ));

        let hasMatchingHashNav = false;
        if (!is404Route && currentHash) {
            hasMatchingHashNav = allNavLinks.some(link => {
                if (link.closest('.challenge-switcher')) return false;
                const parsed = parseNavLinkHref(link.getAttribute('href'), currentSlug);
                return Boolean(parsed && parsed.hash && parsed.slug === effectiveNavSlug && parsed.hash === currentHash);
            });
        }

        allNavLinks.forEach(link => {
            const parsed = parseNavLinkHref(link.getAttribute('href'), currentSlug);
            if (!parsed || is404Route) {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
                return;
            }

            let isMatch = false;
            if (link.closest('.challenge-switcher')) {
                isMatch = !parsed.hash && parsed.slug === currentSlug;
            } else if (parsed.hash) {
                isMatch = parsed.slug === effectiveNavSlug && Boolean(currentHash) && parsed.hash === currentHash;
            } else if (parsed.slug === 'index') {
                isMatch = effectiveNavSlug === 'index' && !hasMatchingHashNav;
            } else {
                isMatch = parsed.slug === effectiveNavSlug || parsed.slug === currentSlug;
            }

            if (isMatch) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            }
        });

        document.querySelectorAll('.desktop-menu .dropdown, .nav-menu .dropdown, .nav-links .dropdown, .mobile-drawer .dropdown').forEach(dropdown => {
            const trigger = dropdown.querySelector(':scope > a');
            const activeChild = dropdown.querySelector('.dropdown-content a.active, .dropdown-content a[aria-current="page"]');
            if (trigger) {
                trigger.classList.toggle('active-parent', Boolean(!is404Route && activeChild && !trigger.classList.contains('active')));
            }
        });

        document.querySelectorAll('.brand-logo-link').forEach(brandLink => {
            const parsed = parseNavLinkHref(brandLink.getAttribute('href'), currentSlug);
            const isHomeMatch = Boolean(!is404Route && parsed && !parsed.hash && parsed.slug === 'index' && effectiveNavSlug === 'index' && !hasMatchingHashNav);
            if (isHomeMatch) {
                brandLink.classList.add('active');
                brandLink.setAttribute('aria-current', 'page');
            } else {
                brandLink.classList.remove('active');
                brandLink.removeAttribute('aria-current');
            }
        });
    };

    document.querySelectorAll('.desktop-menu a, .nav-menu a, .nav-links a, .mobile-drawer a, .brand-logo-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const currentSlug = resolveCurrentPageSlug(window.location.pathname || '', false);
            if (currentSlug === '404') return;
            const parsed = parseNavLinkHref(link.getAttribute('href'), currentSlug);
            if (!parsed || parsed.slug !== currentSlug) return;

            if (parsed.hash) {
                let targetEl = null;
                try { targetEl = document.querySelector(parsed.hash); } catch (_) {}
                if (targetEl) {
                    e.preventDefault();
                    if (window.history && typeof window.history.pushState === 'function') {
                        window.history.pushState(null, '', parsed.hash);
                    } else {
                        window.location.hash = parsed.hash;
                    }
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    updateActiveNavLinks();
                }
            } else if (window.location.hash) {
                e.preventDefault();
                if (window.history && typeof window.history.pushState === 'function') {
                    window.history.pushState(null, '', (window.location.pathname || '/') + (window.location.search || ''));
                } else {
                    window.location.hash = '';
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
                updateActiveNavLinks();
            }
        });
    });

    updateActiveNavLinks();
    window.updateActiveNavLinks = updateActiveNavLinks;
    window.addEventListener('hashchange', () => updateActiveNavLinks());
    window.addEventListener('popstate', () => updateActiveNavLinks());

    // Video Placeholder Interactive Walkthrough + Local Video Player
    const videoCard = document.getElementById('video-player-card');
    if (videoCard) {
        const videoEl = document.getElementById('homepage-walkthrough-video');
        const playToggleBtn = document.getElementById('video-toggle-play');
        const restartBtn = document.getElementById('video-restart-btn');
        const muteBtn = document.getElementById('video-mute-btn');
        let narrationActive = false;
        let walkthroughUtterance = null;

        const walkthroughNarrationText = "Welcome to the 5 to THRiVE Practitioner Lab. We equip licensed therapists, coaches, and case managers to triple client outcome velocity across the 167 hours between sessions. Step 1: The Flow Survey pinpoints the client's specific Ugg friction and measures baseline Agency, Clarity, and Momentum. Step 2: The Voice-Driven THRiVE Report uncovers 3 to 5 core resources across Traits, Hobbies, Relationships, Interests, Values, and Experiences using the Safe-Save protocol. Step 3: Filling the G.A.P.S. generates 5 lens-tailored next steps so the client commits to 1 to 3 micro-actions on their live Action Board—while Personos AI automatically generates your clinical DAP notes.";

        const stopWalkthroughSpeech = () => {
            if (walkthroughUtterance) {
                walkthroughUtterance.onend = null;
                walkthroughUtterance.onerror = null;
                walkthroughUtterance = null;
            }
            if (window.speechSynthesis) {
                try { window.speechSynthesis.cancel(); } catch (_) {}
            }
        };

        const speakWalkthrough = () => {
            if (!window.speechSynthesis || (!narrationActive && (!videoEl || videoEl.muted))) return;
            try {
                stopWalkthroughSpeech();
                const u = new SpeechSynthesisUtterance(walkthroughNarrationText);
                u.rate = 1.0;
                walkthroughUtterance = u;
                u.onend = () => { if (walkthroughUtterance === u) walkthroughUtterance = null; };
                u.onerror = () => { if (walkthroughUtterance === u) walkthroughUtterance = null; };
                window.speechSynthesis.speak(u);
            } catch (_) {}
        };

        const syncPlayBtnLabel = () => {
            if (!playToggleBtn || !videoEl) return;
            playToggleBtn.innerHTML = videoEl.paused ? '&#9654; Play Video' : '&#9208; Pause Video';
        };

        const syncMuteBtnLabel = () => {
            if (!muteBtn || !videoEl) return;
            muteBtn.innerHTML = (videoEl.muted && !narrationActive) ? '&#128266; Unmute Narration' : '&#128263; Mute';
        };

        const handleWalkthroughPlayFailure = () => {
            if (videoEl && videoEl.paused) {
                stopWalkthroughSpeech();
            }
            syncPlayBtnLabel();
        };

        const activateVideoCard = () => {
            if (!videoCard.classList.contains('is-active')) {
                videoCard.classList.add('is-active');
                videoCard.removeAttribute('role');
                videoCard.removeAttribute('tabindex');
                const activePanel = videoCard.querySelector('.video-active-panel');
                if (activePanel) {
                    activePanel.setAttribute('aria-hidden', 'false');
                }
                if (videoEl) {
                    videoEl.currentTime = 0;
                    const playPromise = videoEl.play();
                    syncPlayBtnLabel();
                    if (playPromise && typeof playPromise.then === 'function') {
                        playPromise.then(syncPlayBtnLabel).catch(handleWalkthroughPlayFailure);
                    }
                }
            }
        };

        if (playToggleBtn && videoEl) {
            playToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (videoEl.paused) {
                    const p = videoEl.play();
                    syncPlayBtnLabel();
                    if (p && typeof p.then === 'function') p.then(syncPlayBtnLabel).catch(handleWalkthroughPlayFailure);
                    if (narrationActive || !videoEl.muted) speakWalkthrough();
                } else {
                    videoEl.pause();
                    stopWalkthroughSpeech();
                    syncPlayBtnLabel();
                }
            });
        }

        if (restartBtn && videoEl) {
            restartBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                videoEl.currentTime = 0;
                const p = videoEl.play();
                syncPlayBtnLabel();
                if (p && typeof p.then === 'function') p.then(syncPlayBtnLabel).catch(handleWalkthroughPlayFailure);
                if (narrationActive || !videoEl.muted) speakWalkthrough();
            });
        }

        if (muteBtn && videoEl) {
            muteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const shouldUnmute = videoEl.muted && !narrationActive;
                videoEl.muted = !shouldUnmute;
                narrationActive = shouldUnmute;
                if (narrationActive) {
                    if (videoEl.paused) {
                        const p = videoEl.play();
                        syncPlayBtnLabel();
                        if (p && typeof p.then === 'function') p.then(syncPlayBtnLabel).catch(handleWalkthroughPlayFailure);
                    }
                    speakWalkthrough();
                } else {
                    stopWalkthroughSpeech();
                }
                syncMuteBtnLabel();
            });
        }

        if (videoEl) {
            videoEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (videoEl.paused) {
                    const p = videoEl.play();
                    syncPlayBtnLabel();
                    if (p && typeof p.then === 'function') p.then(syncPlayBtnLabel).catch(handleWalkthroughPlayFailure);
                    if (narrationActive || !videoEl.muted) speakWalkthrough();
                } else {
                    videoEl.pause();
                    stopWalkthroughSpeech();
                    syncPlayBtnLabel();
                }
            });
        }

        videoCard.addEventListener('click', (e) => {
            if (e.target.closest('a, button, video')) return;
            activateVideoCard();
        });
        videoCard.addEventListener('keydown', (e) => {
            if (e.target.closest('a, button, video')) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activateVideoCard();
            }
        });

        const cleanupWalkthroughAudio = () => {
            stopWalkthroughSpeech();
            if (videoEl && !videoEl.paused) {
                try { videoEl.pause(); } catch (_) {}
            }
            syncPlayBtnLabel();
            syncMuteBtnLabel();
        };
        window.addEventListener('pagehide', cleanupWalkthroughAudio);
        window.addEventListener('beforeunload', cleanupWalkthroughAudio);
        window.addEventListener('pageshow', (e) => { if (e && e.persisted) cleanupWalkthroughAudio(); });
    }

    const cancelPageSpeech = () => {
        if (window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch (_) {}
        }
    };
    window.addEventListener('pagehide', cancelPageSpeech);
    window.addEventListener('beforeunload', cancelPageSpeech);
    window.addEventListener('pageshow', (e) => { if (e && e.persisted) cancelPageSpeech(); });

    // Offer Cards: Touch & Keyboard Flip Support without desktop hover lock
    const offerCards = document.querySelectorAll('.offer-card');
    const canHover = window.matchMedia('(hover: hover)');
    offerCards.forEach(card => {
        card.addEventListener('click', () => {
            if (!canHover.matches) {
                card.classList.toggle('flipped');
            }
        });
        card.addEventListener('mouseleave', () => {
            card.classList.remove('flipped');
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.classList.toggle('flipped');
            }
        });
    });

    // Copy Scenario Buttons (Rebuilding Life & Employment Challenges)
    const copyButtons = document.querySelectorAll('.copy-scenario-btn');
    const copyTextToClipboard = async (text) => {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (_) {
                // Fall through to execCommand fallback
            }
        }
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        if (typeof textarea.setSelectionRange === 'function') {
            textarea.setSelectionRange(0, textarea.value.length);
        }
        let success = false;
        try {
            success = Boolean(document.execCommand && document.execCommand('copy'));
        } catch (_) {
            success = false;
        }
        document.body.removeChild(textarea);
        return success;
    };

    const selectElementText = (el) => {
        if (!el || typeof window.getSelection !== 'function' || typeof document.createRange !== 'function') {
            return;
        }
        try {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(el);
            selection.removeAllRanges();
            selection.addRange(range);
        } catch (_) {
            // Ignore selection errors in restricted environments
        }
    };

    copyButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const card = btn.closest('.scenario-card');
            const promptBox = card ? card.querySelector('.scenario-prompt-box') : null;
            let textToCopy = btn.getAttribute('data-scenario-text') || '';
            if (!textToCopy && promptBox) {
                const paragraphs = Array.from(promptBox.querySelectorAll('p'))
                    .map(p => p.textContent.trim())
                    .filter(Boolean);
                textToCopy = paragraphs.join('\n\n');
            }
            if (!textToCopy) return;

            fireThriveHaptic(15);
            const copied = await copyTextToClipboard(textToCopy);

            const labelEl = btn.querySelector('.copy-btn-label');
            const copyIcon = btn.querySelector('.icon-copy');
            const checkIcon = btn.querySelector('.icon-check');

            btn.classList.remove('is-copied', 'is-copy-fallback');

            if (copied) {
                btn.classList.add('is-copied');
                if (labelEl) {
                    labelEl.textContent = 'Copied!';
                } else {
                    btn.textContent = 'Copied!';
                }
                if (copyIcon) copyIcon.style.display = 'none';
                if (checkIcon) checkIcon.style.display = 'inline-block';
            } else {
                selectElementText(promptBox);
                btn.classList.add('is-copy-fallback');
                if (labelEl) {
                    labelEl.textContent = 'Press Ctrl+C to Copy';
                } else {
                    btn.textContent = 'Press Ctrl+C to Copy';
                }
                if (copyIcon) copyIcon.style.display = 'inline-block';
                if (checkIcon) checkIcon.style.display = 'none';
            }

            if (btn._copyTimeout) {
                clearTimeout(btn._copyTimeout);
            }
            btn._copyTimeout = setTimeout(() => {
                btn.classList.remove('is-copied', 'is-copy-fallback');
                if (labelEl) {
                    labelEl.textContent = 'Copy Scenario';
                } else {
                    btn.textContent = 'Copy Scenario';
                }
                if (copyIcon) copyIcon.style.display = 'inline-block';
                if (checkIcon) checkIcon.style.display = 'none';
            }, 2200);
        });
    });

    // =========================================================================
    // CLASSES & COHORT CALENDAR ENGINE (November 2026 Cohort)
    // =========================================================================
    const COHORT_SESSIONS = [
        {
            week: 1,
            title: "Week 01: Sensing the Landscape (CYNEFIN & Friction Diagnostic)",
            description: "Live interactive workshop on CYNEFIN sense-making, friction diagnostics, and safe-to-try micro-experiments.",
            dtstartUtc: "20261104T000000Z", // Tue Nov 3 5:00 PM MT = Wed Nov 4 00:00 UTC
            dtendUtc: "20261104T011500Z",
            dateDisplay: "Tuesday, November 3, 2026",
            timeDisplayMt: "5:00 PM – 6:15 PM MT",
            timeDisplayEt: "7:00 PM – 8:15 PM ET",
            epochStart: 1793750400000 // 2026-11-04T00:00:00Z
        },
        {
            week: 2,
            title: "Week 02: Activating Your Core (The Strengths Model & THRiVE Inventory)",
            description: "Live workshop on the 6 THRiVE Strengths dimensions: Traits, Hobbies, Relationships, Interests, Values, and Experiences.",
            dtstartUtc: "20261111T000000Z",
            dtendUtc: "20261111T011500Z",
            dateDisplay: "Tuesday, November 10, 2026",
            timeDisplayMt: "5:00 PM – 6:15 PM MT",
            timeDisplayEt: "7:00 PM – 8:15 PM ET",
            epochStart: 1794355200000
        },
        {
            week: 3,
            title: "Week 03: Partnering with Intelligence (Personos AI Coaching)",
            description: "Interactive session on Master AI Coaching Prompts, between-session agency, and relational AI co-pilots.",
            dtstartUtc: "20261118T000000Z",
            dtendUtc: "20261118T011500Z",
            dateDisplay: "Tuesday, November 17, 2026",
            timeDisplayMt: "5:00 PM – 6:15 PM MT",
            timeDisplayEt: "7:00 PM – 8:15 PM ET",
            epochStart: 1794960000000
        },
        {
            week: 4,
            title: "Week 04: Architecture of Momentum (Action Boards & HoPE Index)",
            description: "Cohort graduation workshop: Kanban Action Board construction, HoPE Index re-benchmarking, and 90-day momentum roadmaps.",
            dtstartUtc: "20261125T000000Z",
            dtendUtc: "20261125T011500Z",
            dateDisplay: "Tuesday, November 24, 2026",
            timeDisplayMt: "5:00 PM – 6:15 PM MT",
            timeDisplayEt: "7:00 PM – 8:15 PM ET",
            epochStart: 1795564800000
        }
    ];

    function generateIcsContent(sessions) {
        const lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//THRiVE Coaching//Class Schedule//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];
        (sessions || []).forEach(s => {
            lines.push('BEGIN:VEVENT');
            lines.push(`UID:thrive-cohort-nov2026-w${s.week}@thrivecoaching.ai`);
            lines.push('DTSTAMP:20261101T000000Z');
            lines.push(`DTSTART:${s.dtstartUtc}`);
            lines.push(`DTEND:${s.dtendUtc}`);
            lines.push(`SUMMARY:${s.title}`);
            lines.push(`DESCRIPTION:${s.description}`);
            lines.push('LOCATION:THRiVE Coaching Live Classroom (Zoom)');
            lines.push('STATUS:CONFIRMED');
            lines.push('END:VEVENT');
        });
        lines.push('END:VCALENDAR');
        return lines.join('\r\n');
    }

    function triggerIcsDownload(filename, icsContent) {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadAllIcs() {
        const ics = generateIcsContent(COHORT_SESSIONS);
        triggerIcsDownload('thrive-coaching-november-2026-cohort.ics', ics);
        fireThriveHaptic(20);
    }

    const isValidEmailAddress = (email) => /^\S+@\S+\.\S+$/.test(String(email || '').trim());

    const initClassesPage = () => {
        const container = document.getElementById('sessions-container');
        const tzSelect = document.getElementById('tz-select');
        const downloadAllBtn = document.getElementById('btn-download-all-ics');
        const form = document.getElementById('program-inquiry-form');

        if (downloadAllBtn && !downloadAllBtn._hasIcsListener) {
            downloadAllBtn._hasIcsListener = true;
            downloadAllBtn.addEventListener('click', downloadAllIcs);
        }

        const updatePractitionerLabTimezones = (tz) => {
            if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
            const labTimeEls = document.querySelectorAll('[data-lab-tz-mode]');
            if (!labTimeEls || !labTimeEls.length) return;

            labTimeEls.forEach(el => {
                const mode = el.getAttribute('data-lab-tz-mode');
                const dateLabel = el.getAttribute('data-date-label') || '';
                if (mode === 'lunch') {
                    // Thu Nov 12, 2026 12:00 PM - 12:30 PM MST (19:00 - 19:30 UTC)
                    let lunchStr = '12:00 PM – 12:30 PM MT / 2:00 PM ET';
                    if (tz === 'America/Denver') {
                        lunchStr = '12:00 PM – 12:30 PM MT (30 min)';
                    } else if (tz === 'America/New_York') {
                        lunchStr = '2:00 PM – 2:30 PM ET (30 min)';
                    } else if (tz) {
                        try {
                            const startObj = new Date(Date.UTC(2026, 10, 12, 19, 0, 0));
                            const endObj = new Date(Date.UTC(2026, 10, 12, 19, 30, 0));
                            const tzOpt = tz === 'local' ? undefined : tz;
                            const sFmt = new Intl.DateTimeFormat('en-US', { timeZone: tzOpt, hour: 'numeric', minute: '2-digit' }).format(startObj);
                            const eFmt = new Intl.DateTimeFormat('en-US', { timeZone: tzOpt, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(endObj);
                            lunchStr = `${sFmt} – ${eFmt} (30 min)`;
                        } catch (_) {}
                    }
                    el.innerHTML = `&#128197; ${dateLabel} &bull; &#9200; ${lunchStr}`;
                } else if (mode === 'lab') {
                    // Mon & Wed 5:00 PM - 6:30 PM MST (00:00 - 01:30 UTC)
                    let labStr = '5:00 – 6:30 PM MT (90 min)';
                    if (tz === 'America/Denver') {
                        labStr = '5:00 – 6:30 PM MT (90 min)';
                    } else if (tz === 'America/New_York') {
                        labStr = '7:00 – 8:30 PM ET (90 min)';
                    } else if (tz) {
                        try {
                            const startObj = new Date(Date.UTC(2026, 11, 1, 0, 0, 0));
                            const endObj = new Date(Date.UTC(2026, 11, 1, 1, 30, 0));
                            const tzOpt = tz === 'local' ? undefined : tz;
                            const sFmt = new Intl.DateTimeFormat('en-US', { timeZone: tzOpt, hour: 'numeric', minute: '2-digit' }).format(startObj);
                            const eFmt = new Intl.DateTimeFormat('en-US', { timeZone: tzOpt, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(endObj);
                            labStr = `${sFmt} – ${eFmt} (90 min)`;
                        } catch (_) {}
                    }
                    el.innerHTML = `&#128197; ${dateLabel} &bull; &#9200; ${labStr}`;
                }
            });
        };

        const renderSessions = (tz) => {
            updatePractitionerLabTimezones(tz);
            if (!container) return;
            container.innerHTML = COHORT_SESSIONS.map(s => {
                let timeStr = `${s.timeDisplayMt} / ${s.timeDisplayEt} (75 min)`;
                if (tz) {
                    if (tz === 'America/Denver') {
                        timeStr = `${s.timeDisplayMt} (75 min)`;
                    } else if (tz === 'America/New_York') {
                        timeStr = `${s.timeDisplayEt} (75 min)`;
                    } else {
                        try {
                            const startObj = new Date(s.epochStart);
                            const endObj = new Date(s.epochStart + 75 * 60 * 1000);
                            const tzOpt = tz === 'local' ? undefined : tz;
                            const startFmt = new Intl.DateTimeFormat('en-US', { timeZone: tzOpt, hour: 'numeric', minute: '2-digit' }).format(startObj);
                            const endFmt = new Intl.DateTimeFormat('en-US', { timeZone: tzOpt, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(endObj);
                            timeStr = `${startFmt} – ${endFmt} (75 min)`;
                        } catch (_) {
                            timeStr = `${s.timeDisplayMt} / ${s.timeDisplayEt} (75 min)`;
                        }
                    }
                }
                const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(s.title)}&dates=${s.dtstartUtc}/${s.dtendUtc}&details=${encodeURIComponent(s.description)}&location=${encodeURIComponent('THRiVE Coaching Live Classroom (Zoom)')}`;

                return `
                    <div class="session-card">
                        <div class="session-card-header">
                            <span class="session-badge">Week 0${s.week} Live Workshop</span>
                            <span class="session-status">Interactive Call</span>
                        </div>
                        <h4>${s.title}</h4>
                        <p class="session-time">&#128197; ${s.dateDisplay} &bull; &#9200; ${timeStr}</p>
                        <p class="session-summary">${s.description}</p>
                        <div class="session-actions">
                            <a href="${gCalUrl}" target="_blank" rel="noopener noreferrer" class="btn-session-sync">&#43; Google Cal</a>
                            <button type="button" class="btn-session-sync btn-session-ics" data-week="${s.week}">&#128229; .ics</button>
                        </div>
                    </div>
                `;
            }).join('');

            // Wire per-session .ics downloads
            container.querySelectorAll('.btn-session-ics').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const w = Number(e.currentTarget.getAttribute('data-week'));
                    const session = COHORT_SESSIONS.find(x => x.week === w);
                    if (session) {
                        const ics = generateIcsContent([session]);
                        triggerIcsDownload(`thrive-coaching-week-${w}.ics`, ics);
                        fireThriveHaptic(15);
                    }
                });
            });
        };

        if (tzSelect && !tzSelect._hasTzListener) {
            tzSelect._hasTzListener = true;
            tzSelect.addEventListener('change', (e) => {
                renderSessions(e.target.value);
            });
        }

        if (container) {
            renderSessions(tzSelect ? tzSelect.value : 'America/Denver');
        }

        // Prospective Client Inquiry Form Submission
        if (form && !form._hasInquiryListener) {
            form._hasInquiryListener = true;
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById('inq-submit-btn');
                const statusEl = document.getElementById('inq-status');
                const fn = (document.getElementById('inq-fn')?.value || '').trim();
                const ln = (document.getElementById('inq-ln')?.value || '').trim();
                const em = (document.getElementById('inq-em')?.value || '').trim();
                const ph = (document.getElementById('inq-ph')?.value || '').trim();
                const type = document.getElementById('inq-type')?.value || 'November 2026 Cohort';
                const msg = (document.getElementById('inq-msg')?.value || '').trim();

                if (!fn || !ln || !em || !msg || msg.length < 10 || !isValidEmailAddress(em)) {
                    if (statusEl) {
                        statusEl.textContent = 'Please complete all required fields (First Name, Last Name, valid Email, and Message of at least 10 characters).';
                        statusEl.className = 'form-status-msg error';
                        statusEl.style.display = 'block';
                    }
                    return;
                }

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Sending Inquiry…';
                }

                try {
                    const res = await fetch('/api/event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'lead',
                            data: {
                                source: 'classes_inquiry_form',
                                inquiry_type: type,
                                message: msg,
                                label: `Program Inquiry: ${type}`
                            },
                            lead: {
                                fn,
                                ln,
                                em,
                                ph,
                                org: ''
                            },
                            ts: new Date().toISOString()
                        })
                    });

                    if (res.ok) {
                        if (statusEl) {
                            statusEl.textContent = '✓ Inquiry sent! A THRiVE coach will review your question and respond within 24 hours.';
                            statusEl.className = 'form-status-msg success';
                            statusEl.style.display = 'block';
                        }
                        form.reset();
                        fireThriveHaptic([20, 50, 20]);
                    } else {
                        throw new Error('Server returned error status ' + res.status);
                    }
                } catch (err) {
                    if (statusEl) {
                        statusEl.innerHTML = 'Unable to send online right now. Please email us directly at <a href="mailto:team@thrivecoaching.ai">team@thrivecoaching.ai</a> or call <a href="tel:7205882002">(720) 588-2002</a>.';
                        statusEl.className = 'form-status-msg error';
                        statusEl.style.display = 'block';
                    }
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Send Inquiry →';
                    }
                }
            });
        }
    };

    const LUNCH_AND_LEARN_SESSION = {
        week: 'lunch-learn-nov12',
        title: "5 to THRiVE Practitioner Lab — Thursday Lunch & Learn Live Demo",
        description: "30-minute live clinical demonstration of the THRiVE Report voice dictation protocol, automated DAP note generation, and the $9/month client seat model. Nov 30 Practitioner Lab is strictly capped at 21 seats (3 Squads of 7).",
        dtstartUtc: "20261112T190000Z", // Thu Nov 12 12:00 PM MST = 19:00 UTC
        dtendUtc: "20261112T193000Z"
    };

    const PRACTITIONER_LAB_SESSIONS = [
        LUNCH_AND_LEARN_SESSION,
        {
            week: 'mod0-preflight-sat',
            title: "Module 0 (Session 0 — Saturday): Pre-Flight Onboarding & Drop-In Tech Clinic",
            description: "Intake triage via Gerard's Flow Survey, workstation speech-to-text microphone calibration for dictation, and Saturday drop-in IT clinic.",
            dtstartUtc: "20261128T180000Z",
            dtendUtc: "20261128T193000Z"
        },
        {
            week: 'mod0-preflight-sun',
            title: "Module 0 (Session 0 — Sunday): Pre-Flight Onboarding & Drop-In Tech Clinic",
            description: "Intake triage via Gerard's Flow Survey, workstation speech-to-text microphone calibration for dictation, and Sunday drop-in IT clinic.",
            dtstartUtc: "20261129T180000Z",
            dtendUtc: "20261129T193000Z"
        },
        {
            week: 'mod1-mon',
            title: "Module 1A (Mon): The 167-Hour Bottleneck & The Observer Stance (5 to THRiVE Lab)",
            description: "Bi-weekly 90-minute live lab session: SOL Theory, RellaFit, and shifting clients from the reactive character to the grounded Observer.",
            dtstartUtc: "20261201T000000Z", // Mon Nov 30 5:00 PM MST = Tue Dec 1 00:00 UTC
            dtendUtc: "20261201T013000Z"
        },
        {
            week: 'mod1-wed',
            title: "Module 1B (Wed): Squad Breakout Lab — Facilitating the Observer Shift",
            description: "Bi-weekly 90-minute live lab session: Live co-coaching demonstrations and Squad A/B/C breakout lab work.",
            dtstartUtc: "20261203T000000Z", // Wed Dec 2 5:00 PM MST = Thu Dec 3 00:00 UTC
            dtendUtc: "20261203T013000Z"
        },
        {
            week: 'mod2-mon',
            title: "Module 2A (Mon): The THRiVE Report Protocol (Traits & Hobbies) & Safe-Save Mechanic",
            description: "Voice-driven assessment across Traits & Hobbies (strict 3-to-5 item quota) with Enter Safe-Saves every 1-2 minutes.",
            dtstartUtc: "20261208T000000Z", // Mon Dec 7 5:00 PM MST
            dtendUtc: "20261208T013000Z"
        },
        {
            week: 'mod2-wed',
            title: "Module 2B (Wed): Squad Breakout Lab — Co-Coaching Practice on T & H with Dictation",
            description: "Squad A/B/C breakout practice facilitating Traits & Hobbies intake with real-time voice dictation and Safe-Save protocol.",
            dtstartUtc: "20261210T000000Z", // Wed Dec 9 5:00 PM MST
            dtendUtc: "20261210T013000Z"
        },
        {
            week: 'mod3-mon',
            title: "Module 3A (Mon): Relational Architecture (Relationships & Interests)",
            description: "Mapping support cast, accountability mirrors, and intellectual curiosity compass in Personos AI (3-5 item quota).",
            dtstartUtc: "20261215T000000Z", // Mon Dec 14 5:00 PM MST
            dtendUtc: "20261215T013000Z"
        },
        {
            week: 'mod3-wed',
            title: "Module 3B (Wed): Squad Breakout Lab — Dictating R & I Pillars in Personos AI",
            description: "Squad A/B/C breakout lab mapping Relationships & Interests to stabilize clients in housing, recovery, and conflict domains.",
            dtstartUtc: "20261217T000000Z", // Wed Dec 16 5:00 PM MST
            dtendUtc: "20261217T013000Z"
        },
        {
            week: 'mod4-mon',
            title: "Module 4A (Mon): Synthesizing the Core (Values & Experiences)",
            description: "Uncovering non-negotiable operating system values and crucible moments to complete the 6-pillar THRiVE Report.",
            dtstartUtc: "20261222T000000Z", // Mon Dec 21 5:00 PM MST
            dtendUtc: "20261222T013000Z"
        },
        {
            week: 'mod4-wed',
            title: "Module 4B (Wed): Squad Breakout Lab — Full 6-Pillar T-H-R-I-V-E Synthesis & Peer Review",
            description: "Auditing and finalizing complete 6-pillar THRiVE Reports inside Personos client memory profiles across Squads A, B & C.",
            dtstartUtc: "20261224T000000Z", // Wed Dec 23 5:00 PM MST
            dtendUtc: "20261224T013000Z"
        },
        {
            week: 'mod5-mon',
            title: "Module 5A (Mon): Filling the G.A.P.S. & Action Board Generation",
            description: "Generating 5 creative next steps tailored through custom lenses and locking 1-3 committed micro-actions on the live Action Board.",
            dtstartUtc: "20261229T000000Z", // Mon Dec 28 5:00 PM MST
            dtendUtc: "20261229T013000Z"
        },
        {
            week: 'mod5-wed',
            title: "Module 5B (Wed): Squad Breakout Lab — Custom Lens Tuning & Action Board Stress-Testing",
            description: "Live Squad lab configuring philosophy, scripture, and thought-leader lenses and stress-testing 167-hour client Action Boards.",
            dtstartUtc: "20261231T000000Z", // Wed Dec 30 5:00 PM MST
            dtendUtc: "20261231T013000Z"
        },
        {
            week: 'mod6-mon',
            title: "Module 6A (Mon): Clinical Hand-Off, Automated DAP Notes & $9/Mo Seat Economics",
            description: "Automated clinical DAP note generation, $9/month client seat caseload deployment, and clinic/self-pay transition workflows.",
            dtstartUtc: "20270105T000000Z", // Mon Jan 4 5:00 PM MST
            dtendUtc: "20270105T013000Z"
        },
        {
            week: 'mod6-wed',
            title: "Module 6B (Wed): Cohort Capstone Presentations & Practitioner Lab Certification",
            description: "End-to-end Practitioner Case Packet presentations, Squad A/B/C reflections, and 5 to THRiVE Practitioner Lab certification.",
            dtstartUtc: "20270107T000000Z", // Wed Jan 6 5:00 PM MST
            dtendUtc: "20270107T013000Z"
        }
    ];

    function downloadPractitionerLabIcs() {
        const ics = generateIcsContent(PRACTITIONER_LAB_SESSIONS);
        triggerIcsDownload('5-to-thrive-practitioner-lab-2026.ics', ics);
        fireThriveHaptic(20);
    }

    function downloadLunchAndLearnIcs() {
        const ics = generateIcsContent([LUNCH_AND_LEARN_SESSION]);
        triggerIcsDownload('thrive-lunch-and-learn-nov12.ics', ics);
        fireThriveHaptic(15);
    }

    const initLunchAndLearnForm = () => {
        const llForm = document.getElementById('lunch-learn-form');
        const llIcsBtn = document.getElementById('ll-ics-btn');

        if (llIcsBtn && !llIcsBtn._hasLlIcsListener) {
            llIcsBtn._hasLlIcsListener = true;
            llIcsBtn.addEventListener('click', downloadLunchAndLearnIcs);
        }

        if (llForm && !llForm._hasLlSubmitListener) {
            llForm._hasLlSubmitListener = true;
            llForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fn = (document.getElementById('ll-first-name')?.value || '').trim();
                const em = (document.getElementById('ll-email')?.value || '').trim();
                const practiceType = (document.getElementById('ll-practice-type')?.value || '').trim();
                const statusEl = document.getElementById('ll-status');
                const calActionsEl = document.getElementById('ll-calendar-actions');
                const submitBtn = document.getElementById('ll-submit-btn');

                if (!fn || !em || !isValidEmailAddress(em) || !practiceType) {
                    if (statusEl) {
                        statusEl.textContent = 'Please enter your First Name, a valid Email Address, and select your Practice Type.';
                        statusEl.className = 'form-status-msg error';
                        statusEl.style.display = 'block';
                    }
                    return;
                }

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Reserving Seat & Generating Invite…';
                }

                try {
                    await fetch('/api/event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'lead',
                            data: {
                                source: 'thursday_lunch_and_learn_nov12',
                                practice_type: practiceType,
                                label: `Thursday Lunch & Learn (Nov 12) — ${practiceType}`
                            },
                            lead: {
                                fn,
                                ln: '',
                                em,
                                ph: '',
                                org: practiceType
                            },
                            ts: new Date().toISOString()
                        }),
                        keepalive: true
                    }).catch(() => {});

                    if (statusEl) {
                        statusEl.textContent = `✓ Seat reserved for ${fn} (${practiceType})! Your calendar invite (.ics) has been downloaded and confirmation logged for ${em}.`;
                        statusEl.className = 'form-status-msg success';
                        statusEl.style.display = 'block';
                    }
                    if (calActionsEl) {
                        calActionsEl.style.display = 'block';
                    }
                    downloadLunchAndLearnIcs();
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Seat Reserved ✓ Download Invite Again';
                    }
                }
            });
        }
    };

    const labDownloadBtn = document.getElementById('btn-download-practitioner-lab-ics');
    if (labDownloadBtn && !labDownloadBtn._hasLabIcsListener) {
        labDownloadBtn._hasLabIcsListener = true;
        labDownloadBtn.addEventListener('click', downloadPractitionerLabIcs);
    }

    if (typeof window !== 'undefined') {
        window.COHORT_SESSIONS = COHORT_SESSIONS;
        window.PRACTITIONER_LAB_SESSIONS = PRACTITIONER_LAB_SESSIONS;
        window.LUNCH_AND_LEARN_SESSION = LUNCH_AND_LEARN_SESSION;
        window.generateIcsContent = generateIcsContent;
        window.downloadAllIcs = downloadAllIcs;
        window.downloadPractitionerLabIcs = downloadPractitionerLabIcs;
        window.downloadLunchAndLearnIcs = downloadLunchAndLearnIcs;
        window.initClassesPage = initClassesPage;
        window.initLunchAndLearnForm = initLunchAndLearnForm;
    }

    if (document.getElementById('sessions-container') || document.getElementById('tz-select') || document.getElementById('program-inquiry-form')) {
        initClassesPage();
    }

    if (document.getElementById('lunch-learn-form')) {
        initLunchAndLearnForm();
    }

    // Update any dossier status pills on the page
    if (window.ThriveCoachingDossier && typeof window.ThriveCoachingDossier.refreshStatusBadges === 'function') {
        window.ThriveCoachingDossier.refreshStatusBadges();
    }
};

// =========================================================================
// CONNECTED 3-STEP COACHING DOSSIER ("Copy Master AI Coaching Prompt")
// =========================================================================
(function initCoachingDossierGlobal() {
    const DOSSIER_KEY = 'thrive_coaching_dossier_v1';

    const safeParseJSON = (raw) => {
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (_) { return null; }
    };

    const copyTextWithFallback = async (text) => {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (_) {}
        }
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.top = '-9999px';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            if (typeof textarea.setSelectionRange === 'function') {
                textarea.setSelectionRange(0, textarea.value.length);
            }
            const ok = Boolean(document.execCommand && document.execCommand('copy'));
            document.body.removeChild(textarea);
            return ok;
        } catch (_) {
            return false;
        }
    };

    const HOPE_QUESTION_LABELS = {
        ops_home: '1.1 Home (Places)',
        ops_neighborhood: '1.2 Neighborhood (Places)',
        ops_thirdspaces: '1.3 Third Spaces (Places)',
        ops_functionality: '2.1 Functionality (Body)',
        ops_energy: '2.2 Energy & Vitality (Body)',
        ops_bodyimage: '2.3 Body Image (Body)',
        ops_finances: '3.1 Finances (Resources)',
        ops_technology: '3.2 Technology (Resources)',
        ops_essentials: '3.3 Essentials (Resources)',
        irs_mindset: '4.1 Mindset (Self)',
        irs_identity: '4.2 Identity (Self)',
        irs_goals: '4.3 Goals (Self)',
        irs_coreconnections: '5.1 Inner Circle (Others)',
        irs_socialnetwork: '5.2 Social Network (Others)',
        irs_community: '5.3 Community (Others)',
        irs_hobbies: '6.1 Hobbies (Life)',
        irs_habits: '6.2 Habits (Life)',
        irs_havetos: '6.3 Have-Tos (Life)',
        flex_gas: 'Q19 Gang Affinity Score (GAS)',
        flex_pss: 'Q20 Psychological Safety Score (PSS)'
    };

    const safeGetStorageItem = (storageType, key) => {
        try {
            if (storageType === 'session' && typeof sessionStorage !== 'undefined' && sessionStorage) {
                return sessionStorage.getItem(key);
            }
            if (typeof localStorage !== 'undefined' && localStorage) {
                return localStorage.getItem(key);
            }
        } catch (_) {}
        return null;
    };

    const normalizePracticeAuditPayload = (auditData) => {
        if (!auditData || typeof auditData !== 'object' || Array.isArray(auditData)) return null;
        const rawFirst = String(auditData.first || auditData.fn || auditData.firstName || '').trim();
        const first = rawFirst === 'Friend' ? '' : rawFirst;
        const last = String(auditData.last || auditData.ln || auditData.lastName || '').trim();
        const email = String(auditData.email || auditData.em || '').trim();
        const organization = String(auditData.organization || auditData.org || '').trim();

        let ratings = null;
        if (Array.isArray(auditData.ratings) && auditData.ratings.length >= 3) {
            const parsedRatings = auditData.ratings.slice(0, 3).map(v => {
                const n = Number(v);
                return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
            });
            if (parsedRatings.some(n => n !== null)) {
                ratings = parsedRatings;
            }
        }

        const rawPrios = Array.isArray(auditData.priorities)
            ? auditData.priorities
            : (Array.isArray(auditData.votes) ? auditData.votes : (auditData.vote ? [auditData.vote] : []));
        const priorities = rawPrios
            .map(p => String(p || '').trim())
            .filter(Boolean);

        const hasMeaningfulData = Boolean(
            ratings ||
            priorities.length > 0 ||
            first ||
            last ||
            email ||
            organization
        );
        if (!hasMeaningfulData) return null;

        return {
            completedAt: auditData.completedAt || auditData.votedAt || auditData.timestamp || new Date().toISOString(),
            first,
            last,
            email,
            organization,
            ratings,
            priorities
        };
    };

    const derivePracticeAuditFromStorage = () => {
        const sessionObj = safeParseJSON(safeGetStorageItem('session', 'solThrive'));
        const votesObj = safeParseJSON(safeGetStorageItem('local', 'solThriveVotes'));
        const leadObj = safeParseJSON(safeGetStorageItem('local', 'solThriveLead'));
        const localObj = safeParseJSON(safeGetStorageItem('local', 'solThrive'));

        const sources = [votesObj, sessionObj, leadObj, localObj].filter(s => s && typeof s === 'object' && !Array.isArray(s));
        if (sources.length === 0) return null;

        const combined = {};
        sources.slice().reverse().forEach(src => {
            Object.assign(combined, src);
        });
        if (votesObj && Array.isArray(votesObj.priorities) && votesObj.priorities.length > 0) {
            combined.priorities = votesObj.priorities;
        }
        return normalizePracticeAuditPayload(combined);
    };

    const normalizeFlowSurveyPayload = (flowData) => {
        if (!flowData || typeof flowData !== 'object') return null;
        const problem = String(flowData.problem || flowData.problemStatement || '').trim();
        const dims = {
            Agency: typeof flowData.dimensions?.Agency === 'number' ? flowData.dimensions.Agency : (typeof flowData.agencyScore === 'number' ? flowData.agencyScore : undefined),
            Actions: typeof flowData.dimensions?.Actions === 'number' ? flowData.dimensions.Actions : (typeof flowData.actionsScore === 'number' ? flowData.actionsScore : undefined),
            Support: typeof flowData.dimensions?.Support === 'number' ? flowData.dimensions.Support : (typeof flowData.supportScore === 'number' ? flowData.supportScore : undefined),
            Tools: typeof flowData.dimensions?.Tools === 'number' ? flowData.dimensions.Tools : (typeof flowData.toolsScore === 'number' ? flowData.toolsScore : undefined)
        };
        const hasDims = Object.values(dims).some(v => typeof v === 'number');
        const normalized = {
            ...flowData,
            problem,
            problemStatement: problem
        };
        if (hasDims) {
            normalized.dimensions = dims;
            if (typeof dims.Agency === 'number') normalized.agencyScore = dims.Agency;
            if (typeof dims.Actions === 'number') normalized.actionsScore = dims.Actions;
            if (typeof dims.Support === 'number') normalized.supportScore = dims.Support;
            if (typeof dims.Tools === 'number') normalized.toolsScore = dims.Tools;

            const scoredList = Object.entries(dims)
                .filter(([, val]) => typeof val === 'number' && Number.isFinite(val))
                .sort((a, b) => b[1] - a[1]);
            if (scoredList.length > 0) {
                if (!normalized.strongestDimension) {
                    normalized.strongestDimension = `${scoredList[0][0]} (${scoredList[0][1]}/25)`;
                }
                if (!normalized.lowestDimension) {
                    const low = scoredList[scoredList.length - 1];
                    normalized.lowestDimension = `${low[0]} (${low[1]}/25)`;
                }
            }
        }
        return normalized;
    };

    const computeHopeIndexFromAnswers = (ansObj, reflObj, completedAt) => {
        if (!ansObj || typeof ansObj !== 'object') return null;
        const opsKeys = ['ops_home', 'ops_neighborhood', 'ops_thirdspaces', 'ops_functionality', 'ops_energy', 'ops_bodyimage', 'ops_finances', 'ops_technology', 'ops_essentials'];
        const irsKeys = ['irs_mindset', 'irs_identity', 'irs_goals', 'irs_coreconnections', 'irs_socialnetwork', 'irs_community', 'irs_hobbies', 'irs_habits', 'irs_havetos'];
        const parseVal = (v) => {
            if (v == null) return null;
            const n = typeof v === 'object' ? parseFloat(v.value ?? v.score ?? v.rating) : parseFloat(v);
            return Number.isFinite(n) && n > 0 ? n : null;
        };
        const coreRatedCount = [...opsKeys, ...irsKeys].filter(k => parseVal(ansObj[k]) !== null).length;
        if (coreRatedCount < 18) return null;

        const opsSum = opsKeys.reduce((s, k) => s + (parseVal(ansObj[k]) || 0), 0);
        const irsSum = irsKeys.reduce((s, k) => s + (parseVal(ansObj[k]) || 0), 0);
        const opsScore50 = Math.round((opsSum / 45) * 50);
        const irsScore50 = Math.round((irsSum / 45) * 50);
        const totalHoPEScore100 = opsScore50 + irsScore50;
        const coreAvg = (opsSum + irsSum) / 18;
        const tierText = coreAvg >= 4.0 ? 'THRIVING' : coreAvg >= 3.0 ? 'STABILIZING' : coreAvg >= 2.0 ? 'SURVIVING' : 'CRITICAL';

        const dimGroups = [
            { name: 'Dimension 1: Places', space: 'Outer Physical Space (OPS)', keys: ['ops_home', 'ops_neighborhood', 'ops_thirdspaces'] },
            { name: 'Dimension 2: Body', space: 'Outer Physical Space (OPS)', keys: ['ops_functionality', 'ops_energy', 'ops_bodyimage'] },
            { name: 'Dimension 3: Resources', space: 'Outer Physical Space (OPS)', keys: ['ops_finances', 'ops_technology', 'ops_essentials'] },
            { name: 'Dimension 4: Self', space: 'Inner Relational Space (IRS)', keys: ['irs_mindset', 'irs_identity', 'irs_goals'] },
            { name: 'Dimension 5: Others', space: 'Inner Relational Space (IRS)', keys: ['irs_coreconnections', 'irs_socialnetwork', 'irs_community'] },
            { name: 'Dimension 6: Life', space: 'Inner Relational Space (IRS)', keys: ['irs_hobbies', 'irs_habits', 'irs_havetos'] }
        ];
        const dimensions = dimGroups.map(g => {
            const vals = g.keys.map(k => parseVal(ansObj[k])).filter(v => v !== null);
            return {
                name: g.name,
                space: g.space,
                score: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
            };
        });
        let lowestDimension = null;
        let highestDimension = null;
        dimensions.forEach(d => {
            if (d.score !== null) {
                if (!lowestDimension || d.score < lowestDimension.score) lowestDimension = { name: d.name, score: d.score, space: d.space };
                if (!highestDimension || d.score > highestDimension.score) highestDimension = { name: d.name, score: d.score, space: d.space };
            }
        });
        const flexGasScore = parseVal(ansObj.flex_gas);
        const flexPssScore = parseVal(ansObj.flex_pss);
        const flexGasLabel = flexGasScore == null ? 'Unrated' : (flexGasScore >= 4.0 ? 'Triumphant' : flexGasScore >= 2.5 ? 'Torn' : 'Trapped');
        const flexPssLabel = flexPssScore == null ? 'Unrated' : (flexPssScore >= 4.0 ? 'Fearless' : flexPssScore >= 2.5 ? 'Free-ish' : 'Fear');

        return {
            completedAt: completedAt || new Date().toISOString(),
            totalHoPEScore100,
            opsScore50,
            irsScore50,
            tierText,
            lowestDimension,
            highestDimension,
            flexGasScore,
            flexGasLabel,
            flexPssScore,
            flexPssLabel,
            dimensions,
            reflections: reflObj || {}
        };
    };

    const deriveFromSavedStates = (dossier) => {
        const merged = { ...(dossier || {}) };

        // 0. Derive Practice Readiness & Community Blueprint Audit (Section 00)
        const storedAudit = derivePracticeAuditFromStorage();
        if (merged.practiceAudit) {
            const normExplicit = normalizePracticeAuditPayload(merged.practiceAudit);
            if (normExplicit && storedAudit) {
                merged.practiceAudit = normalizePracticeAuditPayload({ ...storedAudit, ...normExplicit });
            } else {
                merged.practiceAudit = normExplicit || storedAudit;
            }
        } else if (storedAudit) {
            merged.practiceAudit = storedAudit;
        }

        if (merged.flowSurvey) {
            merged.flowSurvey = normalizeFlowSurveyPayload(merged.flowSurvey);
        }

        // 1. Derive from thrive_flow_survey_state_v1 if not already present (only when all 20 questions are answered)
        if (!merged.flowSurvey) {
            const flowState = safeParseJSON(safeGetStorageItem('local', 'thrive_flow_survey_state_v1'));
            if (
                flowState &&
                Array.isArray(flowState.scores) &&
                flowState.scores.length === 20 &&
                Array.isArray(flowState.answered) &&
                flowState.answered.length === 20 &&
                flowState.answered.every(Boolean)
            ) {
                const sc = flowState.scores.map(n => Number(n) || 0);
                const total = sc.reduce((a, b) => a + b, 0);
                const target = Math.round(total + 0.6 * (100 - total));
                merged.flowSurvey = normalizeFlowSurveyPayload({
                    completedAt: flowState.updatedAt || flowState.savedAt || new Date().toISOString(),
                    problem: flowState.problemDescription || '',
                    metaphor: flowState.metaphorText || flowState.metaphorValue || '',
                    metaphorDesc: flowState.metaphorDesc || '',
                    currentScore: total,
                    targetScore: target,
                    dimensions: {
                        Agency: sc.slice(0, 5).reduce((a, b) => a + b, 0),
                        Actions: sc.slice(5, 10).reduce((a, b) => a + b, 0),
                        Support: sc.slice(10, 15).reduce((a, b) => a + b, 0),
                        Tools: sc.slice(15, 20).reduce((a, b) => a + b, 0)
                    }
                });
            }
        }

        // 2. Derive from thrive_profile_state_v1 if not already present
        const profState = safeParseJSON(safeGetStorageItem('local', 'thrive_profile_state_v1'));
        if (!merged.thriveReport) {
            if (profState && profState.reportData && typeof profState.reportData === 'object') {
                const rd = profState.reportData;
                const hasAny = ['traits', 'hobbies', 'relationships', 'interests', 'values', 'experiences'].some(k => rd[k] && String(rd[k]).trim());
                if (hasAny) {
                    const interviewee = String(profState.userDetails?.interviewee || '').trim();
                    const interviewer = String(profState.userDetails?.interviewer || '').trim();
                    const email = String(profState.userDetails?.email || '').trim();
                    merged.thriveReport = {
                        completedAt: profState.savedAt || new Date().toISOString(),
                        interviewee,
                        interviewer,
                        email,
                        userDetails: {
                            interviewee,
                            interviewer,
                            email
                        },
                        pillars: {
                            traits: rd.traits || '',
                            hobbies: rd.hobbies || '',
                            relationships: rd.relationships || '',
                            interests: rd.interests || '',
                            values: rd.values || '',
                            experiences: rd.experiences || ''
                        }
                    };
                }
            }
        } else if (merged.thriveReport && typeof merged.thriveReport === 'object') {
            const tr = merged.thriveReport;
            const interviewee = String(tr.interviewee || tr.userDetails?.interviewee || profState?.userDetails?.interviewee || '').trim();
            const interviewer = String(tr.interviewer || tr.userDetails?.interviewer || profState?.userDetails?.interviewer || '').trim();
            const email = String(tr.email || tr.userDetails?.email || profState?.userDetails?.email || '').trim();
            merged.thriveReport = {
                ...tr,
                interviewee,
                interviewer,
                email,
                userDetails: {
                    ...(tr.userDetails || {}),
                    interviewee,
                    interviewer,
                    email
                }
            };
        }

        // 3. Derive from thrive_hope_survey_state_v1 if not already present
        if (!merged.hopeIndex) {
            const hopeState = safeParseJSON(safeGetStorageItem('local', 'thrive_hope_survey_state_v1'));
            if (hopeState) {
                if (hopeState.summary && typeof hopeState.summary.totalHoPEScore100 === 'number') {
                    merged.hopeIndex = hopeState.summary;
                } else {
                    const histList = Array.isArray(hopeState.surveyHistory)
                        ? hopeState.surveyHistory
                        : (Array.isArray(hopeState.history) ? hopeState.history : []);
                    const latestHist = histList.length > 0 ? histList[histList.length - 1] : null;
                    const ans = (latestHist && latestHist.answers) || hopeState.answers || {};
                    const refl = (latestHist && latestHist.reflections) || hopeState.reflections || {};
                    const derivedHope = computeHopeIndexFromAnswers(ans, refl, hopeState.updatedAt);
                    if (derivedHope) {
                        merged.hopeIndex = derivedHope;
                    }
                }
            }
        }

        return merged;
    };

    const readDossier = () => {
        try {
            const raw = safeParseJSON(safeGetStorageItem('local', DOSSIER_KEY)) || {};
            return deriveFromSavedStates(raw);
        } catch (_) {
            return {};
        }
    };

    const writeDossier = (updater) => {
        try {
            const current = readDossier();
            const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
            next.updatedAt = new Date().toISOString();
            if (typeof localStorage !== 'undefined' && localStorage) {
                localStorage.setItem(DOSSIER_KEY, JSON.stringify(next));
            }
            refreshStatusBadges();
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('thrive-dossier-updated', { detail: next }));
            }
            return next;
        } catch (_) {
            return {};
        }
    };

    const savePracticeAudit = (auditData) => {
        const normalized = normalizePracticeAuditPayload(auditData);
        if (!normalized) return readDossier();
        return writeDossier(prev => ({
            ...prev,
            practiceAudit: {
                ...(prev.practiceAudit || {}),
                ...normalized,
                completedAt: normalized.completedAt || new Date().toISOString()
            }
        }));
    };

    const saveFlowSurvey = (flowData) => {
        const normalized = normalizeFlowSurveyPayload(flowData) || {};
        return writeDossier(prev => ({
            ...prev,
            flowSurvey: {
                completedAt: new Date().toISOString(),
                ...normalized
            }
        }));
    };

    const saveThriveReport = (reportPayload = {}) => {
        const pillars = reportPayload.pillars || reportPayload.reportData || {};
        const interviewee = String(reportPayload.interviewee || reportPayload.userDetails?.interviewee || '').trim();
        const interviewer = String(reportPayload.interviewer || reportPayload.userDetails?.interviewer || '').trim();
        const email = String(reportPayload.email || reportPayload.userDetails?.email || '').trim();
        const userDetails = {
            interviewee,
            interviewer,
            email
        };
        return writeDossier(prev => ({
            ...prev,
            thriveReport: {
                completedAt: reportPayload.completedAt || prev.thriveReport?.completedAt || new Date().toISOString(),
                ...reportPayload,
                interviewee,
                interviewer,
                email,
                userDetails,
                pillars
            }
        }));
    };

    const saveHopeIndex = (hopePayload) => {
        return writeDossier(prev => ({
            ...prev,
            hopeIndex: {
                completedAt: new Date().toISOString(),
                ...hopePayload
            }
        }));
    };

    const getCompletionSummary = (customDossier) => {
        const d = customDossier ? deriveFromSavedStates(customDossier) : readDossier();
        const hasPracticeAudit = Boolean(
            d.practiceAudit && (
                (Array.isArray(d.practiceAudit.ratings) && d.practiceAudit.ratings.some(n => typeof n === 'number' && n > 0)) ||
                (Array.isArray(d.practiceAudit.priorities) && d.practiceAudit.priorities.length > 0)
            )
        );
        const hasFlow = Boolean(d.flowSurvey && (d.flowSurvey.problem || d.flowSurvey.problemStatement || typeof d.flowSurvey.currentScore === 'number'));
        const hasProfile = Boolean(
            d.thriveReport &&
            d.thriveReport.pillars &&
            Object.values(d.thriveReport.pillars).some(v => v && String(v).trim().length > 0)
        );
        const hasHope = Boolean(d.hopeIndex && typeof d.hopeIndex.totalHoPEScore100 === 'number');
        const count = (hasFlow ? 1 : 0) + (hasProfile ? 1 : 0) + (hasHope ? 1 : 0);
        const totalCompleted = count + (hasPracticeAudit ? 1 : 0);
        return { count, totalCompleted, hasPracticeAudit, hasFlow, hasProfile, hasHope, dossier: d };
    };

    const getTierLabel = (score25) => {
        if (score25 >= 15) return 'High / Superpower';
        if (score25 >= 11) return 'Steady / Middle';
        return 'Low / Friction Drop';
    };

    const countPillarItems = (text) => {
        const cleaned = String(text || '').trim();
        if (!cleaned) return 0;
        const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length > 1) return lines.length;
        return cleaned.split(/[,;•]+/).map(s => s.trim()).filter(Boolean).length;
    };

    const buildMasterPrompt = (customDossier) => {
        const { count, totalCompleted, hasPracticeAudit, hasFlow, hasProfile, hasHope, dossier } = getCompletionSummary(customDossier);
        const pa = dossier.practiceAudit || {};
        const tr = dossier.thriveReport || {};
        const fullName = [pa.first, pa.last].filter(Boolean).join(' ').trim() || tr.interviewee || 'Unspecified';
        const orgLabel = pa.organization || '5 to THRiVE Practitioner Lab';
        const contactEmail = pa.email || tr.email || 'Unspecified';
        const lines = [];

        lines.push('================================================================================');
        lines.push('5 TO THRiVE PRACTITIONER LAB • CLINICAL DOSSIER & HOMEWORK SUBMISSION');
        lines.push('Destination: LearnWorlds Review Center & Personos AI Execution Engine');
        lines.push('================================================================================');
        lines.push(`Exported: ${new Date().toISOString()}`);
        lines.push(`Practitioner / Client: ${fullName}`);
        lines.push(`Organization / Cohort: ${orgLabel}`);
        lines.push(`Contact Email: ${contactEmail}`);
        lines.push(`Diagnostic Baseline Progress: ${totalCompleted} of 4 Sections Recorded (${[
            hasPracticeAudit ? '✓ Section 0: Practice Audit' : '○ Section 0: Practice Audit',
            hasFlow ? '✓ Step 1: Flow Survey' : '○ Step 1: Flow Survey',
            hasProfile ? '✓ Step 2: THRiVE Report' : '○ Step 2: THRiVE Report',
            hasHope ? '✓ Step 3: HoPE Index' : '○ Step 3: HoPE Index'
        ].join(' | ')})`);
        lines.push('');

        // SECTION 0: PRACTICE READINESS & COMMUNITY BLUEPRINT AUDIT
        lines.push('--------------------------------------------------------------------------------');
        lines.push('0. SECTION 00 — PRACTICE READINESS & COMMUNITY BLUEPRINT AUDIT (results.html)');
        lines.push('--------------------------------------------------------------------------------');
        if (hasPracticeAudit) {
            const ratings = Array.isArray(pa.ratings) ? pa.ratings : [null, null, null];
            lines.push(`• Between-Session Engagement Without Prompting: ${ratings[0] != null ? `${ratings[0]} / 5` : 'Unrated'} (Community Consensus: 84%)`);
            lines.push(`• Clients Seeking Unverified AI / Search for Distress: ${ratings[1] != null ? `${ratings[1]} / 5` : 'Unrated'} (Community Consensus: 94%)`);
            lines.push(`• Guardrailed, HIPAA-Compliant AI Co-Pilot & DAP Notes: ${ratings[2] != null ? `${ratings[2]} / 5` : 'Unrated'} (Community Consensus: 89%)`);
            lines.push(`• Voted Blueprint Priorities: ${Array.isArray(pa.priorities) && pa.priorities.length > 0 ? pa.priorities.join(', ') : 'None selected yet'}`);
        } else {
            lines.push('[Not yet completed on this device — Complete the Practice Readiness & Community Blueprint Audit at results.html or funnel.html.]');
        }
        lines.push('');

        // SECTION 1: FLOW SURVEY
        lines.push('--------------------------------------------------------------------------------');
        lines.push('1. SECTION 01 — THE FLOW SURVEY (FRICTION & FLOW DIAGNOSTIC) (survey.html)');
        lines.push('--------------------------------------------------------------------------------');
        if (hasFlow) {
            const fs = normalizeFlowSurveyPayload(dossier.flowSurvey) || dossier.flowSurvey;
            if (fs.problem) {
                lines.push(`• Primary "Ugg" Friction Point ("What Is It?"): "${fs.problem}"`);
            }
            if (fs.metaphor) {
                lines.push(`• Chosen Experience Metaphor ("What Is It Like?"): ${fs.metaphor}${fs.metaphorDesc ? ` — ${fs.metaphorDesc}` : ''}`);
            }
            if (typeof fs.currentScore === 'number') {
                const target = typeof fs.targetScore === 'number'
                    ? fs.targetScore
                    : Math.round(fs.currentScore + 0.6 * (100 - fs.currentScore));
                lines.push(`• Current Flow Score: ${fs.currentScore} / 100 (THRiVE 60% Friction-Reduction Target: ${target} / 100)`);
            }
            if (fs.dimensions) {
                lines.push('• 4-Dimension Flow Breakdown (0–25 Scale):');
                ['Agency', 'Actions', 'Support', 'Tools'].forEach(dim => {
                    if (typeof fs.dimensions[dim] === 'number') {
                        const s = fs.dimensions[dim];
                        lines.push(`  - ${dim}: ${s} / 25 (${getTierLabel(s)})`);
                    }
                });
            }
            if (fs.strongestDimension) {
                lines.push(`• Strongest Flow Anchor: ${fs.strongestDimension}`);
            }
            if (fs.lowestDimension) {
                lines.push(`• Primary Friction Drop: ${fs.lowestDimension}`);
            }
        } else {
            lines.push('[Not yet completed on this device — Complete the 3-minute Flow Survey at survey.html to pinpoint specific friction and Agency/Actions/Support/Tools scores.]');
        }
        lines.push('');

        // SECTION 2: THRIVE REPORT
        lines.push('--------------------------------------------------------------------------------');
        lines.push('2. SECTION 02 — THE THRiVE REPORT (6-PILLAR STRENGTHS INVENTORY) (profile.html)');
        lines.push('--------------------------------------------------------------------------------');
        if (hasProfile) {
            if (tr.interviewee || tr.interviewer) {
                lines.push(`• Client / Interviewee: ${tr.interviewee || 'Unspecified'}${tr.interviewer ? ` (Interviewed by: ${tr.interviewer})` : ''}`);
            }
            if (tr.email) {
                lines.push(`• Contact Email: ${tr.email}`);
            }
            lines.push('• Clinical Quota Guideline: 3 to 5 Verified Items Per Pillar');
            const pillarLabels = [
                ['traits', 'Traits (T) — Core Qualities & Innate Superpowers'],
                ['hobbies', 'Hobbies (H) — Flow-State Energy Generators'],
                ['relationships', 'Relationships (R) — Supportive Cast & Accountability Mirrors'],
                ['interests', 'Interests (I) — Intellectual Curiosity Compass'],
                ['values', 'Values (V) — Non-Negotiable Operating Principles'],
                ['experiences', 'Experiences (E) — Crucible Moments & Highlight Reel']
            ];
            pillarLabels.forEach(([key, label]) => {
                const val = tr.pillars?.[key] ? String(tr.pillars[key]).trim() : '';
                const itemCount = countPillarItems(val);
                const countSuffix = itemCount > 0 ? ` [${itemCount} item${itemCount === 1 ? '' : 's'} logged]` : '';
                lines.push(`• ${label}${countSuffix}:`);
                lines.push(val ? `  ${val.replace(/\r?\n/g, '\n  ')}` : '  (Not yet recorded)');
            });
        } else {
            lines.push('[Not yet completed on this device — Build the 6-pillar THRiVE Strengths Report at profile.html across Traits, Hobbies, Relationships, Interests, Values, and Experiences.]');
        }
        lines.push('');

        // SECTION 3: HOPE INDEX
        lines.push('--------------------------------------------------------------------------------');
        lines.push('3. SECTION 03 — THE HoPE INDEX (20 LIFE ANCHORS & CONTEXTUAL LAYERING) (hope-survey.html)');
        lines.push('--------------------------------------------------------------------------------');
        if (hasHope) {
            const hi = dossier.hopeIndex;
            lines.push(`• Total HoPE Capacity Score: ${hi.totalHoPEScore100}% (${hi.tierText || 'ASSESSED'})`);
            lines.push(`• Space Balance: Outer Physical Space (OPS) = ${hi.opsScore50}/50 | Inner Relational Space (IRS) = ${hi.irsScore50}/50`);
            if (hi.highestDimension) {
                lines.push(`• Strongest Resilience Anchor: ${hi.highestDimension.name} (${Number(hi.highestDimension.score).toFixed(1)} / 5.0)`);
            }
            if (hi.lowestDimension) {
                lines.push(`• Priority Growth Focus Area: ${hi.lowestDimension.name} (${Number(hi.lowestDimension.score).toFixed(1)} / 5.0 in ${hi.lowestDimension.space || 'HoPE Index'})`);
            }
            if (Array.isArray(hi.dimensions) && hi.dimensions.length > 0) {
                lines.push('• 6 Core Dimension Averages (0–5.0 Scale):');
                hi.dimensions.forEach(d => {
                    if (d && d.name) {
                        const scStr = (d.score !== null && d.score !== undefined) ? `${Number(d.score).toFixed(1)} / 5.0` : 'Unrated';
                        lines.push(`  - ${d.name} (${d.space || ''}): ${scStr}`);
                    }
                });
            }
            lines.push('• Contextual Layering (Flex Slots):');
            lines.push(`  - Q19 Gang Affinity Score (GAS): ${hi.flexGasScore != null ? `${Number(hi.flexGasScore).toFixed(1)} / 5.0 (${hi.flexGasLabel || ''})` : 'Unrated'}`);
            lines.push(`  - Q20 Psychological Safety Score (PSS): ${hi.flexPssScore != null ? `${Number(hi.flexPssScore).toFixed(1)} / 5.0 (${hi.flexPssLabel || ''})` : 'Unrated'}`);
            if (Array.isArray(hi.reflections) && hi.reflections.length > 0) {
                lines.push('• Client Personal Reflections & Notes:');
                hi.reflections.forEach(r => {
                    if (r && r.text) {
                        lines.push(`  - ${r.title || r.dimension || 'Note'}${r.score != null ? ` (${Number(r.score).toFixed(1)}/5.0)` : ''}: ${r.text}`);
                    }
                });
            } else if (hi.reflections && typeof hi.reflections === 'object') {
                const reflKeys = Object.keys(hi.reflections).filter(k => String(hi.reflections[k] || '').trim().length > 0);
                if (reflKeys.length > 0) {
                    lines.push('• Client Personal Reflections & Notes:');
                    reflKeys.forEach(k => {
                        const readableKey = HOPE_QUESTION_LABELS[k] || k;
                        lines.push(`  - ${readableKey}: ${String(hi.reflections[k]).trim()}`);
                    });
                }
            }
        } else {
            lines.push('[Not yet completed on this device — Complete the 20-question HoPE Index at hope-survey.html to benchmark Outer Physical Space, Inner Relational Space, and Psychological Safety.]');
        }
        lines.push('');

        // SECTION 4: PERSONOS AI & LEARNWORLDS DIRECTIVES
        lines.push('--------------------------------------------------------------------------------');
        lines.push('4. SECTION 04 — PERSONOS AI EXECUTION ENGINE & LEARNWORLDS HOMEWORK DIRECTIVE');
        lines.push('--------------------------------------------------------------------------------');
        lines.push('Please act as my 5 to THRiVE Clinical Force Multiplier and Corner Coach (grounded in SOL Theory, RellaFit, The Strengths Model, and CYNEFIN):');
        lines.push('1. Grounding in the Observer Stance ("Rate the Level, Not the Player"): Validate the environmental and relational friction documented above without pathologizing the individual.');
        lines.push('2. Strengths-First Synthesis: Anchor the 6 THRiVE pillars (Traits, Hobbies, Relationships, Interests, Values, Experiences) and strongest Flow/HoPE dimensions directly against the primary friction drop.');
        lines.push('3. Five Simple, Practical, and Fun (SPF) Action Board Steps: Formulate 5 concrete micro-experiments for the 167 hours between clinical sessions to reduce friction by 60%.');
        lines.push('4. Automated Clinical DAP Note Draft: Structure session insights into audit-ready Data, Assessment, and Plan sections for practitioner review and LearnWorlds Review Center submission.');
        lines.push('================================================================================');

        return lines.join('\n');
    };

    const refreshStatusBadges = () => {
        if (typeof document === 'undefined') return;
        const { count, hasPracticeAudit, hasFlow, hasProfile, hasHope } = getCompletionSummary();
        document.querySelectorAll('[data-dossier-status]').forEach(el => {
            if (count === 0 && !hasPracticeAudit) {
                el.textContent = 'Ready to combine your baseline diagnostics (0/3 core tools saved)';
            } else {
                const names = [
                    hasPracticeAudit ? 'Practice Audit' : null,
                    hasFlow ? 'Flow Survey' : null,
                    hasProfile ? 'THRiVE Report' : null,
                    hasHope ? 'HoPE Index' : null
                ].filter(Boolean).join(' + ');
                el.textContent = `${count}/3 Core Diagnostics Ready (${names})`;
            }
        });
    };

    let isGlobalSharing = false;

    const isShareAbortError = (err) => {
        if (!err) return false;
        const name = String(err.name || '');
        const msg = String(err.message || '').toLowerCase();
        return (
            name === 'AbortError' ||
            name === 'InvalidStateError' ||
            msg.includes('aborterror') ||
            msg.includes('invalidstateerror') ||
            msg.includes('earlier share') ||
            msg.includes('cancel') ||
            msg.includes('aborted')
        );
    };

    const canNativeShare = (sharePayload) => {
        if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
            return false;
        }
        if (typeof navigator.canShare === 'function' && sharePayload) {
            try {
                return Boolean(navigator.canShare(sharePayload));
            } catch (_) {
                return true;
            }
        }
        return true;
    };

    const setDossierBtnFeedback = (triggerBtn, feedbackText, fallbackDefaultLabel) => {
        if (!triggerBtn || typeof triggerBtn !== 'object' || !('textContent' in triggerBtn)) return;
        const labelEl = typeof triggerBtn.querySelector === 'function'
            ? (triggerBtn.querySelector('.master-prompt-btn-label') || triggerBtn.querySelector('.share-btn-label'))
            : null;
        if (!triggerBtn.dataset) triggerBtn.dataset = {};
        if (!triggerBtn.dataset.defaultLabel) {
            triggerBtn.dataset.defaultLabel = labelEl
                ? String(labelEl.textContent || '').trim()
                : String(triggerBtn.textContent || '').trim();
        }
        if (triggerBtn.classList && typeof triggerBtn.classList.add === 'function') {
            triggerBtn.classList.add('is-copied');
        }
        if (labelEl) {
            labelEl.textContent = feedbackText;
        } else {
            triggerBtn.textContent = feedbackText;
        }

        if (triggerBtn._dossierTimeout) {
            clearTimeout(triggerBtn._dossierTimeout);
        }
        triggerBtn._dossierTimeout = setTimeout(() => {
            if (triggerBtn.classList && typeof triggerBtn.classList.remove === 'function') {
                triggerBtn.classList.remove('is-copied');
            }
            const orig = triggerBtn.dataset.defaultLabel || fallbackDefaultLabel;
            if (labelEl) {
                labelEl.textContent = orig;
            } else {
                triggerBtn.textContent = orig;
            }
        }, 2500);
    };

    const announceDossierLiveFeedback = (msg) => {
        if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
        const liveEl = document.getElementById('dossier-export-feedback') || document.getElementById('share-feedback');
        if (!liveEl) return;
        liveEl.textContent = msg;
        if (liveEl._dossierFeedbackTimer) clearTimeout(liveEl._dossierFeedbackTimer);
        liveEl._dossierFeedbackTimer = setTimeout(() => {
            if (liveEl.textContent === msg) liveEl.textContent = '';
        }, 3200);
    };

    const copyMasterPrompt = async (triggerBtn, customDossier) => {
        fireThriveHaptic(15);
        const promptText = buildMasterPrompt(customDossier);
        const ok = await copyTextWithFallback(promptText);
        setDossierBtnFeedback(
            triggerBtn,
            ok ? '✓ Clinical Dossier Copied!' : 'Copied to Clipboard ✓',
            '📋 Export / Copy Clinical Dossier for LearnWorlds & Personos'
        );
        announceDossierLiveFeedback(
            ok
                ? '✓ Clinical Dossier copied to clipboard for LearnWorlds Review Center & Personos AI!'
                : '⚠️ Clipboard blocked — please copy your diagnostic results manually.'
        );
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('thrive-dossier-exported', { detail: { ok, copied: ok, promptText, length: promptText.length } }));
        }
        return { ok, method: 'clipboard', shared: false, copied: ok, canceled: false, promptText, prompt: promptText };
    };

    const shareWithFallback = async (sharePayload = {}, triggerBtn = null, options = {}) => {
        fireThriveHaptic(15);
        const cleanPayload = {};
        if (sharePayload.title) cleanPayload.title = String(sharePayload.title);
        if (sharePayload.text) cleanPayload.text = String(sharePayload.text);
        if (sharePayload.url) cleanPayload.url = String(sharePayload.url);

        const fallbackText = options.fallbackText != null
            ? String(options.fallbackText)
            : [cleanPayload.text, cleanPayload.url].filter(Boolean).join('\n');
        const defaultLabel = options.defaultLabel || '📤 Share Dossier';
        const sharedLabel = options.sharedLabel || 'Shared ✓';
        const copiedLabel = options.copiedLabel || '✓ Clinical Dossier Copied!';

        if (isGlobalSharing || (triggerBtn && triggerBtn._isSharing)) {
            return { ok: false, method: 'share', shared: false, copied: false, canceled: true, text: fallbackText };
        }

        if (canNativeShare(cleanPayload)) {
            isGlobalSharing = true;
            if (triggerBtn) triggerBtn._isSharing = true;
            try {
                await navigator.share(cleanPayload);
                setDossierBtnFeedback(triggerBtn, sharedLabel, defaultLabel);
                return { ok: true, method: 'share', shared: true, copied: false, canceled: false, text: fallbackText };
            } catch (err) {
                if (isShareAbortError(err)) {
                    return { ok: false, method: 'share', shared: false, copied: false, canceled: true, text: fallbackText };
                }
                // Non-AbortError falls through to clipboard fallback
            } finally {
                isGlobalSharing = false;
                if (triggerBtn) triggerBtn._isSharing = false;
            }
        }

        const ok = await copyTextWithFallback(fallbackText);
        setDossierBtnFeedback(triggerBtn, ok ? copiedLabel : 'Copied to Clipboard ✓', defaultLabel);
        return { ok, method: 'clipboard', shared: false, copied: ok, canceled: false, text: fallbackText };
    };

    const shareMasterPrompt = async (triggerBtn, customDossier) => {
        const promptText = buildMasterPrompt(customDossier);
        const res = await shareWithFallback(
            {
                title: '5 to THRiVE Practitioner Lab • Clinical Dossier',
                text: promptText
            },
            triggerBtn,
            {
                fallbackText: promptText,
                defaultLabel: '📤 Share Dossier',
                sharedLabel: 'Shared ✓',
                copiedLabel: '✓ Clinical Dossier Copied!'
            }
        );
        return { ...res, promptText };
    };

    window.ThriveCoachingDossier = {
        readDossier,
        savePracticeAudit,
        saveFlowSurvey,
        saveThriveReport,
        saveHopeIndex,
        getCompletionSummary,
        getSummaryStatus: getCompletionSummary,
        buildMasterPrompt,
        buildClinicalDossier: buildMasterPrompt,
        copyMasterPrompt,
        exportClinicalDossier: copyMasterPrompt,
        shareMasterPrompt,
        shareWithFallback,
        canNativeShare,
        isSharing: () => isGlobalSharing,
        copyTextWithFallback,
        triggerHaptic: triggerThriveHaptic,
        refreshStatusBadges,
        refreshPageUI: refreshStatusBadges
    };

    if (typeof document !== 'undefined') {
        document.addEventListener('click', (e) => {
            const shareBtn = e.target && typeof e.target.closest === 'function'
                ? e.target.closest('.share-master-prompt-btn, [data-share-master-prompt]')
                : null;
            if (shareBtn && !shareBtn.hasAttribute('data-react-handled')) {
                e.preventDefault();
                shareMasterPrompt(shareBtn);
                return;
            }

            const btn = e.target && typeof e.target.closest === 'function'
                ? e.target.closest('.copy-master-prompt-btn, .export-dossier-btn, .export-clinical-dossier-btn, [data-export-dossier]')
                : null;
            if (btn && !btn.hasAttribute('data-react-handled') && !btn.hasAttribute('data-inline-dossier-handled')) {
                e.preventDefault();
                copyMasterPrompt(btn);
            }
        });
        window.addEventListener('storage', refreshStatusBadges);
    }
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThriveUI);
} else {
    initThriveUI();
}

