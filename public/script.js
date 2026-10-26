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
        'results'
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

        const walkthroughNarrationText = "Welcome to Thrive Coaching. Step 1: Name the Friction — pinpoint whether you feel stuck in a hole, on a hamster wheel, or juggling too much. Step 2: Map Your Strengths across Traits, Hobbies, Relationships, Interests, Values, and Expertise. Step 3: Reclaim Your Agency and turn insight into concrete daily momentum with your Personos AI coach.";

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

        if (merged.flowSurvey) {
            merged.flowSurvey = normalizeFlowSurveyPayload(merged.flowSurvey);
        }

        // 1. Derive from thrive_flow_survey_state_v1 if not already present (only when all 20 questions are answered)
        if (!merged.flowSurvey) {
            const flowState = safeParseJSON(typeof localStorage !== 'undefined' ? localStorage.getItem('thrive_flow_survey_state_v1') : null);
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
        if (!merged.thriveReport) {
            const profState = safeParseJSON(typeof localStorage !== 'undefined' ? localStorage.getItem('thrive_profile_state_v1') : null);
            if (profState && profState.reportData && typeof profState.reportData === 'object') {
                const rd = profState.reportData;
                const hasAny = ['traits', 'hobbies', 'relationships', 'interests', 'values', 'experiences'].some(k => rd[k] && String(rd[k]).trim());
                if (hasAny) {
                    merged.thriveReport = {
                        completedAt: profState.savedAt || new Date().toISOString(),
                        interviewee: profState.userDetails?.interviewee || '',
                        interviewer: profState.userDetails?.interviewer || '',
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
        }

        // 3. Derive from thrive_hope_survey_state_v1 if not already present
        if (!merged.hopeIndex) {
            const hopeState = safeParseJSON(typeof localStorage !== 'undefined' ? localStorage.getItem('thrive_hope_survey_state_v1') : null);
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
            const raw = safeParseJSON(localStorage.getItem(DOSSIER_KEY)) || {};
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
            localStorage.setItem(DOSSIER_KEY, JSON.stringify(next));
            refreshStatusBadges();
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('thrive-dossier-updated', { detail: next }));
            }
            return next;
        } catch (_) {
            return {};
        }
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
        const interviewee = reportPayload.interviewee || reportPayload.userDetails?.interviewee || '';
        const interviewer = reportPayload.interviewer || reportPayload.userDetails?.interviewer || '';
        return writeDossier(prev => ({
            ...prev,
            thriveReport: {
                completedAt: new Date().toISOString(),
                ...reportPayload,
                interviewee,
                interviewer,
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
        const hasFlow = Boolean(d.flowSurvey && (d.flowSurvey.problem || d.flowSurvey.problemStatement || typeof d.flowSurvey.currentScore === 'number'));
        const hasProfile = Boolean(
            d.thriveReport &&
            d.thriveReport.pillars &&
            Object.values(d.thriveReport.pillars).some(v => v && String(v).trim().length > 0)
        );
        const hasHope = Boolean(d.hopeIndex && typeof d.hopeIndex.totalHoPEScore100 === 'number');
        const count = (hasFlow ? 1 : 0) + (hasProfile ? 1 : 0) + (hasHope ? 1 : 0);
        return { count, hasFlow, hasProfile, hasHope, dossier: d };
    };

    const getTierLabel = (score25) => {
        if (score25 >= 15) return 'High / Superpower';
        if (score25 >= 11) return 'Steady / Middle';
        return 'Low / Friction Drop';
    };

    const buildMasterPrompt = (customDossier) => {
        const { count, hasFlow, hasProfile, hasHope, dossier } = getCompletionSummary(customDossier);
        const lines = [];

        lines.push('=== SOL THRiVE • MASTER AI COACHING DOSSIER (PERSONOS AI PROMPT) ===');
        lines.push(`Completed Diagnostic Steps Included: ${count} of 3 (${[
            hasFlow ? '✓ Step 1: Flow Survey' : '○ Step 1: Flow Survey',
            hasProfile ? '✓ Step 2: THRiVE Strengths Report' : '○ Step 2: THRiVE Strengths Report',
            hasHope ? '✓ Step 3: HoPE Index' : '○ Step 3: HoPE Index'
        ].join(' | ')})`);
        lines.push('');

        // STEP 1: FLOW SURVEY
        lines.push('------------------------------------------------------------');
        lines.push('1. STEP 01 — FLOW SURVEY (FRICTION & FLOW DIAGNOSTIC)');
        lines.push('------------------------------------------------------------');
        if (hasFlow) {
            const fs = normalizeFlowSurveyPayload(dossier.flowSurvey) || dossier.flowSurvey;
            if (fs.problem) {
                lines.push(`• Specific Friction ("What Is It?"): "${fs.problem}"`);
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
                lines.push('• Flow Dimension Breakdown (each 0–25):');
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
            lines.push('[Not yet completed — User can complete the 3-minute Flow Survey at survey.html to pinpoint their specific friction and Agency/Actions/Support/Tools scores.]');
        }
        lines.push('');

        // STEP 2: THRIVE REPORT
        lines.push('------------------------------------------------------------');
        lines.push('2. STEP 02 — THE THRiVE REPORT (6-PILLAR STRENGTHS INVENTORY)');
        lines.push('------------------------------------------------------------');
        if (hasProfile) {
            const tr = dossier.thriveReport;
            if (tr.interviewee) {
                lines.push(`• Client / Interviewee: ${tr.interviewee}${tr.interviewer ? ` (Interviewed by ${tr.interviewer})` : ''}`);
            }
            const pillarLabels = [
                ['traits', 'Traits (T) — Core Qualities & Superpowers'],
                ['hobbies', 'Hobbies (H) — Energy Generators & Flow Activities'],
                ['relationships', 'Relationships (R) — Supportive Ensemble Cast'],
                ['interests', 'Interests (I) — Intellectual Curiosity & Rabbit Holes'],
                ['values', 'Values (V) — Non-Negotiable Principles'],
                ['experiences', 'Experiences (E) — Peak Memories & Highlight Reel']
            ];
            pillarLabels.forEach(([key, label]) => {
                const val = tr.pillars?.[key] ? String(tr.pillars[key]).trim() : '';
                lines.push(`• ${label}:`);
                lines.push(val ? val : '  (Not yet recorded)');
            });
        } else {
            lines.push('[Not yet completed — User can build their 6-pillar THRiVE Strengths Report at profile.html across Traits, Hobbies, Relationships, Interests, Values, and Experiences.]');
        }
        lines.push('');

        // STEP 3: HOPE INDEX
        lines.push('------------------------------------------------------------');
        lines.push('3. STEP 03 — THE HoPE INDEX (20 LIFE ANCHORS & CONTEXTUAL LAYERING)');
        lines.push('------------------------------------------------------------');
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
                lines.push('• 6 Core Dimension Averages:');
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
            lines.push('[Not yet completed — User can complete the 20-question HoPE Index at hope-survey.html to benchmark their Outer Physical Space, Inner Relational Space, and Psychological Safety.]');
        }
        lines.push('');

        // COACHING INSTRUCTIONS
        lines.push('------------------------------------------------------------');
        lines.push('4. INSTRUCTIONS FOR PERSONOS AI COACH');
        lines.push('------------------------------------------------------------');
        lines.push('Please act as my SOL THRiVE Corner Coach (grounded in The Strengths Model, the CYNEFIN Framework, and The Heart & Soul of Change):');
        lines.push('1. Empathy & Sense-Making ("Rate the Level, Not the Player"): Validate the environmental and relational friction shown above without judgment.');
        lines.push('2. Strengths-First Synthesis: Connect my THRiVE Report strengths (Traits, Hobbies, Relationships, Interests, Values, Experiences) and strongest Flow/HoPE anchors directly to my primary friction point and lowest-scoring dimension.');
        lines.push('3. Five Simple, Practical, and Fun (SPF) Next Steps: Propose 5 concrete, manageable micro-experiments I can try this week to reduce my friction by 60% and build daily momentum.');

        return lines.join('\n');
    };

    const refreshStatusBadges = () => {
        if (typeof document === 'undefined') return;
        const { count, hasFlow, hasProfile, hasHope } = getCompletionSummary();
        document.querySelectorAll('[data-dossier-status]').forEach(el => {
            if (count === 0) {
                el.textContent = 'Ready to combine your 3 steps (0/3 saved so far)';
            } else {
                const names = [
                    hasFlow ? 'Flow Survey' : null,
                    hasProfile ? 'THRiVE Report' : null,
                    hasHope ? 'HoPE Index' : null
                ].filter(Boolean).join(' + ');
                el.textContent = `${count}/3 Steps Ready (${names})`;
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

    const copyMasterPrompt = async (triggerBtn, customDossier) => {
        const promptText = buildMasterPrompt(customDossier);
        const ok = await copyTextWithFallback(promptText);
        setDossierBtnFeedback(
            triggerBtn,
            ok ? 'Copied ✓' : 'Copied to Clipboard ✓',
            '📋 Copy Master AI Coaching Prompt'
        );
        return { ok, method: 'clipboard', shared: false, copied: ok, canceled: false, promptText };
    };

    const shareWithFallback = async (sharePayload = {}, triggerBtn = null, options = {}) => {
        const cleanPayload = {};
        if (sharePayload.title) cleanPayload.title = String(sharePayload.title);
        if (sharePayload.text) cleanPayload.text = String(sharePayload.text);
        if (sharePayload.url) cleanPayload.url = String(sharePayload.url);

        const fallbackText = options.fallbackText != null
            ? String(options.fallbackText)
            : [cleanPayload.text, cleanPayload.url].filter(Boolean).join('\n');
        const defaultLabel = options.defaultLabel || '📤 Share Dossier';
        const sharedLabel = options.sharedLabel || 'Shared ✓';
        const copiedLabel = options.copiedLabel || 'Copied ✓';

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
                title: 'SOL THRiVE • Master AI Coaching Dossier',
                text: promptText
            },
            triggerBtn,
            {
                fallbackText: promptText,
                defaultLabel: '📤 Share Dossier',
                sharedLabel: 'Shared ✓',
                copiedLabel: 'Copied ✓'
            }
        );
        return { ...res, promptText };
    };

    window.ThriveCoachingDossier = {
        readDossier,
        saveFlowSurvey,
        saveThriveReport,
        saveHopeIndex,
        getCompletionSummary,
        getSummaryStatus: getCompletionSummary,
        buildMasterPrompt,
        copyMasterPrompt,
        shareMasterPrompt,
        shareWithFallback,
        canNativeShare,
        isSharing: () => isGlobalSharing,
        copyTextWithFallback,
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
                ? e.target.closest('.copy-master-prompt-btn')
                : null;
            if (btn && !btn.hasAttribute('data-react-handled')) {
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

