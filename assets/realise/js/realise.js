/*
 * REALISE theme behaviour. Plain JS, no dependencies (topojson-client is only
 * loaded on the homepage, for the globe). Every block is keyed on a data-rl-*
 * hook, so a page that does not carry the markup costs nothing.
 */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

    /* ---------------------------------------------------------- header */
    function initHeader() {
        var header = document.querySelector('[data-rl-header]');
        if (!header) return;
        var burger = header.querySelector('[data-rl-burger]');
        var items = $$('[data-rl-dropdown]', header);

        function closeAll(except) {
            items.forEach(function (item) {
                if (item === except) return;
                item.classList.remove('is-open');
                var btn = item.querySelector('[aria-expanded]');
                if (btn) btn.setAttribute('aria-expanded', 'false');
            });
        }

        items.forEach(function (item) {
            var btn = item.querySelector('[aria-expanded]');
            var toggle = function () {
                var open = !item.classList.contains('is-open');
                closeAll(item);
                item.classList.toggle('is-open', open);
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            };
            btn.addEventListener('click', toggle);
            // Keyboard: ArrowDown on the parent opens the submenu and moves
            // into it; ArrowUp/Down, Home/End move between its links; Escape
            // (handled below) closes it and returns focus to the parent.
            var subLinks = function () { return $$('.rl-nav__sub a', item); };
            var openAndFocus = function (last) {
                if (!item.classList.contains('is-open')) toggle();
                var links = subLinks();
                if (links.length) links[last ? links.length - 1 : 0].focus();
            };
            $$('.rl-nav__link, .rl-nav__toggle', item).forEach(function (el) {
                el.addEventListener('keydown', function (e) {
                    if (e.key === 'ArrowDown') { e.preventDefault(); openAndFocus(false); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); openAndFocus(true); }
                });
            });
            item.addEventListener('keydown', function (e) {
                // Only keys pressed on a submenu link (the parent's own
                // ArrowDown is handled above and must not move twice).
                var links = subLinks(), i = links.indexOf(e.target);
                if (i < 0) return;
                var to = null;
                if (e.key === 'ArrowDown') to = links[(i + 1) % links.length];
                else if (e.key === 'ArrowUp') to = links[(i - 1 + links.length) % links.length];
                else if (e.key === 'Home') to = links[0];
                else if (e.key === 'End') to = links[links.length - 1];
                if (to) { e.preventDefault(); to.focus(); }
            });
            // Leaving the item with Tab closes its submenu.
            item.addEventListener('focusout', function (e) {
                if (!item.contains(e.relatedTarget) && item.classList.contains('is-open') && !burgerVisible()) {
                    item.classList.remove('is-open');
                    btn.setAttribute('aria-expanded', 'false');
                }
            });
            // Mobile menu: the parent's label (a link) opens/closes its
            // submenu like the arrow does, instead of navigating. Its page
            // stays reachable as the first submenu item (About REALISE, News).
            // On desktop it is a normal link; the dropdown opens on hover.
            var link = item.querySelector('a.rl-nav__link');
            if (link && link !== btn) {
                link.addEventListener('click', function (e) {
                    if (!burgerVisible()) return;
                    e.preventDefault();
                    toggle();
                });
            }
            // Desktop hover is CSS; keep aria-expanded honest for it too.
            item.addEventListener('mouseenter', function () { if (!burgerVisible()) btn.setAttribute('aria-expanded', 'true'); });
            item.addEventListener('mouseleave', function () {
                if (!burgerVisible() && !item.classList.contains('is-open')) btn.setAttribute('aria-expanded', 'false');
            });
        });

        function burgerVisible() { return burger && burger.offsetParent !== null; }

        if (burger) {
            burger.addEventListener('click', function () {
                var open = !header.classList.contains('is-menu-open');
                header.classList.toggle('is-menu-open', open);
                burger.setAttribute('aria-expanded', open ? 'true' : 'false');
                burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            });
        }

        document.addEventListener('click', function (e) {
            if (!header.contains(e.target)) closeAll();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            var open = items.filter(function (i) { return i.classList.contains('is-open'); })[0];
            closeAll();
            if (open) open.querySelector('[aria-expanded]').focus();
            if (header.classList.contains('is-menu-open') && burger) {
                header.classList.remove('is-menu-open');
                burger.setAttribute('aria-expanded', 'false');
                burger.focus();
            }
        });

        // Header height feeds the sticky offsets (tabs bars, scroll padding).
        var setH = function () { document.documentElement.style.setProperty('--rl-header-h', header.offsetHeight + 'px'); };
        setH();
        window.addEventListener('resize', setH);
    }

    /* ------------------------------------------------------- fade in */
    function initFade() {
        var els = $$('[data-fade]');
        if (!els.length) return;
        if (reduceMotion || !('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('is-in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (x) {
                if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); }
            });
        }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
        els.forEach(function (el) { io.observe(el); });
    }

    /* --------------------------------------------------------- video */
    function initVideo() {
        $$('video[data-rl-video]').forEach(function (v) {
            v.muted = true;
            if (motionPaused()) { v.removeAttribute('autoplay'); v.pause(); return; }
            var p = v.play && v.play();
            if (p && p.catch) p.catch(function () {});
        });
    }

    /* ---------------------------------------- pause motion (WCAG 2.2.2) */
    /* One site-wide state for moving content: background videos, the
       partner ticker (CSS animation) and the globe's drift. Toggled by any
       [data-rl-motion] button, remembered in localStorage, and paused by
       default when the visitor asks for reduced motion. */
    var MOTION_KEY = 'rl-motion';
    var motionPaused = function () { return document.documentElement.classList.contains('rl-motion-paused'); };
    function setMotion(paused, remember) {
        document.documentElement.classList.toggle('rl-motion-paused', paused);
        $$('video[data-rl-video]').forEach(function (v) {
            if (paused) { v.pause(); }
            else { var p = v.play && v.play(); if (p && p.catch) p.catch(function () {}); }
        });
        $$('[data-rl-motion]').forEach(function (b) {
            b.setAttribute('aria-pressed', paused ? 'true' : 'false');
            b.setAttribute('aria-label', paused ? 'Play animations' : 'Pause animations');
            b.setAttribute('title', paused ? 'Play animations' : 'Pause animations');
        });
        if (remember) { try { localStorage.setItem(MOTION_KEY, paused ? 'paused' : 'playing'); } catch (e) {} }
    }
    function initMotion() {
        var saved = null;
        try { saved = localStorage.getItem(MOTION_KEY); } catch (e) {}
        // A remembered choice only counts while the pause buttons are shown
        // (partials/realise/motion-toggle.htm); without them a visitor could
        // not undo an earlier "pause", so only "reduce motion" applies.
        if (!$$('[data-rl-motion]').length) saved = null;
        setMotion(saved ? saved === 'paused' : reduceMotion, false);
        $$('[data-rl-motion]').forEach(function (b) {
            b.addEventListener('click', function () { setMotion(!motionPaused(), true); });
        });
    }

    /* ------------------------------------------------------ carousel */
    function initCarousels() {
        $$('[data-rl-carousel]').forEach(function (track) {
            var id = track.id;
            var step = function (d) {
                var card = track.firstElementChild;
                track.scrollBy({ left: d * (card ? card.offsetWidth : 400), behavior: reduceMotion ? 'auto' : 'smooth' });
            };
            $$('[data-rl-prev="' + id + '"]').forEach(function (b) { b.addEventListener('click', function () { step(-1); }); });
            $$('[data-rl-next="' + id + '"]').forEach(function (b) { b.addEventListener('click', function () { step(1); }); });
        });
    }

    /* ------------------------------------------- toggles (work packages) */
    /* The panel slides open/closed by animating its height (and fades in).
       While closed it keeps the `hidden` attribute, so collapsed text stays
       out of the tab order and the accessibility tree. Clicking again
       mid-animation reverses from the current height. */
    function initToggles() {
        var DURATION = 380;
        // Ease-in-out, close to the site's cubic-bezier(.338,.015,.395,.959).
        var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

        function reset(panel) {
            panel.style.height = panel.style.marginTop = panel.style.opacity = panel.style.overflow = '';
        }

        function animate(panel, open) {
            if (panel._rlRaf) cancelAnimationFrame(panel._rlRaf);
            if (reduceMotion) {
                reset(panel);
                panel.hidden = !open;
                return;
            }
            // The card is a flex column with a gap; collapsing the gap too
            // (negative top margin) keeps the space below from jumping.
            var gap = parseFloat(getComputedStyle(panel.parentNode).rowGap) || 0;
            // Start from wherever the panel is now, so a click mid-animation
            // reverses smoothly instead of jumping to an end state.
            var cs = getComputedStyle(panel);
            var fromH = panel.hidden ? 0 : panel.getBoundingClientRect().height;
            var fromM = panel.hidden ? -gap : (parseFloat(cs.marginTop) || 0);
            var fromO = panel.hidden ? 0 : parseFloat(cs.opacity);
            panel.hidden = false;
            panel.style.overflow = 'hidden';
            panel.style.height = 'auto';
            var toH = open ? panel.scrollHeight : 0;
            var toM = open ? 0 : -gap, toO = open ? 1 : 0;
            var start = null;

            var frame = function (now) {
                if (start === null) start = now;
                var t = Math.min(1, (now - start) / DURATION), k = ease(t);
                panel.style.height = (fromH + (toH - fromH) * k) + 'px';
                panel.style.marginTop = (fromM + (toM - fromM) * k) + 'px';
                panel.style.opacity = fromO + (toO - fromO) * k;
                if (t < 1) {
                    panel._rlRaf = requestAnimationFrame(frame);
                    return;
                }
                panel._rlRaf = null;
                reset(panel);
                if (!open) panel.hidden = true;
            };
            // Paint the start state first, then tween.
            panel.style.height = fromH + 'px';
            panel.style.marginTop = fromM + 'px';
            panel.style.opacity = fromO;
            panel._rlRaf = requestAnimationFrame(frame);
        }

        $$('[data-rl-toggle]').forEach(function (btn) {
            var panel = document.getElementById(btn.getAttribute('aria-controls'));
            var label = btn.querySelector('[data-rl-toggle-label]');
            if (!panel) return;
            btn.addEventListener('click', function () {
                var open = btn.getAttribute('aria-expanded') !== 'true';
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
                if (label) label.textContent = open ? 'Show less' : 'Read more';
                animate(panel, open);
            });
        });
    }

    /* -------------------------------------------------------- dialogs */
    function initDialogs() {
        $$('[data-rl-dialog]').forEach(function (trigger) {
            var dlg = document.getElementById(trigger.getAttribute('data-rl-dialog'));
            if (!dlg || typeof dlg.showModal !== 'function') return;
            trigger.addEventListener('click', function () {
                // Native showModal(): focus moves in and is kept inside;
                // Escape closes. On close, focus goes back to this trigger.
                dlg._rlTrigger = trigger;
                dlg.showModal();
                // The address shows the open drawer (/partners#rl-partner-p6),
                // so it can be copied and shared. replaceState: no extra
                // history entry per click, and no jump to the anchor.
                setHash('#' + dlg.id);
            });
        });
        $$('dialog.rl-drawer').forEach(function (dlg) {
            $$('[data-rl-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
            // A click on the ::backdrop lands on the dialog element itself.
            dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
            dlg.addEventListener('close', function () {
                if (location.hash === '#' + dlg.id) setHash('');
                if (dlg._rlTrigger && document.contains(dlg._rlTrigger)) dlg._rlTrigger.focus();
            });
        });
        function setHash(hash) {
            if (!window.history || !history.replaceState) return;
            try { history.replaceState(history.state, '', location.pathname + location.search + hash); } catch (e) {}
        }
        // A link to /partners#rl-partner-p12 (e.g. a search result) opens
        // that partner's details.
        var id = decodeURIComponent(location.hash.slice(1));
        var opener = id && document.querySelector('[data-rl-dialog="' + id.replace(/"/g, '') + '"]');
        if (opener) {
            opener.scrollIntoView({ block: 'center' });
            opener.click();
        }
    }

    /* ---------------------------------------------- header search popup */
    function initSearch() {
        var dlg = document.getElementById('rl-search');
        var openers = $$('[data-rl-search-open]');
        if (!dlg || !openers.length || typeof dlg.showModal !== 'function') return;
        var form = dlg.querySelector('form');
        var input = dlg.querySelector('input[name="q"]');
        var list = dlg.querySelector('[data-rl-search-results]');
        var status = dlg.querySelector('[data-rl-search-status]');
        var more = dlg.querySelector('[data-rl-search-all]');
        var endpoint = form.getAttribute('action');
        var timer, ctrl, trigger, lastQuery = null;
        var DURATION = reduceMotion ? 0 : 260;

        function open(e) {
            if (e) e.preventDefault();
            if (dlg.open) return;
            trigger = (e && e.currentTarget && e.currentTarget.nodeType === 1) ? e.currentTarget : document.activeElement;
            var header = document.querySelector('[data-rl-header]');
            if (header && header.classList.contains('is-menu-open')) {
                var burger = header.querySelector('[data-rl-burger]');
                if (burger) burger.click();
            }
            dlg.showModal();
            document.documentElement.classList.add('rl-search-lock');
            // Next frame: start the fade/slide-in from the closed state.
            requestAnimationFrame(function () { requestAnimationFrame(function () { dlg.classList.add('is-open'); }); });
            input.focus();
            input.select();
            openers.forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
        }

        function close() {
            if (!dlg.open || dlg.classList.contains('is-closing')) return;
            dlg.classList.remove('is-open');
            dlg.classList.add('is-closing');
            setTimeout(function () {
                dlg.classList.remove('is-closing');
                dlg.close();
                document.documentElement.classList.remove('rl-search-lock');
                openers.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
                if (trigger && document.contains(trigger)) trigger.focus();
            }, DURATION);
        }

        function render(data) {
            list.innerHTML = '';
            if (!data) { status.textContent = ''; more.hidden = true; return; }
            data.items.forEach(function (item) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                a.className = 'rl-search__hit';
                a.href = item.url;
                if (item.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
                var type = document.createElement('span');
                type.className = 'rl-search__hit-type';
                type.textContent = item.type + (item.date ? ' · ' + item.date : '');
                var title = document.createElement('span');
                title.className = 'rl-search__hit-title';
                title.innerHTML = item.title; // escaped by the server, <mark> only
                a.appendChild(type);
                a.appendChild(title);
                if (item.external) {
                    var hint = document.createElement('span');
                    hint.className = 'sr-only';
                    hint.textContent = ' (opens in a new tab)';
                    a.appendChild(hint);
                }
                li.appendChild(a);
                list.appendChild(li);
            });
            status.textContent = data.total
                ? data.total + (data.total === 1 ? ' result' : ' results') + (data.total > data.items.length ? ', showing the top ' + data.items.length : '')
                : 'No results for "' + data.query + '"';
            more.hidden = !data.total;
            more.href = data.all;
            more.querySelector('[data-rl-search-count]').textContent = data.total;
        }

        function lookup() {
            var q = input.value.trim();
            if (q === lastQuery) return;
            lastQuery = q;
            if (ctrl) ctrl.abort();
            if (q.length < 2) { render(null); dlg.classList.remove('has-results'); return; }
            ctrl = window.AbortController ? new AbortController() : null;
            dlg.classList.add('is-loading');
            fetch(endpoint + '?format=json&q=' + encodeURIComponent(q), { signal: ctrl ? ctrl.signal : undefined, headers: { Accept: 'application/json' } })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    dlg.classList.remove('is-loading');
                    dlg.classList.add('has-results');
                    render(data);
                })
                .catch(function (err) { if (err.name !== 'AbortError') dlg.classList.remove('is-loading'); });
        }

        openers.forEach(function (b) {
            b.addEventListener('click', open);
            // The opener is a link (plain link to /search without JS) with
            // role="button": Space activates it like a button.
            b.addEventListener('keydown', function (e) { if (e.key === ' ') open(e); });
        });
        $$('[data-rl-search-close]', dlg).forEach(function (b) { b.addEventListener('click', close); });
        dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
        dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
        input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(lookup, 220); });
        form.addEventListener('submit', function (e) { if (!input.value.trim()) { e.preventDefault(); input.focus(); } });

        // Arrow keys: from the field into the result links and back.
        dlg.addEventListener('keydown', function (e) {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            var links = $$('a.rl-search__hit', list);
            if (!links.length) return;
            var i = links.indexOf(document.activeElement);
            if (document.activeElement === input && e.key === 'ArrowDown') i = 0;
            else if (i === -1) return;
            else i += e.key === 'ArrowDown' ? 1 : -1;
            e.preventDefault();
            if (i < 0) input.focus();
            else links[Math.min(i, links.length - 1)].focus();
        });
    }

    /* --------------------------------------- select that navigates */
    function initNavSelects() {
        $$('select[data-rl-nav]').forEach(function (sel) {
            sel.addEventListener('change', function () { if (sel.value) window.location.href = sel.value; });
        });
    }

    /* --------------------------------------------- media scroll-spy */
    function initSpy() {
        var tabs = $$('[data-rl-spy]');
        if (!tabs.length) return;
        var targets = tabs.map(function (t) { return document.getElementById(t.getAttribute('href').slice(1)); });
        var onScroll = function () {
            var cur = 0;
            targets.forEach(function (el, i) { if (el && el.getBoundingClientRect().top < 200) cur = i; });
            tabs.forEach(function (t, i) {
                t.classList.toggle('is-active', i === cur);
                if (i === cur) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------------------------------------------------------- globe */
    /* Port of the design's dotted, draggable globe: land from Natural Earth
       110m (assets/realise/js/land-110m.json) rasterised once into a dot
       field, then projected orthographically each frame with a pin per
       partner country. Selecting a country (list or pin) eases the globe
       to it and shows the tooltip. */
    function initGlobe() {
        var cv = document.querySelector('[data-rl-globe]');
        var dataEl = document.getElementById('rl-countries');
        if (!cv || !dataEl) return;
        // Every country is listed; only those with coordinates get a pin.
        var ALL = JSON.parse(dataEl.textContent);
        var COUNTRIES = ALL.filter(function (c) { return typeof c.lat === 'number' && typeof c.lon === 'number'; });
        var tip = document.querySelector('[data-rl-tip]');
        var rows = $$('[data-rl-country]');
        var R2D = Math.PI / 180;
        var state = { sel: null, hover: null };
        var sway = 0, dLon = 0, dLat = 0, dots = null, last = performance.now();
        var dragging = false, moved = 0, px = 0, py = 0, pins = [], visible = true;

        function setSel(id) {
            state.sel = id;
            rows.forEach(function (r) { r.setAttribute('aria-pressed', r.getAttribute('data-rl-country') === id ? 'true' : 'false'); });
            renderTip();
        }

        function renderTip() {
            if (!tip) return;
            var c = COUNTRIES.filter(function (x) { return x.id === (state.hover || state.sel); })[0];
            if (!c) { setTipLive(false); return; }
            var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
            tip.innerHTML =
                '<div class="rl-globe__tip-head"><span>' + (c.flag ? '<img src="' + esc(c.flag) + '" alt="">' : '') + '<span class="rl-globe__tip-name">' + esc(c.name) + '</span></span>' +
                '<span class="rl-globe__tip-code">' + esc(c.code) + '</span></div>' +
                c.orgs.map(function (o) {
                    var inner = '<b>' + esc(o.name) + '</b><span>' + esc(o.short + (o.role ? ' — ' + o.role : '')) + '</span>';
                    // Each organisation opens its details on the Partners page.
                    return o.url
                        ? '<a class="rl-globe__tip-org" href="' + esc(o.url) + '">' + inner + '<span class="sr-only">: partner details</span></a>'
                        : '<div class="rl-globe__tip-org">' + inner + '</div>';
                }).join('');
            tipLive = null; // re-apply focusability to the new links
            setTipLive(!!(state.hover || state.sel));
        }

        // The tip's links are usable (pointer + keyboard + screen readers)
        // only while it is shown.
        var tipLive = null;
        function setTipLive(on) {
            if (!tip || tipLive === on) return;
            tipLive = on;
            tip.classList.toggle('is-live', on);
            tip.setAttribute('aria-hidden', on ? 'false' : 'true');
            $$('a', tip).forEach(function (a) { if (on) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); });
        }

        // Moving from a pin up to its tip crosses empty globe: keep the hovered
        // country briefly, and for as long as the pointer is over the tip.
        var hoverTimer = null, overTip = false;
        function setHover(id) {
            clearTimeout(hoverTimer);
            if (id || overTip) {
                if (id && id !== state.hover) { state.hover = id; renderTip(); }
                return;
            }
            if (!state.hover) return;
            hoverTimer = setTimeout(function () {
                if (overTip) return;
                state.hover = null;
                renderTip();
            }, 300);
        }
        if (tip) {
            tip.addEventListener('pointerenter', function () { overTip = true; clearTimeout(hoverTimer); });
            tip.addEventListener('pointerleave', function () { overTip = false; setHover(null); });
        }

        rows.forEach(function (r) {
            r.addEventListener('click', function () {
                var id = r.getAttribute('data-rl-country');
                setSel(state.sel === id ? null : id);
            });
        });

        function loadLand(tries) {
            var url = cv.getAttribute('data-land');
            if (!url || !window.fetch) { dots = []; return; }
            // topojson-client is a deferred script further down the page.
            if (!window.topojson) {
                if ((tries || 0) < 100) setTimeout(function () { loadLand((tries || 0) + 1); }, 100);
                else dots = [];
                return;
            }
            fetch(url).then(function (r) { return r.json(); }).then(function (t) {
                var land = window.topojson.feature(t, t.objects.land);
                var W = 1440, H = 720, c = document.createElement('canvas');
                c.width = W; c.height = H;
                var g = c.getContext('2d');
                g.fillStyle = '#fff';
                var polys = [];
                land.features.forEach(function (f) {
                    var gm = f.geometry;
                    if (gm.type === 'Polygon') polys.push(gm.coordinates);
                    else if (gm.type === 'MultiPolygon') gm.coordinates.forEach(function (p) { polys.push(p); });
                });
                polys.forEach(function (poly) {
                    poly.forEach(function (ring) {
                        var prev = null, off = 0;
                        var pts = ring.map(function (pt) {
                            var lo = pt[0], la = pt[1];
                            if (prev !== null) { var d = lo + off - prev; if (d > 180) off -= 360; else if (d < -180) off += 360; }
                            prev = lo + off;
                            return [lo + off, la];
                        });
                        [-360, 0, 360].forEach(function (s) {
                            g.beginPath();
                            pts.forEach(function (p, i) {
                                var x = (p[0] + s + 180) / 360 * W, y = (90 - p[1]) / 180 * H;
                                if (i) g.lineTo(x, y); else g.moveTo(x, y);
                            });
                            g.closePath(); g.fill();
                        });
                    });
                });
                var data = g.getImageData(0, 0, W, H).data, out = [], step = 1.25;
                for (var la = -84; la <= 84; la += step) {
                    var n = Math.max(1, Math.round(360 * Math.cos(la * R2D) / step));
                    for (var i = 0; i < n; i++) {
                        var lo = -180 + (i + 0.5) * 360 / n;
                        var x = Math.floor((lo + 180) / 360 * W), y = Math.floor((90 - la) / 180 * H);
                        if (data[(y * W + x) * 4 + 3] > 128) out.push([Math.sin(la * R2D), Math.cos(la * R2D), lo * R2D]);
                    }
                }
                dots = out;
            }).catch(function () { dots = []; });
        }

        function draw(now) {
            requestAnimationFrame(draw);
            var dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            if (!visible) return;
            var dpr = window.devicePixelRatio || 1, size = cv.clientWidth;
            if (!size) return;
            if (cv.width !== Math.round(size * dpr)) { cv.width = cv.height = Math.round(size * dpr); }
            var g = cv.getContext('2d'), S = cv.width, cx = S / 2, cy = S / 2, R = S * 0.46;
            var active = state.hover || state.sel;
            if (!dragging && !state.hover && !state.sel && !motionPaused()) sway += dt;
            var baseLon = 12 + 16 * Math.sin(sway * 0.22);
            var c = state.sel && COUNTRIES.filter(function (x) { return x.id === state.sel; })[0];
            if (c && !dragging) {
                dLon += ((c.lon - baseLon) - dLon) * 0.06;
                dLat += ((c.lat - 48) - dLat) * 0.06;
            }
            var lam0 = (baseLon + dLon) * R2D, phi0 = Math.max(-10, Math.min(80, 48 + dLat)) * R2D;
            var sP = Math.sin(phi0), cP = Math.cos(phi0);
            g.clearRect(0, 0, S, S);
            var grd = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
            grd.addColorStop(0, 'rgba(18,18,137,0.85)'); grd.addColorStop(1, 'rgba(4,4,77,0.95)');
            g.fillStyle = grd; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
            g.strokeStyle = 'rgba(96,152,255,0.35)'; g.lineWidth = dpr; g.stroke();
            if (dots) {
                g.fillStyle = '#6098FF';
                var ds = 1.7 * dpr;
                for (var i = 0; i < dots.length; i++) {
                    var d = dots[i], dl = d[2] - lam0, cd = Math.cos(dl);
                    var cosc = sP * d[0] + cP * d[1] * cd;
                    if (cosc < 0.02) continue;
                    g.globalAlpha = 0.2 + 0.8 * cosc;
                    g.fillRect(cx + R * d[1] * Math.sin(dl) - ds / 2, cy - R * (cP * d[0] - sP * d[1] * cd) - ds / 2, ds, ds);
                }
                g.globalAlpha = 1;
            }
            pins = [];
            var pulse = motionPaused() ? 0.5 : (now / 1000) % 2 / 2;
            COUNTRIES.forEach(function (c) {
                var la = c.lat * R2D, dl = c.lon * R2D - lam0, sL = Math.sin(la), cL = Math.cos(la), cd = Math.cos(dl);
                var cosc = sP * sL + cP * cL * cd;
                if (cosc < 0.05) return;
                var x = cx + R * cL * Math.sin(dl), y = cy - R * (cP * sL - sP * cL * cd);
                pins.push({ id: c.id, x: x / dpr, y: y / dpr });
                var on = active === c.id;
                g.strokeStyle = 'rgba(218,231,255,' + ((1 - pulse) * 0.7) + ')'; g.lineWidth = 1.5 * dpr;
                g.beginPath(); g.arc(x, y, (6 + pulse * 14) * dpr, 0, Math.PI * 2); g.stroke();
                g.fillStyle = on ? '#FFFFFF' : '#DAE7FF'; g.beginPath(); g.arc(x, y, (on ? 7 : 5) * dpr, 0, Math.PI * 2); g.fill();
                g.fillStyle = '#121289'; g.beginPath(); g.arc(x, y, 2 * dpr, 0, Math.PI * 2); g.fill();
                g.font = '500 ' + (11 * dpr) + 'px "Plus Jakarta Sans", sans-serif'; g.fillStyle = '#DAE7FF';
                g.fillText(c.code, x + 10 * dpr, y - 8 * dpr);
            });
            if (tip) {
                var p = active && pins.filter(function (q) { return q.id === active; })[0];
                if (p) { tip.style.left = p.x + 'px'; tip.style.top = p.y + 'px'; tip.style.opacity = 1; }
                else tip.style.opacity = 0;
                setTipLive(!!p);
            }
        }

        function pinAt(e) {
            var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, best = null, bd = 18;
            pins.forEach(function (p) { var d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p.id; } });
            return best;
        }

        cv.addEventListener('pointerdown', function (e) {
            dragging = true; moved = 0; px = e.clientX; py = e.clientY;
            cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing';
        });
        cv.addEventListener('pointermove', function (e) {
            if (dragging) {
                var dx = e.clientX - px, dy = e.clientY - py;
                px = e.clientX; py = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
                dLon -= dx * 0.3; dLat = Math.max(-58, Math.min(32, dLat + dy * 0.3));
                if (moved > 4 && state.sel) setSel(null);
            } else {
                var id = pinAt(e);
                cv.style.cursor = id ? 'pointer' : 'grab';
                setHover(id);
            }
        });
        cv.addEventListener('pointerup', function (e) {
            dragging = false; cv.style.cursor = 'grab';
            if (moved < 4) { var id = pinAt(e); setSel(id && id !== state.sel ? id : null); }
        });
        cv.addEventListener('pointerleave', function () { setHover(null); });

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(cv);
        }

        loadLand();
        requestAnimationFrame(draw);
    }

    /* ------------------------------------------- library: clean URLs */
    /* The LibraryPage component (Pensoft.Library) submits its GET form as
       ?type=4&Filter[sort]=title+asc&search=. Navigate to the clean URL
       instead (/publications/<tab>?sort=...&search=...), which
       pages/library.htm translates back for the component. The plugin's
       script submits via jQuery's .submit(), so the handler is bound with
       jQuery too (a native listener would not see those submits). */
    function initLibraryUrls() {
        var wrap = document.querySelector('[data-rl-library]');
        var $ = window.jQuery;
        if (!wrap || !$) return;
        var cfg;
        try { cfg = JSON.parse(wrap.getAttribute('data-rl-library')); } catch (e) { return; }
        var form = document.getElementById('typeForm');
        if (!form) return;

        var urlFor = function (type, sort, search) {
            type = String(type || '0');
            var slug = cfg.tabs[type];
            var url = cfg.base + (slug ? '/' + slug : '');
            var params = [];
            var def = cfg.defaults[type] || 'year desc';
            if (sort && sort !== def && cfg.sorts[sort]) params.push('sort=' + encodeURIComponent(cfg.sorts[sort]));
            search = (search || '').trim();
            if (search) params.push('search=' + encodeURIComponent(search));
            return url + (params.length ? '?' + params.join('&') : '');
        };
        var current = function () {
            return {
                type: (form.querySelector('input[name="type"]') || {}).value,
                sort: (document.getElementById('sortSelect') || {}).value,
                search: (form.querySelector('input[name="search"]') || {}).value
            };
        };

        $(form).on('submit', function (e) {
            e.preventDefault();
            var c = current();
            window.location.href = urlFor(c.type, c.sort, c.search);
        });

        // Real hrefs on the tabs (the plugin's are bare <a data-type>), so
        // they behave as links: open in new tab, copy link, crawlable. The
        // active one is the current page for assistive tech.
        $$('#mylibraryForm a[data-type]').forEach(function (a) {
            a.setAttribute('href', urlFor(a.getAttribute('data-type'), null, current().search));
            if (a.classList.contains('active')) a.setAttribute('aria-current', 'page');
        });
        var tabs = document.getElementById('mylibraryForm');
        if (tabs && !tabs.getAttribute('aria-label')) tabs.setAttribute('aria-label', 'Document types');
        if (tabs && tabs.tagName !== 'NAV') tabs.setAttribute('role', 'navigation');

        // The plugin's sort <select> has no label (WCAG 1.3.1 / 4.1.2).
        var sort = document.getElementById('sortSelect');
        if (sort && !document.querySelector('label[for="sortSelect"]') && !sort.getAttribute('aria-label')) {
            var lab = document.createElement('label');
            lab.className = 'sr-only';
            lab.htmlFor = 'sortSelect';
            lab.textContent = 'Sort documents by';
            sort.parentNode.insertBefore(lab, sort);
        }
    }

    /* -------------------------------- cookie banner after the skip link */
    /* The cookie-consent plugin inserts its banner as the first element of
       <body>, which made "Got it!" the first Tab stop instead of the skip
       link. The banner is position:fixed, so moving it to the end of <body>
       changes the focus order only, not the layout. */
    function initCookieOrder() {
        var move = function () {
            $$('body > .cc_banner-wrapper, body > .cc-window, body > .cc_banner').forEach(function (el) {
                if (el !== document.body.lastElementChild) document.body.appendChild(el);
            });
        };
        move();
        if ('MutationObserver' in window) {
            var mo = new MutationObserver(move);
            mo.observe(document.body, { childList: true });
            setTimeout(function () { mo.disconnect(); }, 10000);
        }
    }

    function init() {
        // Images printed by CMS component templates without an alt (e.g. the
        // Jumbotron image under the approach cards, hidden by CSS) are
        // decorative here: give them an empty alt so they are skipped.
        $$('.rl-cms img:not([alt])').forEach(function (img) { img.setAttribute('alt', ''); });
        // Links in editor content (Jumbotron, articles, events, static pages)
        // that open in a new tab get the same screen-reader warning as the
        // theme's own links (partials/components/new-tab-hint).
        $$('.rl-cms a[target="_blank"], .rl-legacy a[target="_blank"], .rl-prose a[target="_blank"]').forEach(function (a) {
            if (/new (tab|window)/i.test(a.textContent + ' ' + (a.getAttribute('aria-label') || ''))) return;
            var hint = document.createElement('span');
            hint.className = 'sr-only';
            hint.textContent = ' (opens in a new tab)';
            a.appendChild(hint);
        });
        initCookieOrder();
        initMotion();
        initLibraryUrls();
        initHeader();
        initFade();
        initVideo();
        initCarousels();
        initToggles();
        initDialogs();
        initSearch();
        initNavSelects();
        initSpy();
        initGlobe();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
