(function () {
    'use strict';

    function startAnimeMadness() {
        let style = document.createElement('style');
        style.innerHTML = `
            .menu__case .menu__item:not([data-action="anime"]):not([data-action="settings"]) {
                display: none !important;
            }
            .menu__split {
                display: none !important;
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            if (window.Lampa && Lampa.Router) {
                Lampa.Router.call('category', {
                    url: 'anime',
                    title: 'Аниме',
                    source: 'cub'
                });
            } else if (window.Lampa && Lampa.Utils) {
                let animeBtn = document.querySelector('.menu__item[data-action="anime"]');
                if (animeBtn) {
                    Lampa.Utils.trigger(animeBtn, 'hover:enter');
                }
            }
        }, 500);
    }

    if (window.appready) {
        startAnimeMadness();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                startAnimeMadness();
            }
        });
    }
})();
