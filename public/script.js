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

        const walkthroughNarrationText = "Welcome to Thrive Coaching. Step 1: Name the Friction — pinpoint whether you feel stuck in a hole, on a hamster wheel, or juggling too much. Step 2: Map Your Strengths across Traits, Hobbies, Relationships, Interests, Values, and Expertise. Step 3: Reclaim Your Agency and turn insight into concrete daily momentum with your Personos AI coach.";

        const stopWalkthroughSpeech = () => {
            if (window.speechSynthesis) {
                try { window.speechSynthesis.cancel(); } catch (_) {}
            }
        };

        const speakWalkthrough = () => {
            if (!window.speechSynthesis || !narrationActive) return;
            try {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(walkthroughNarrationText);
                u.rate = 1.0;
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
                    if (playPromise && typeof playPromise.then === 'function') {
                        playPromise.then(syncPlayBtnLabel).catch(() => syncPlayBtnLabel());
                    } else {
                        syncPlayBtnLabel();
                    }
                }
            }
        };

        if (playToggleBtn && videoEl) {
            playToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (videoEl.paused) {
                    const p = videoEl.play();
                    if (p && typeof p.then === 'function') p.then(syncPlayBtnLabel).catch(syncPlayBtnLabel);
                    else syncPlayBtnLabel();
                    if (narrationActive) speakWalkthrough();
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
                if (p && typeof p.then === 'function') p.then(syncPlayBtnLabel).catch(syncPlayBtnLabel);
                else syncPlayBtnLabel();
                if (narrationActive) speakWalkthrough();
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
                        if (p && typeof p.then === 'function') p.then(syncPlayBtnLabel).catch(syncPlayBtnLabel);
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
                    if (p && typeof p.then === 'function') p.then(syncPlayBtnLabel).catch(syncPlayBtnLabel);
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
    }

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
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThriveUI);
} else {
    initThriveUI();
}
