(function () {
    'use strict';

    if (window.speedup_plugin_started) {
        console.log('[SpeedUp] Plugin already running');
        return;
    }
    window.speedup_plugin_started = true;

    // --- Localization ---
    var _rawLang = (Lampa.Storage.get('language') || 'en').toLowerCase();
    var i18n = {
        ru: { speed_text: '▶▶ 2x Ускорение' },
        en: { speed_text: '▶▶ 2x Speed' },
        uk: { speed_text: '▶▶ 2x Прискорення' },
        be: { speed_text: '▶▶ 2x Паскарэнне' }
    };
    var T = i18n[_rawLang] || i18n['en'];

    let originalRate = 1;
    let isSpeeding = false;
    let speedUi = null;
    let actionTimeout = null;
    let isActionSpeeding = false;

    // Find the <video> tag inside Lampa
    function getVideo() {
        let vid = null;
        if (typeof Lampa !== 'undefined' && Lampa.PlayerVideo && Lampa.PlayerVideo.video) {
            vid = Lampa.PlayerVideo.video();
        }
        if (!vid) {
            vid = document.querySelector('.player-video__display video') || document.querySelector('.player video') || document.querySelector('video');
        }
        return vid;
    }

    // Draw the speedup badge centered at the top
    function createUI() {
        if ($('.speedup-indicator').length) return;
        speedUi = $('<div class="speedup-indicator" style="position: absolute; top: 15%; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.6); color: white; padding: 8px 20px; border-radius: 20px; font-size: 1.5em; font-weight: bold; z-index: 9999; display: none; pointer-events: none; text-shadow: 0 0 10px rgba(0,0,0,0.5);">' + T.speed_text + '</div>');
        
        let container = $('.player-video__display').length ? $('.player-video__display') : $('.player');
        container.append(speedUi);
    }

    function startSpeedUp() {
        let vid = getVideo();
        if (!vid || isSpeeding) return;

        originalRate = vid.playbackRate; // Store current speed
        vid.playbackRate = 2.0;
        isSpeeding = true;

        if (!speedUi || !speedUi.parent().length) createUI();
        if (speedUi) speedUi.stop(true, true).fadeIn(150);
        console.log('[SpeedUp] 2x speed enabled');
    }

    function stopSpeedUp() {
        let vid = getVideo();
        if (!vid || !isSpeeding) return;

        vid.playbackRate = originalRate;
        isSpeeding = false;

        if (speedUi) speedUi.stop(true, true).fadeOut(150);
        console.log('[SpeedUp] Speed restored to:', originalRate);
    }

    function cancelSpeedUpAction(e) {
        clearTimeout(actionTimeout);
        if (isActionSpeeding) {
            stopSpeedUp();
            isActionSpeeding = false;
            // Mute the event so releasing the key/mouse doesn't trigger pause
            if (e && e.cancelable) {
                e.preventDefault();
                e.stopPropagation();
            }
            return true;
        }
        return false;
    }

    // --- Keyboard handling (Spacebar) ---
    window.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && getVideo()) {
            if (!e.repeat) {
                actionTimeout = setTimeout(() => {
                    let vid = getVideo();
                    if (vid && !vid.paused) {
                        startSpeedUp();
                        isActionSpeeding = true;
                    }
                }, 300); // 300ms hold = trigger speedup
            }
            // Intercept space to prevent Lampa from pausing instantly
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    window.addEventListener('keyup', function(e) {
        if (e.code === 'Space' && getVideo()) {
            let wasSpeeding = cancelSpeedUpAction(e);
            if (!wasSpeeding) {
                // If not speeding (short press) - toggle pause/play
                let vid = getVideo();
                if (vid) {
                    if (vid.paused) {
                        if (typeof Lampa !== 'undefined' && Lampa.PlayerVideo && Lampa.PlayerVideo.play) Lampa.PlayerVideo.play();
                        else vid.play();
                    } else {
                        if (typeof Lampa !== 'undefined' && Lampa.PlayerVideo && Lampa.PlayerVideo.pause) Lampa.PlayerVideo.pause();
                        else vid.pause();
                    }
                }
            }
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    // --- Mouse handling ---
    window.addEventListener('mousedown', function(e) {
        // Ensure LMB, video exists, and not clicking player controls
        if (e.button === 0 && getVideo() && !$(e.target).closest('.player-panel').length) {
            actionTimeout = setTimeout(() => {
                let vid = getVideo();
                if (vid && !vid.paused) {
                    startSpeedUp();
                    isActionSpeeding = true;
                }
            }, 300);
        }
    }, true);

    window.addEventListener('mouseup', function(e) {
        if (e.button === 0) {
            cancelSpeedUpAction(e);
        }
    }, true);

    // --- Touchscreen handling ---
    window.addEventListener('touchstart', function(e) {
        if (getVideo() && !$(e.target).closest('.player-panel').length) {
            actionTimeout = setTimeout(() => {
                let vid = getVideo();
                if (vid && !vid.paused) {
                    startSpeedUp();
                    isActionSpeeding = true;
                }
            }, 300);
        }
    }, { passive: true, capture: true });

    window.addEventListener('touchend', cancelSpeedUpAction, true);
    window.addEventListener('touchcancel', cancelSpeedUpAction, true);

    // --- Failsafes ---
    window.addEventListener('blur', cancelSpeedUpAction);
    window.addEventListener('mouseleave', cancelSpeedUpAction);

    // Cleanup on Lampa player destroy
    if (typeof Lampa !== 'undefined' && Lampa.Player && Lampa.Player.listener) {
        Lampa.Player.listener.follow('destroy', function () {
            cancelSpeedUpAction();
            if (speedUi) {
                speedUi.remove();
                speedUi = null;
            }
            originalRate = 1;
        });
    }

})();
