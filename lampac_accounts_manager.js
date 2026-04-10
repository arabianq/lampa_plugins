(function () {
    'use strict';

    function getAccounts() {
        let accs = Lampa.Storage.get('lampac_saved_accounts', '[]');
        try {
            accs = JSON.parse(accs);
        } catch (e) {
            accs = [];
        }
        return Array.isArray(accs) ? accs : [];
    }

    function saveAccounts(accs) {
        Lampa.Storage.set('lampac_saved_accounts', JSON.stringify(accs));
    }

    function addAccount(id, name) {
        let accs = getAccounts();
        if (!accs.find(a => a.id === id)) {
            accs.push({ id: id, name: name || ('Аккаунт ' + id.substring(0, 4)) });
            saveAccounts(accs);
        }
    }

    function deleteAccount(id) {
        let accs = getAccounts();
        accs = accs.filter(a => a.id !== id);
        saveAccounts(accs);
    }

    function backupCurrentAccount() {
        let current_id = Lampa.Storage.get('lampac_unic_id', '');
        if (current_id) {
            addAccount(current_id, 'Основной (' + current_id.substring(0, 4) + ')');
        }
    }

    function initAccountSwitcher() {
        backupCurrentAccount();

        let btn_html = `
        <div class="head__action selector account--switcher">
            <svg width="48" height="49" viewBox="0 0 48 49" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24.1445" cy="24.2546" r="23.8115" fill="currentColor" fill-opacity="0.2"></circle>
                <path d="M24.1464 9.39355C19.9003 9.39355 16.4294 12.8645 16.4294 17.1106C16.4294 21.3567 19.9003 24.8277 24.1464 24.8277C28.3925 24.8277 31.8635 21.3567 31.8635 17.1106C31.8635 12.8645 28.3925 9.39355 24.1464 9.39355ZM37.3901 30.9946C37.1879 30.4891 36.9184 30.0173 36.6151 29.5792C35.0649 27.2877 32.6723 25.7712 29.9764 25.4005C29.6395 25.3669 29.2688 25.4342 28.9991 25.6364C27.5838 26.6811 25.8989 27.2203 24.1465 27.2203C22.3941 27.2203 20.7092 26.6811 19.2938 25.6364C19.0242 25.4342 18.6535 25.3331 18.3165 25.4005C15.6206 25.7712 13.1943 27.2877 11.6779 29.5792C11.3746 30.0173 11.105 30.5228 10.9028 30.9946C10.8018 31.1968 10.8354 31.4327 10.9365 31.6349C11.2061 32.1067 11.5431 32.5785 11.8464 32.9828C12.3181 33.6232 12.8236 34.196 13.3965 34.7352C13.8683 35.2069 14.4075 35.645 14.9467 36.0831C17.6089 38.0714 20.8103 39.116 24.1128 39.116C27.4153 39.116 30.6167 38.0713 33.2789 36.0831C33.8181 35.6788 34.3573 35.2069 34.8291 34.7352C35.3683 34.196 35.9074 33.6231 36.3793 32.9828C36.7162 32.5447 37.0196 32.1067 37.2891 31.6349C37.4575 31.4327 37.4912 31.1967 37.3901 30.9946Z" fill="currentColor"></path>
            </svg>
        </div>
        `;

        $('.head__actions').append(btn_html);

        $('.account--switcher').on('hover:enter click', function () {
            showMainMenu();
        });
    }

    function showMainMenu() {
        let accs = getAccounts();
        let current_id = Lampa.Storage.get('lampac_unic_id', '');
        let items = [];

        accs.forEach(acc => {
            let isActive = (acc.id === current_id);
            items.push({
                title: isActive ? `✅ ${acc.name}` : `👤 ${acc.name}`,
                subtitle: isActive ? 'Текущий активный аккаунт' : `ID: ${acc.id}`,
                action: 'switch',
                id: acc.id
            });
        });

        items.push({
            title: '➕ Добавить аккаунт',
            subtitle: 'Ввести новый ID для входа',
            action: 'add'
        });

        if (accs.length > 0) {
            items.push({
                title: '🗑 Управление аккаунтами',
                subtitle: 'Удалить сохраненные записи',
                action: 'delete_menu'
            });
        }

        items.push({
            title: '🚪 Выйти',
            subtitle: 'Сбросить текущую авторизацию',
            action: 'logout'
        });

        Lampa.Select.show({
            title: 'Менеджер аккаунтов',
            items: items,
            onSelect: function (a) {
                if (a.action === 'switch') {
                    if (a.id === Lampa.Storage.get('lampac_unic_id')) {
                        Lampa.Noty.show('Этот аккаунт уже активен');
                        return;
                    }
                    switchToAccount(a.id);
                } else if (a.action === 'add') {
                    promptNewAccount();
                } else if (a.action === 'delete_menu') {
                    showDeleteMenu();
                } else if (a.action === 'logout') {
                    clearCurrentSession();
                }
            },
            onBack: function () {
                Lampa.Controller.toggle('head');
            }
        });
    }

    function showDeleteMenu() {
        let accs = getAccounts();
        let items = accs.map(acc => ({
            title: '❌ Удалить: ' + acc.name,
            subtitle: 'Нажми, чтобы удалить',
            action: 'delete',
            id: acc.id
        }));

        Lampa.Select.show({
            title: 'Кого пускаем в расход?',
            items: items,
            onSelect: function (a) {
                deleteAccount(a.id);
                Lampa.Noty.show('Аккаунт удален');
                setTimeout(showMainMenu, 200);
            },
            onBack: function () {
                showMainMenu();
            }
        });
    }

    function promptNewAccount() {
        Lampa.Input.edit({
            free: true,
            title: 'Введи новый пароль (unic_id)',
            nosave: true,
            value: '',
            nomic: true
        }, function (new_value) {
            if (new_value) {
                Lampa.Input.edit({
                    free: true,
                    title: 'Как назовем аккаунт? (можно пропустить)',
                    nosave: true,
                    value: 'Аккаунт ' + new_value.substring(0, 4),
                    nomic: true
                }, function (new_name) {
                    addAccount(new_value, new_name || new_value);
                    switchToAccount(new_value);
                });
            } else {
                showMainMenu();
            }
        });
    }

    function switchToAccount(id) {
        Lampa.Storage.set('lampac_unic_id', id);
        Lampa.Storage.set('account_email', '');
        Lampa.Storage.set('account', '');
        Lampa.Noty.show('Переключаем аккаунт. Ребут...');
        setTimeout(() => window.location.reload(), 1000);
    }

    function clearCurrentSession() {
        Lampa.Storage.set('lampac_unic_id', '');
        Lampa.Storage.set('account_email', '');
        Lampa.Storage.set('account', '');
        Lampa.Noty.show('Сессия сброшена. Ребут...');
        setTimeout(() => window.location.reload(), 1000);
    }

    if (window.appready) {
        initAccountSwitcher();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                setTimeout(initAccountSwitcher, 200);
            }
        });
    }
})();
