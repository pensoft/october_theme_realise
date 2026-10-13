/**
 * accessibility.js
 *
 * Keyboard and screen-reader behaviour for the REALISE theme.
 * Loaded after app.js so it can wrap the globals that app.js defines.
 *
 * Covered checklist items:
 *   - skip link target focus
 *   - search overlay: focus in/out, Escape, aria-expanded
 *   - mobile menu: aria-expanded, Escape, focus containment while open
 *   - navbar dropdowns: role, aria-expanded, arrow keys, Enter, Escape
 *   - tabs: roving tabindex, arrow/Home/End keys, aria-selected, panel state
 *   - accordions and "read more" toggles: Enter/Space, aria-expanded
 *   - locale picker: listbox semantics and keyboard operation
 *   - forms: required announcement, error summary, focus after failed submit
 *   - dynamic updates: polite live-region announcements
 *   - auto-playing carousels: keyboard-reachable pause/play control
 */
(function () {
    'use strict';

    var FOCUSABLE = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    function toArray(list) {
        return Array.prototype.slice.call(list || []);
    }

    function isVisible(el) {
        return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
    }

    function focusables(root) {
        return toArray(root.querySelectorAll(FOCUSABLE)).filter(isVisible);
    }

    /* ------------------------------------------------------------------
     * :focus-visible fallback
     * ---------------------------------------------------------------- */
    try {
        document.querySelector(':focus-visible');
    } catch (e) {
        document.documentElement.classList.add('no-focus-visible');
    }

    /* ------------------------------------------------------------------
     * Live region used to announce filter/pagination/toast style updates.
     * ---------------------------------------------------------------- */
    function announcer() {
        var el = document.getElementById('a11y-announcer');

        if (!el) {
            el = document.createElement('div');
            el.id = 'a11y-announcer';
            el.className = 'sr-only';
            el.setAttribute('aria-live', 'polite');
            el.setAttribute('aria-atomic', 'true');
            document.body.appendChild(el);
        }

        return el;
    }

    function announce(message) {
        var el = announcer();

        // Re-setting the same string does not re-trigger the announcement.
        el.textContent = '';
        window.setTimeout(function () {
            el.textContent = message;
        }, 60);
    }

    window.a11yAnnounce = announce;

    /* ------------------------------------------------------------------
     * Skip link - make the landing region programmatically focusable.
     * ---------------------------------------------------------------- */
    function initSkipLink() {
        var link = document.querySelector('.skip-link');

        if (!link) {
            return;
        }

        link.addEventListener('click', function () {
            var target = document.querySelector(link.getAttribute('href'));

            if (!target) {
                return;
            }

            if (!target.hasAttribute('tabindex')) {
                target.setAttribute('tabindex', '-1');
            }

            target.focus();
        });
    }

    /* ------------------------------------------------------------------
     * Search overlay.
     * ---------------------------------------------------------------- */
    function initSearchOverlay() {
        var overlay = document.getElementById('search');

        if (!overlay) {
            return;
        }

        var triggers = toArray(document.querySelectorAll('.search-btn, .mobile-search-btn'));
        var input = overlay.querySelector('.search_input');
        var lastTrigger = null;

        function setExpanded(state) {
            triggers.forEach(function (trigger) {
                trigger.setAttribute('aria-expanded', state ? 'true' : 'false');
            });
        }

        var originalShow = window.showSearchForm;
        var originalHide = window.hideSearchForm;

        window.showSearchForm = function () {
            if (typeof originalShow === 'function') {
                originalShow.apply(this, arguments);
            }

            lastTrigger = document.activeElement;
            setExpanded(true);
            overlay.removeAttribute('aria-hidden');

            if (input) {
                input.focus();
            }
        };

        window.hideSearchForm = function () {
            if (typeof originalHide === 'function') {
                originalHide.apply(this, arguments);
            }

            setExpanded(false);

            if (lastTrigger && document.body.contains(lastTrigger)) {
                lastTrigger.focus();
            }

            lastTrigger = null;
        };

        // Escape closes, and Tab is kept inside the overlay while it is open -
        // it covers the page content behind it.
        overlay.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' || event.key === 'Esc') {
                event.preventDefault();
                window.hideSearchForm();
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            var items = focusables(overlay);

            if (!items.length) {
                return;
            }

            var first = items[0];
            var last = items[items.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });
    }

    /* ------------------------------------------------------------------
     * Mobile menu (the checkbox burger).
     * ---------------------------------------------------------------- */
    function initMobileMenu() {
        var toggle = document.getElementById('mobile-menu-toggle');

        if (!toggle) {
            return;
        }

        var panel = document.getElementById('menu') ||
            document.querySelector('#menuToggle .navbar-nav');

        function panelIsOpen() {
            return toggle.checked;
        }

        function sync() {
            toggle.setAttribute('aria-expanded', panelIsOpen() ? 'true' : 'false');
        }

        toggle.addEventListener('change', function () {
            sync();

            if (!panel) {
                return;
            }

            if (panelIsOpen()) {
                var items = focusables(panel);

                if (items.length) {
                    window.setTimeout(function () {
                        items[0].focus();
                    }, 420); // after the slide animation in app.js
                }
            }
        });

        document.addEventListener('keydown', function (event) {
            if (!panelIsOpen()) {
                return;
            }

            if (event.key === 'Escape' || event.key === 'Esc') {
                toggle.checked = false;
                toggle.dispatchEvent(new Event('change'));
                sync();
                toggle.focus();
                return;
            }

            if (event.key !== 'Tab' || !panel) {
                return;
            }

            var items = focusables(panel);

            if (!items.length) {
                return;
            }

            var first = items[0];
            var last = items[items.length - 1];

            // The burger itself stays reachable so the panel is never a trap.
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                toggle.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                toggle.focus();
            }
        });

        sync();
    }

    /* ------------------------------------------------------------------
     * Navbar dropdowns.
     *
     * The submenus are opened by CSS :hover only, which leaves them out of
     * reach for keyboard users. Give the parent link button-ish semantics
     * and wire up Enter / Space / arrows / Escape.
     * ---------------------------------------------------------------- */
    function initDropdowns() {
        toArray(document.querySelectorAll('.navbar li.dropdown')).forEach(function (item) {
            var trigger = item.querySelector(':scope > a');
            var menu = item.querySelector(':scope > ul');

            if (!trigger || !menu) {
                return;
            }

            trigger.setAttribute('aria-haspopup', 'true');
            trigger.setAttribute('aria-expanded', 'false');

            var links = toArray(menu.querySelectorAll('a'));

            function open() {
                item.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
            }

            function close() {
                item.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
            }

            function toggle() {
                if (item.classList.contains('is-open')) {
                    close();
                } else {
                    open();
                }
            }

            trigger.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
                    // The parent entry is also a real link, so only Space and
                    // ArrowDown open the submenu; Enter still follows the link.
                    if (event.key !== 'Enter') {
                        event.preventDefault();
                        toggle();

                        if (item.classList.contains('is-open') && links.length) {
                            links[0].focus();
                        }
                    }
                } else if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    open();

                    if (links.length) {
                        links[0].focus();
                    }
                } else if (event.key === 'Escape' || event.key === 'Esc') {
                    close();
                }
            });

            menu.addEventListener('keydown', function (event) {
                var index = links.indexOf(document.activeElement);

                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    links[Math.min(index + 1, links.length - 1)].focus();
                } else if (event.key === 'ArrowUp') {
                    event.preventDefault();

                    if (index <= 0) {
                        trigger.focus();
                    } else {
                        links[index - 1].focus();
                    }
                } else if (event.key === 'Escape' || event.key === 'Esc') {
                    event.preventDefault();
                    close();
                    trigger.focus();
                } else if (event.key === 'Home') {
                    event.preventDefault();
                    links[0].focus();
                } else if (event.key === 'End') {
                    event.preventDefault();
                    links[links.length - 1].focus();
                }
            });

            item.addEventListener('focusin', open);
            item.addEventListener('focusout', function (event) {
                if (!item.contains(event.relatedTarget)) {
                    close();
                }
            });
            item.addEventListener('mouseenter', open);
            item.addEventListener('mouseleave', function () {
                if (!item.contains(document.activeElement)) {
                    close();
                }
            });
        });
    }

    /* ------------------------------------------------------------------
     * Tab lists (events / partners list-vs-map switchers).
     * ---------------------------------------------------------------- */
    function initTabs() {
        toArray(document.querySelectorAll('[role="tablist"]')).forEach(function (list) {
            var tabs = toArray(list.querySelectorAll('[role="tab"]'));

            if (!tabs.length) {
                return;
            }

            function panelFor(tab) {
                var id = tab.getAttribute('aria-controls');
                return id ? document.getElementById(id) : null;
            }

            function select(tab, moveFocus) {
                tabs.forEach(function (item) {
                    var selected = item === tab;
                    var panel = panelFor(item);

                    item.setAttribute('aria-selected', selected ? 'true' : 'false');
                    item.setAttribute('tabindex', selected ? '0' : '-1');

                    if (panel) {
                        if (selected) {
                            panel.removeAttribute('aria-hidden');
                        } else {
                            panel.setAttribute('aria-hidden', 'true');
                        }
                    }
                });

                if (moveFocus) {
                    tab.focus();
                }

                announce((tab.textContent || '').trim() + ' selected');
            }

            tabs.forEach(function (tab, index) {
                var selected = tab.getAttribute('aria-selected') === 'true';
                tab.setAttribute('tabindex', selected ? '0' : '-1');

                tab.addEventListener('click', function () {
                    select(tab, false);
                });

                tab.addEventListener('keydown', function (event) {
                    var next = null;

                    switch (event.key) {
                        case 'ArrowRight':
                        case 'ArrowDown':
                            next = tabs[(index + 1) % tabs.length];
                            break;
                        case 'ArrowLeft':
                        case 'ArrowUp':
                            next = tabs[(index - 1 + tabs.length) % tabs.length];
                            break;
                        case 'Home':
                            next = tabs[0];
                            break;
                        case 'End':
                            next = tabs[tabs.length - 1];
                            break;
                        case ' ':
                        case 'Spacebar':
                            event.preventDefault();
                            tab.click();
                            return;
                        default:
                            return;
                    }

                    event.preventDefault();
                    next.click();
                    select(next, true);
                });
            });

            // Reflect the initially active tab on the panels.
            var active = tabs.filter(function (tab) {
                return tab.getAttribute('aria-selected') === 'true';
            })[0] || tabs[0];

            tabs.forEach(function (item) {
                var panel = panelFor(item);

                if (!panel) {
                    return;
                }

                if (item === active) {
                    panel.removeAttribute('aria-hidden');
                } else {
                    panel.setAttribute('aria-hidden', 'true');
                }
            });
        });
    }

    /* ------------------------------------------------------------------
     * Accordions.
     * ---------------------------------------------------------------- */
    function initAccordions() {
        // Only enhance rows that declare themselves as controls. A plain
        // .accordion-toggle with no handler behind it must NOT be given
        // role="button" - that would announce a control that does nothing.
        var selector = '.accordion-toggle[role="button"], .accordion-toggle[aria-controls]';

        toArray(document.querySelectorAll(selector)).forEach(function (toggle) {
            // Skip toggles that already contain their own control.
            if (toggle.querySelector('button, a[href]')) {
                return;
            }

            if (!toggle.hasAttribute('role')) {
                toggle.setAttribute('role', 'button');
            }

            if (!toggle.hasAttribute('tabindex')) {
                toggle.setAttribute('tabindex', '0');
            }

            var panel = toggle.querySelector('.accordion-content') ||
                toggle.parentNode.querySelector('.accordion-content');

            if (panel && !toggle.getAttribute('aria-controls')) {
                if (!panel.id) {
                    panel.id = 'accordion-panel-' + Math.random().toString(36).slice(2, 9);
                }

                toggle.setAttribute('aria-controls', panel.id);
            }

            if (!toggle.hasAttribute('aria-expanded')) {
                toggle.setAttribute('aria-expanded', panel && isVisible(panel) ? 'true' : 'false');
            }

            toggle.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
                    event.preventDefault();
                    toggle.click();
                }
            });

            toggle.addEventListener('click', function () {
                // app.js animates the panel; read the state once it settled.
                window.setTimeout(function () {
                    var expanded = panel ? isVisible(panel) : false;

                    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');

                    if (panel) {
                        if (expanded) {
                            panel.removeAttribute('aria-hidden');
                        } else {
                            panel.setAttribute('aria-hidden', 'true');
                        }
                    }
                }, 350);
            });
        });
    }

    /* ------------------------------------------------------------------
     * "Read more" / biography toggles.
     * ---------------------------------------------------------------- */
    function initDisclosures() {
        toArray(document.querySelectorAll('.read-more[aria-controls], .read_more[aria-controls]'))
            .forEach(function (toggle) {
                var panel = document.getElementById(toggle.getAttribute('aria-controls'));

                if (!toggle.hasAttribute('aria-expanded')) {
                    toggle.setAttribute('aria-expanded', 'false');
                }

                toggle.addEventListener('click', function () {
                    window.setTimeout(function () {
                        var expanded = panel ? isVisible(panel) : false;
                        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
                    }, 350);
                });
            });
    }

    /* ------------------------------------------------------------------
     * Locale picker.
     *
     * app.js replaces the native <select> with a div-based widget. Give it
     * listbox semantics and full keyboard operation.
     * ---------------------------------------------------------------- */
    function initLocalePicker() {
        toArray(document.querySelectorAll('.custom-select')).forEach(function (wrapper, wrapperIndex) {
            var trigger = wrapper.querySelector('.custom-select__trigger');
            var list = wrapper.querySelector('.custom-select__options');
            var nativeSelect = wrapper.querySelector('select');

            if (!trigger || !list) {
                return;
            }

            var listId = 'locale-options-' + wrapperIndex;
            list.id = listId;
            list.setAttribute('role', 'listbox');
            list.setAttribute('aria-label', 'Language');

            trigger.setAttribute('role', 'button');
            trigger.setAttribute('tabindex', '0');
            trigger.setAttribute('aria-haspopup', 'listbox');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.setAttribute('aria-controls', listId);

            if (!trigger.getAttribute('aria-label')) {
                trigger.setAttribute('aria-label', 'Change language');
            }

            // The native select is kept in the DOM by app.js; hide the
            // duplicate from assistive technology.
            if (nativeSelect) {
                nativeSelect.setAttribute('tabindex', '-1');
                nativeSelect.setAttribute('aria-hidden', 'true');
            }

            var options = toArray(list.querySelectorAll('.custom-select__option'));

            options.forEach(function (option) {
                option.setAttribute('role', 'option');
                option.setAttribute('tabindex', '-1');
                option.setAttribute(
                    'aria-selected',
                    option.classList.contains('is-selected') ? 'true' : 'false'
                );
            });

            function isOpen() {
                return wrapper.classList.contains('is-open');
            }

            function open(focusIndex) {
                wrapper.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');

                var target = options[focusIndex] || options[0];

                if (target) {
                    target.focus();
                }
            }

            function close(returnFocus) {
                wrapper.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');

                if (returnFocus) {
                    trigger.focus();
                }
            }

            trigger.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar' ||
                    event.key === 'ArrowDown') {
                    event.preventDefault();

                    var selectedIndex = options.map(function (option) {
                        return option.getAttribute('aria-selected') === 'true';
                    }).indexOf(true);

                    open(selectedIndex > -1 ? selectedIndex : 0);
                } else if (event.key === 'Escape' || event.key === 'Esc') {
                    close(false);
                }
            });

            list.addEventListener('keydown', function (event) {
                var index = options.indexOf(document.activeElement);

                switch (event.key) {
                    case 'ArrowDown':
                        event.preventDefault();
                        options[Math.min(index + 1, options.length - 1)].focus();
                        break;
                    case 'ArrowUp':
                        event.preventDefault();

                        if (index <= 0) {
                            close(true);
                        } else {
                            options[index - 1].focus();
                        }

                        break;
                    case 'Home':
                        event.preventDefault();
                        options[0].focus();
                        break;
                    case 'End':
                        event.preventDefault();
                        options[options.length - 1].focus();
                        break;
                    case 'Enter':
                    case ' ':
                    case 'Spacebar':
                        event.preventDefault();
                        document.activeElement.click();
                        break;
                    case 'Escape':
                    case 'Esc':
                        event.preventDefault();
                        close(true);
                        break;
                    case 'Tab':
                        close(false);
                        break;
                    default:
                        break;
                }
            });

            // Keep the exposed state in sync with the pointer interactions
            // that app.js already handles.
            wrapper.addEventListener('click', function () {
                trigger.setAttribute('aria-expanded', isOpen() ? 'true' : 'false');
            });
        });
    }

    /* ------------------------------------------------------------------
     * Forms.
     * ---------------------------------------------------------------- */
    var REQUIRED_FIELDS = {
        // Fields the server validates as required but that carry no
        // constraint in the markup.
        get_involved_form: ['first_name', 'email', 'affiliation', 'country', 'main_language', 'second_language']
    };

    function initForms() {
        // Mirror "* required" markers onto the field itself.
        toArray(document.querySelectorAll('label')).forEach(function (label) {
            if (!label.querySelector('.red, .field-required-marker, .text-danger')) {
                return;
            }

            var field = label.htmlFor ? document.getElementById(label.htmlFor) : null;

            if (field && !field.hasAttribute('required')) {
                field.setAttribute('aria-required', 'true');
            }
        });

        var involved = document.querySelector('.get_involved_form');

        if (involved) {
            REQUIRED_FIELDS.get_involved_form.forEach(function (id) {
                var field = document.getElementById(id);

                if (field) {
                    field.setAttribute('aria-required', 'true');
                }
            });
        }

        // Native validation: move focus to the first invalid control.
        toArray(document.querySelectorAll('form')).forEach(function (form) {
            form.addEventListener('invalid', function (event) {
                var field = event.target;

                field.setAttribute('aria-invalid', 'true');

                if (!form.dataset.a11yInvalidHandled) {
                    form.dataset.a11yInvalidHandled = '1';

                    window.setTimeout(function () {
                        delete form.dataset.a11yInvalidHandled;
                    }, 0);

                    field.focus();
                    announce('The form could not be submitted. Please review the highlighted fields.');
                }
            }, true);

            form.addEventListener('input', function (event) {
                if (event.target.getAttribute('aria-invalid') === 'true' &&
                    (!event.target.checkValidity || event.target.checkValidity())) {
                    event.target.removeAttribute('aria-invalid');
                }
            });
        });

        // October AJAX framework: announce the error and focus the summary.
        if (window.jQuery) {
            window.jQuery(document).on('ajaxError', 'form', function (event, context, message) {
                var form = this;
                var summary = form.querySelector('#error_messages, .form-error-summary');

                if (summary) {
                    summary.setAttribute('role', 'alert');
                    summary.setAttribute('tabindex', '-1');
                    summary.classList.add('is-visible');

                    if (!summary.textContent.trim() && message) {
                        summary.textContent = message;
                    }

                    summary.focus();
                } else {
                    var firstField = form.querySelector(FOCUSABLE);

                    if (firstField) {
                        firstField.focus();
                    }
                }

                announce(message || 'The form could not be submitted. Please review the highlighted fields.');
            });

            window.jQuery(document).on('ajaxSuccess', 'form', function () {
                var summary = this.querySelector('#error_messages, .form-error-summary');

                if (summary) {
                    summary.classList.remove('is-visible');
                }
            });
        }

        // The server-side handler flags fields by id via scrollToField(); make
        // sure the first one also receives focus.
        var originalScrollToField = window.scrollToField;

        if (typeof originalScrollToField === 'function') {
            window.scrollToField = function (errors) {
                originalScrollToField.apply(this, arguments);

                if (!errors || !errors.scroll_to_field) {
                    return;
                }

                var keys = Object.keys(errors.scroll_to_field);

                if (!keys.length) {
                    return;
                }

                var field = document.getElementById(keys[0]);

                if (field) {
                    field.setAttribute('aria-invalid', 'true');
                    field.focus();
                }

                announce('The form could not be submitted. Please review the highlighted fields.');
            };
        }
    }

    /* ------------------------------------------------------------------
     * Auto-playing carousels get a pause/play control.
     * ---------------------------------------------------------------- */
    function initCarouselControls() {
        if (!window.jQuery || !window.jQuery.fn || !window.jQuery.fn.slick) {
            return;
        }

        window.jQuery('.slick-slider').each(function () {
            var $slider = window.jQuery(this);
            var settings = $slider.slick('getSlick').options;

            if (!settings || !settings.autoplay) {
                return;
            }

            if ($slider.prev('.carousel-playback-toggle').length) {
                return;
            }

            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'carousel-playback-toggle';
            button.textContent = 'Pause automatic slideshow';
            button.setAttribute('aria-pressed', 'false');

            button.addEventListener('click', function () {
                var paused = button.getAttribute('aria-pressed') === 'true';

                if (paused) {
                    $slider.slick('slickPlay');
                    button.setAttribute('aria-pressed', 'false');
                    button.textContent = 'Pause automatic slideshow';
                    announce('Slideshow resumed');
                } else {
                    $slider.slick('slickPause');
                    button.setAttribute('aria-pressed', 'true');
                    button.textContent = 'Play automatic slideshow';
                    announce('Slideshow paused');
                }
            });

            this.parentNode.insertBefore(button, this);
        });
    }

    /* ------------------------------------------------------------------
     * Announce list updates driven by October's AJAX partial updates.
     * ---------------------------------------------------------------- */
    function initDynamicAnnouncements() {
        if (!window.jQuery) {
            return;
        }

        window.jQuery(document).on('ajaxUpdateComplete', function (event, context, data, status, jqXHR) {
            var updated = Object.keys(data || {});

            if (!updated.length) {
                return;
            }

            var region = document.querySelector('.news-list, .blog-list, .library-items, .events_list_container');
            var count = region ? region.querySelectorAll('article, .library-item, .entry_item').length : 0;

            announce(count ? count + ' results loaded' : 'Content updated');
        });
    }

    /* ------------------------------------------------------------------
     * Session timeout warning.
     *
     * Shown a couple of minutes before the server-side session lifetime runs
     * out. It is a real alertdialog: focus enters it, Tab stays inside,
     * Escape dismisses it and focus goes back where it came from.
     * ---------------------------------------------------------------- */
    function initSessionTimeout() {
        var dialog = document.getElementById('session-timeout-warning');

        if (!dialog) {
            return;
        }

        var lifetime = parseInt(dialog.getAttribute('data-lifetime'), 10) || 0;
        var warnBefore = parseInt(dialog.getAttribute('data-warn-before'), 10) || 120;
        var loginUrl = dialog.getAttribute('data-login-url') || '/login';
        var countdownEl = document.getElementById('session-timeout-countdown');
        var extendBtn = dialog.querySelector('[data-session-timeout-extend]');
        var panel = dialog.querySelector('.session-timeout__dialog');

        if (lifetime <= warnBefore) {
            return;
        }

        var warnTimer = null;
        var tickTimer = null;
        var remaining = warnBefore;
        var lastFocused = null;

        function format(seconds) {
            var minutes = Math.floor(seconds / 60);
            var rest = seconds % 60;
            return minutes + ':' + (rest < 10 ? '0' : '') + rest;
        }

        function hide() {
            dialog.hidden = true;
            window.clearInterval(tickTimer);

            if (lastFocused && document.body.contains(lastFocused)) {
                lastFocused.focus();
            }

            lastFocused = null;
        }

        function show() {
            lastFocused = document.activeElement;
            remaining = warnBefore;

            if (countdownEl) {
                countdownEl.textContent = format(remaining);
            }

            dialog.hidden = false;

            if (extendBtn) {
                extendBtn.focus();
            }

            tickTimer = window.setInterval(function () {
                remaining -= 1;

                if (countdownEl) {
                    countdownEl.textContent = format(Math.max(remaining, 0));
                }

                if (remaining <= 0) {
                    window.clearInterval(tickTimer);
                    window.location.assign(loginUrl);
                }
            }, 1000);
        }

        function schedule() {
            window.clearTimeout(warnTimer);
            warnTimer = window.setTimeout(show, (lifetime - warnBefore) * 1000);
        }

        function extend() {
            // Any request to the app refreshes the server-side session.
            var request = new XMLHttpRequest();
            request.open('GET', window.location.href, true);
            request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            request.send();

            hide();
            schedule();
            announce('Your session has been extended.');
        }

        if (extendBtn) {
            extendBtn.addEventListener('click', extend);
        }

        dialog.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' || event.key === 'Esc') {
                event.preventDefault();
                extend();
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            var items = focusables(panel || dialog);

            if (!items.length) {
                return;
            }

            var first = items[0];
            var last = items[items.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });

        schedule();
    }

    function init() {
        initSkipLink();
        initSearchOverlay();
        initMobileMenu();
        initDropdowns();
        initTabs();
        initAccordions();
        initDisclosures();
        initLocalePicker();
        initForms();
        initSessionTimeout();
        initDynamicAnnouncements();
        window.setTimeout(initCarouselControls, 800);
    }

    // app.js builds the locale picker and rebinds the menu inside jQuery's
    // ready queue, so run after it rather than on raw DOMContentLoaded.
    if (window.jQuery) {
        window.jQuery(function () {
            init();
        });
    } else if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
