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

    const deriveFromSavedStates = (dossier) => {
        const merged = { ...(dossier || {}) };

        // 1. Derive from thrive_flow_survey_state_v1 if not already present
        if (!merged.flowSurvey) {
            const flowState = safeParseJSON(typeof localStorage !== 'undefined' ? localStorage.getItem('thrive_flow_survey_state_v1') : null);
            if (flowState && Array.isArray(flowState.scores) && Array.isArray(flowState.answered) && flowState.answered.some(Boolean)) {
                const sc = flowState.scores.map(n => Number(n) || 0);
                const total = sc.reduce((a, b) => a + b, 0);
                const target = Math.round(total + 0.6 * (100 - total));
                merged.flowSurvey = {
                    completedAt: flowState.savedAt || new Date().toISOString(),
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
                };
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
                const latestHist = Array.isArray(hopeState.history) && hopeState.history.length > 0
                    ? hopeState.history[hopeState.history.length - 1]
                    : null;
                const ans = (latestHist && latestHist.answers) || hopeState.answers || {};
                const ansKeys = Object.keys(ans);
                if (ansKeys.length > 0 && hopeState.summary) {
                    merged.hopeIndex = hopeState.summary;
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
        return writeDossier(prev => ({
            ...prev,
            flowSurvey: {
                completedAt: new Date().toISOString(),
                ...flowData
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
        const d = customDossier || readDossier();
        const hasFlow = Boolean(d.flowSurvey && (d.flowSurvey.problem || typeof d.flowSurvey.currentScore === 'number'));
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
            const fs = dossier.flowSurvey;
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
                        lines.push(`  - ${k}: ${String(hi.reflections[k]).trim()}`);
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

    const copyMasterPrompt = async (triggerBtn, customDossier) => {
        const promptText = buildMasterPrompt(customDossier);
        const ok = await copyTextWithFallback(promptText);

        if (triggerBtn && typeof triggerBtn === 'object' && 'textContent' in triggerBtn) {
            const labelEl = typeof triggerBtn.querySelector === 'function' ? triggerBtn.querySelector('.master-prompt-btn-label') : null;
            if (!triggerBtn.dataset) triggerBtn.dataset = {};
            if (!triggerBtn.dataset.defaultLabel) {
                triggerBtn.dataset.defaultLabel = labelEl ? labelEl.textContent : String(triggerBtn.textContent || '').trim();
            }
            if (triggerBtn.classList && typeof triggerBtn.classList.add === 'function') {
                triggerBtn.classList.add('is-copied');
            }
            const copiedText = ok ? 'Copied ✓' : 'Copied to Clipboard ✓';
            if (labelEl) {
                labelEl.textContent = copiedText;
            } else {
                triggerBtn.textContent = copiedText;
            }

            if (triggerBtn._dossierTimeout) {
                clearTimeout(triggerBtn._dossierTimeout);
            }
            triggerBtn._dossierTimeout = setTimeout(() => {
                triggerBtn.classList.remove('is-copied');
                const orig = triggerBtn.dataset.defaultLabel || '📋 Copy Master AI Coaching Prompt';
                if (labelEl) {
                    labelEl.textContent = orig;
                } else {
                    triggerBtn.textContent = orig;
                }
            }, 2500);
        }

        return { ok, promptText };
    };

    window.ThriveCoachingDossier = {
        readDossier,
        saveFlowSurvey,
        saveThriveReport,
        saveHopeIndex,
        getCompletionSummary,
        buildMasterPrompt,
        copyMasterPrompt,
        refreshStatusBadges
    };

    if (typeof document !== 'undefined') {
        document.addEventListener('click', (e) => {
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

