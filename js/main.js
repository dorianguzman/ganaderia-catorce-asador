/* ===== Asador Callejero Catorce — Main JS ===== */

(function () {
  'use strict';

  // ── Config ──
  var WHATSAPP_NUMBER = '5214461060320';
  var SWIPE_THRESHOLD = 50;
  var SWIPE_LOCK_MS = 450;
  var NY_FALLBACK_PRICE = 100;

  // ── Zone Config (per-category) ──
  var ZONE_CONFIG = {
    tacos: {
      character: 'assets/generated/zone-tacos.webp',
      characterVideo: 'assets/generated/zone-tacos.mp4',
      accent: '#D4231A',
      quote: 'Los tacos son mi vida, guero!'
    },
    quesadillas: {
      character: 'assets/generated/zone-quesadillas.webp',
      characterVideo: 'assets/generated/zone-quesadillas.mp4',
      accent: '#F9A825',
      quote: 'Con quesito, todo sabe mejor.'
    },
    charolas: {
      character: 'assets/generated/zone-charolas.webp',
      characterVideo: 'assets/generated/zone-charolas.mp4',
      accent: '#BF360C',
      quote: 'Pa\' los que van en serio.'
    },
    especialidades: {
      character: 'assets/generated/zone-especialidades.webp',
      characterVideo: 'assets/generated/zone-especialidades.mp4',
      accent: '#8D6E63',
      quote: 'Lo mejor de la casa, compadre.'
    },
    bebidas: {
      character: 'assets/generated/zone-bebidas.webp',
      characterVideo: 'assets/generated/zone-bebidas.mp4',
      accent: '#558B2F',
      quote: 'Pa\' refrescar el alma!'
    },
    postres: {
      character: 'assets/generated/zone-postres.webp',
      characterVideo: 'assets/generated/zone-postres.mp4',
      accent: '#E91E63',
      quote: 'El broche de oro, mi amor.'
    },
    salsas: {
      character: 'assets/generated/salsas-scene.webp',
      characterVideo: 'assets/generated/salsas-scene.mp4',
      accent: '#F44336',
      quote: 'El toque que le faltaba a tu taco!'
    }
  };

  // Tab labels: emoji + full name for pills
  var TAB_LABELS = {
    tacos:          { emoji: '🌮', short: 'Tacos' },
    quesadillas:    { emoji: '🧀', short: 'Quesadillas' },
    charolas:       { emoji: '🥩', short: 'Charolas' },
    especialidades: { emoji: '⭐', short: 'Especialidades' },
    bebidas:        { emoji: '🥤', short: 'Bebidas' },
    postres:        { emoji: '🍰', short: 'Postres' },
    salsas:         { emoji: '🌶️', short: 'Salsas' }
  };

  // Premium items (get full-width card treatment)
  var PREMIUM_IDS = ['taco-newyork', 'quesa-newyork', 'charola-combinada', 'charola-diezmillo', 'chavindeca', 'papa-grill'];

  // ── State ──
  var menuData = null;
  var cart = {};
  var orderType = null;
  var pickerBaseItem = null;
  var addressMode = 'write';
  var locationCoords = null;
  var activeWorldIndex = 0;
  var worldCount = 0;
  var touchStartX = 0;
  var touchStartY = 0;
  var touchDeltaX = 0;
  var isSwiping = false;
  var swipeLocked = false;
  var worldsEntered = {};

  // ── DOM refs ──
  var menuNav = document.getElementById('menu-nav');
  var menuDots = document.getElementById('menu-dots');
  var swipeHint = document.getElementById('swipe-hint');
  var menuWorlds = document.getElementById('menu-worlds');
  var worldsTrack = document.getElementById('menu-worlds-track');
  var cartFab = document.getElementById('cart-fab');
  var cartBadge = document.getElementById('cart-badge');
  var bottomSheet = document.getElementById('bottom-sheet');
  var sheetOverlay = document.getElementById('sheet-overlay');
  var sheetItems = document.getElementById('sheet-items');
  var sheetEmpty = document.getElementById('sheet-empty');
  var sheetOrderType = document.getElementById('sheet-order-type');
  var sheetAddress = document.getElementById('sheet-address');
  var sheetTotalValue = document.getElementById('sheet-total-value');
  var btnSend = document.getElementById('btn-send');
  var addressForm = document.getElementById('address-form');

  // ── Init ──
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    window.scrollTo(0, 0);
    loadMenu().then(function () {
      initOrderType();
      initCart();
      initBottomSheet();
      initQR();
      initAnimations();
    });
  }

  // ════════════════════════════════════════════
  //  MENU RENDERER
  // ════════════════════════════════════════════

  function loadMenu() {
    return fetch('data/menu.json').then(function (res) {
      return res.json();
    }).then(function (data) {
      menuData = data;
      renderTabs();
      renderCategories();
    }).catch(function (err) {
      console.error('Error loading menu:', err);
      worldsTrack.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--white-dim);">No se pudo cargar el menu.</p>';
    });
  }

  function renderTabs() {
    var catIds = menuData.categories.map(function (c) { return c.id; });
    worldCount = catIds.length;

    // Render pill tabs
    menuNav.innerHTML = catIds.map(function (id) {
      var label = TAB_LABELS[id] || { emoji: '', short: id };
      return '<button class="menu__tab" data-world-index="' + catIds.indexOf(id) + '" data-category="' + id + '">' +
        label.emoji + ' ' + label.short + '</button>';
    }).join('');

    // Render dot indicators
    menuDots.innerHTML = catIds.map(function (id, i) {
      return '<button class="menu__dot" data-world-index="' + i + '" aria-label="' + (TAB_LABELS[id] || {}).short + '"></button>';
    }).join('');

    // Tab click → goToWorld
    menuNav.addEventListener('click', function (e) {
      var btn = e.target.closest('.menu__tab');
      if (!btn) return;
      var idx = parseInt(btn.dataset.worldIndex, 10);
      goToWorld(idx);
    });

    // Dot click → goToWorld
    menuDots.addEventListener('click', function (e) {
      var btn = e.target.closest('.menu__dot');
      if (!btn) return;
      var idx = parseInt(btn.dataset.worldIndex, 10);
      goToWorld(idx);
    });
  }

  function renderCategories() {
    var html = '';

    menuData.categories.forEach(function (cat) {
      html += renderWorldHTML(cat);
    });

    worldsTrack.innerHTML = html;

    // Attach stepper delegation to track
    worldsTrack.addEventListener('click', handleMenuClick);
  }

  function renderWorldHTML(cat) {
    var config = ZONE_CONFIG[cat.id] || {};

    // Character video inline next to title
    var characterHTML = '';
    if (config.characterVideo) {
      characterHTML = '<div class="menu__world-character">' +
        '<video src="' + config.characterVideo + '" poster="' + (config.character || '') + '" autoplay loop muted playsinline loading="lazy"></video>' +
      '</div>';
    }

    // Header: title + quote + character video
    var headerHTML = '<div class="menu__world-header">' +
      '<div class="menu__world-header-row">' +
        '<div class="menu__world-header-text">' +
          '<h3 class="menu__world-title">' + (cat.icon || '') + ' ' + cat.name + '</h3>';

    if (config.quote) {
      headerHTML += '<p class="menu__world-quote">"' + config.quote + '"</p>';
    }

    if (cat.description) {
      headerHTML += '<p class="menu__category-desc">' + cat.description + '</p>';
    }

    headerHTML += '</div>' + characterHTML + '</div>' + '</div>';

    // Items grid
    var itemsHTML = cat.items.map(function (item) {
      return renderItemCard(item, cat);
    }).join('');

    // Note
    var noteHTML = '';
    if (cat.note) {
      noteHTML = '<p class="menu__category-note">* ' + cat.note + '</p>';
    }

    return '<div class="menu__world" data-zone="' + cat.id + '">' +
      headerHTML +
      '<div class="menu__items">' + itemsHTML + '</div>' +
      noteHTML +
    '</div>';
  }

  function renderItemCard(item, category) {
    var qty = cart[item.id] ? cart[item.id].qty : 0;
    var promoHTML = '';
    if (item.promos) {
      promoHTML = item.promos.map(function (p) {
        return '<span class="menu__item-promo">' + p.label + '</span>';
      }).join(' ');
    } else if (item.promo) {
      promoHTML = '<span class="menu__item-promo">' + item.promo.label + '</span>';
    }
    var variantHTML = '';
    if (item.variant) {
      variantHTML = '<span class="menu__item-variant">' + item.variant.name + ': $' + item.variant.price + '</span>';
    }

    var isPremium = PREMIUM_IDS.indexOf(item.id) !== -1;
    var premiumClass = isPremium ? ' menu__item--premium' : '';
    var hasItemsClass = qty > 0 ? ' has-items' : '';

    return '<div class="menu__item' + premiumClass + hasItemsClass + '" data-item-id="' + item.id + '">' +
      '<span class="menu__item-name">' + item.name + '</span>' +
      '<span class="menu__item-price">' + (item.price === 0 ? 'Incluida' : '$' + item.price) + '</span>' +
      promoHTML +
      variantHTML +
      '<div class="stepper">' +
        '<button class="stepper__btn stepper__btn--minus" data-action="minus" data-id="' + item.id + '" aria-label="Quitar uno">−</button>' +
        '<span class="stepper__count" id="count-' + item.id + '">' + qty + '</span>' +
        '<button class="stepper__btn stepper__btn--plus" data-action="plus" data-id="' + item.id + '" aria-label="Agregar uno">+</button>' +
      '</div>' +
    '</div>';
  }

  function handleMenuClick(e) {
    var btn = e.target.closest('.stepper__btn');
    if (!btn) return;
    var id = btn.dataset.id;
    var action = btn.dataset.action;
    if (action === 'plus') {
      var found = findItemById(id);
      if (found && found.item.hasIngredients) {
        showIngredientPicker(id);
        return;
      }
      addToCart(id);
    }
    if (action === 'minus') {
      var foundMinus = findItemById(id);
      if (foundMinus && foundMinus.item.hasIngredients) {
        removeCompoundFromCart(id);
        return;
      }
      removeFromCart(id);
    }
  }

  // ════════════════════════════════════════════
  //  INGREDIENT PICKER
  // ════════════════════════════════════════════

  function getIngredients() {
    var tacos = menuData.categories.find(function (c) { return c.id === 'tacos'; });
    return tacos.items.map(function (t) {
      var ingId = t.id.replace('taco-', '');
      return { id: ingId, name: t.name };
    });
  }

  function showIngredientPicker(baseItemId) {
    pickerBaseItem = baseItemId;
    var baseItem = findItemById(baseItemId);
    if (!baseItem) return;

    // Remove existing overlay if any
    hideIngredientPicker();

    var ingredients = getIngredients();
    var overlay = document.createElement('div');
    overlay.className = 'ingredient-picker-overlay';
    overlay.id = 'ingredient-picker-overlay';

    var panel = document.createElement('div');
    panel.className = 'ingredient-picker';

    var title = document.createElement('div');
    title.className = 'ingredient-picker__title';
    title.textContent = 'Elige tu ingrediente — ' + baseItem.item.name;

    var grid = document.createElement('div');
    grid.className = 'ingredient-picker__grid';

    var nyPrice = baseItem.item.nyPrice || NY_FALLBACK_PRICE;

    ingredients.forEach(function (ing) {
      var btn = document.createElement('button');
      btn.className = 'ingredient-picker__btn';
      if (ing.id === 'newyork') {
        btn.className += ' ingredient-picker__btn--ny';
        btn.textContent = ing.name + ' · $' + nyPrice;
      } else {
        btn.textContent = ing.name;
      }
      btn.addEventListener('click', function () {
        addIngredientToCart(baseItemId, ing.id, ing.name);
        hideIngredientPicker();
      });
      grid.appendChild(btn);
    });

    var cancel = document.createElement('button');
    cancel.className = 'ingredient-picker__cancel';
    cancel.textContent = 'Cancelar';
    cancel.addEventListener('click', hideIngredientPicker);

    panel.appendChild(title);
    panel.appendChild(grid);
    panel.appendChild(cancel);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Tap overlay background to close
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hideIngredientPicker();
    });

    // Trigger animation
    requestAnimationFrame(function () {
      overlay.classList.add('is-visible');
    });
  }

  function hideIngredientPicker() {
    var overlay = document.getElementById('ingredient-picker-overlay');
    if (!overlay) return;
    overlay.classList.remove('is-visible');
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 350);
    pickerBaseItem = null;
  }

  function addIngredientToCart(baseItemId, ingredientId, ingredientName) {
    var compoundId = baseItemId + '--' + ingredientId;
    var baseItem = findItemById(baseItemId);
    if (!baseItem) return;

    var isNY = ingredientId === 'newyork';
    var price = isNY ? (baseItem.item.nyPrice || NY_FALLBACK_PRICE) : baseItem.item.price;

    if (!cart[compoundId]) {
      cart[compoundId] = {
        item: { id: compoundId, name: baseItem.item.name, price: price },
        qty: 0,
        categoryName: baseItem.categoryName,
        categoryId: baseItem.categoryId,
        ingredientName: ingredientName,
        baseItemId: baseItemId
      };
    }

    cart[compoundId].qty++;
    updateCartUIForPicker(baseItemId);
    saveCart();

    // Pulse animation on card
    var card = worldsTrack.querySelector('[data-item-id="' + baseItemId + '"]');
    if (card) {
      card.classList.add('has-items');
      card.classList.remove('is-pulse');
      void card.offsetWidth;
      card.classList.add('is-pulse');
    }

    updateWorldHeight(activeWorldIndex);
  }

  function getCompoundQty(baseItemId) {
    var total = 0;
    var keys = Object.keys(cart);
    var prefix = baseItemId + '--';
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(prefix) === 0) {
        total += cart[keys[i]].qty;
      }
    }
    return total;
  }

  function updateCartUIForPicker(baseItemId) {
    var countEl = document.getElementById('count-' + baseItemId);
    if (countEl) {
      countEl.textContent = getCompoundQty(baseItemId);
    }

    var totalItems = 0;
    var keys = Object.keys(cart);
    for (var i = 0; i < keys.length; i++) {
      if (cart[keys[i]].categoryId !== 'salsas') totalItems += cart[keys[i]].qty;
    }
    cartBadge.textContent = totalItems;
    cartFab.hidden = totalItems === 0;

    if (totalItems > 0) {
      cartFab.classList.remove('is-bounce');
      void cartFab.offsetWidth;
      cartFab.classList.add('is-bounce');
    }

    updateSendButton();
  }

  function removeCompoundFromCart(baseItemId) {
    // Find compound entries for this base item, remove qty from the last one found
    var keys = Object.keys(cart);
    var prefix = baseItemId + '--';
    var lastKey = null;
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(prefix) === 0 && cart[keys[i]].qty > 0) {
        lastKey = keys[i];
      }
    }

    if (!lastKey) return;

    cart[lastKey].qty--;
    if (cart[lastKey].qty === 0) {
      delete cart[lastKey];
    }

    var totalCompound = getCompoundQty(baseItemId);
    var card = worldsTrack.querySelector('[data-item-id="' + baseItemId + '"]');
    if (card && totalCompound === 0) {
      card.classList.remove('has-items');
    }

    updateCartUIForPicker(baseItemId);
    saveCart();
    updateWorldHeight(activeWorldIndex);
  }

  // ════════════════════════════════════════════
  //  SWIPE ENGINE
  // ════════════════════════════════════════════

  function initSwipe() {
    worldsTrack.addEventListener('touchstart', onTouchStart, { passive: true });
    worldsTrack.addEventListener('touchmove', onTouchMove, { passive: true });
    worldsTrack.addEventListener('touchend', onTouchEnd, { passive: true });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') goToWorld(Math.min(activeWorldIndex + 1, worldCount - 1));
      if (e.key === 'ArrowLeft') goToWorld(Math.max(activeWorldIndex - 1, 0));
    });
  }

  function onTouchStart(e) {
    if (swipeLocked) return;
    var touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchDeltaX = 0;
    isSwiping = false;
    worldsTrack.classList.remove('is-animating');
  }

  function onTouchMove(e) {
    if (swipeLocked) return;
    var touch = e.touches[0];
    var dx = touch.clientX - touchStartX;
    var dy = touch.clientY - touchStartY;

    // Decide swipe direction on first significant move
    if (!isSwiping && Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

    if (!isSwiping) {
      // If vertical movement dominates, don't hijack scroll
      if (Math.abs(dy) > Math.abs(dx)) return;
      isSwiping = true;
    }

    if (isSwiping) {
      touchDeltaX = dx;

      // Rubber-band at edges
      var atStart = activeWorldIndex === 0 && dx > 0;
      var atEnd = activeWorldIndex === worldCount - 1 && dx < 0;
      if (atStart || atEnd) {
        touchDeltaX = dx * 0.3; // dampen
      }

      var baseOffset = -activeWorldIndex * 100;
      var pxToPercent = (touchDeltaX / worldsTrack.offsetWidth) * 100;
      worldsTrack.style.transform = 'translateX(' + (baseOffset + pxToPercent) + '%)';
    }
  }

  function onTouchEnd() {
    if (!isSwiping) return;
    isSwiping = false;

    if (Math.abs(touchDeltaX) > SWIPE_THRESHOLD) {
      if (touchDeltaX < 0 && activeWorldIndex < worldCount - 1) {
        goToWorld(activeWorldIndex + 1);
      } else if (touchDeltaX > 0 && activeWorldIndex > 0) {
        goToWorld(activeWorldIndex - 1);
      } else {
        snapBack();
      }
    } else {
      snapBack();
    }
  }

  function snapBack() {
    worldsTrack.classList.add('is-animating');
    worldsTrack.style.transform = 'translateX(' + (-activeWorldIndex * 100) + '%)';
  }

  // ════════════════════════════════════════════
  //  WORLD NAVIGATION
  // ════════════════════════════════════════════

  function goToWorld(index) {
    if (index < 0 || index >= worldCount) return;
    activeWorldIndex = index;

    // Slide track
    worldsTrack.classList.add('is-animating');
    worldsTrack.style.transform = 'translateX(' + (-index * 100) + '%)';

    // Update tabs + dots
    highlightTab(index);

    // Animate container height
    updateWorldHeight(index);

    // Play entrance on first visit
    var worlds = worldsTrack.querySelectorAll('.menu__world');
    var worldEl = worlds[index];
    if (worldEl && !worldsEntered[index]) {
      worldsEntered[index] = true;
      playWorldEntrance(worldEl);
    }

    // Manage video play/pause
    manageWorldVideos(index);

    // Hide swipe hint after first navigation
    if (swipeHint && !swipeHint.classList.contains('is-hidden')) {
      swipeHint.classList.add('is-hidden');
    }

    // Lock swipe briefly
    swipeLocked = true;
    setTimeout(function () { swipeLocked = false; }, SWIPE_LOCK_MS);
  }

  function highlightTab(index) {
    var tabs = menuNav.querySelectorAll('.menu__tab');
    var dots = menuDots.querySelectorAll('.menu__dot');
    var worlds = worldsTrack.querySelectorAll('.menu__world');
    var worldEl = worlds[index];
    var zoneId = worldEl ? worldEl.dataset.zone : '';
    var config = ZONE_CONFIG[zoneId] || {};

    tabs.forEach(function (tab, i) {
      tab.classList.toggle('is-active', i === index);
    });

    dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === index);
      if (i === index && config.accent) {
        dot.style.background = config.accent;
      } else {
        dot.style.background = '';
      }
    });

    // Update tab accent color
    if (config.accent) {
      menuNav.style.setProperty('--tab-accent', config.accent);
    }
  }

  function updateWorldHeight(index) {
    var worlds = worldsTrack.querySelectorAll('.menu__world');
    var targetWorld = worlds[index];
    if (!targetWorld) return;

    var targetHeight = targetWorld.scrollHeight;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (typeof gsap !== 'undefined' && !reducedMotion) {
      gsap.to(menuWorlds, {
        height: targetHeight, duration: 0.35, ease: 'power2.out',
        onComplete: function () {
          if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        }
      });
    } else {
      menuWorlds.style.height = targetHeight + 'px';
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }
  }

  function manageWorldVideos(activeIndex) {
    var worlds = worldsTrack.querySelectorAll('.menu__world');
    worlds.forEach(function (world, i) {
      var videos = world.querySelectorAll('video');
      videos.forEach(function (video) {
        if (i === activeIndex) {
          if (video.dataset.src && !video.src) {
            video.src = video.dataset.src;
            video.removeAttribute('data-src');
          }
          video.play().catch(function () {});
        } else {
          if (!video.paused) video.pause();
        }
      });
    });
  }

  // ════════════════════════════════════════════
  //  WORLD ENTRANCE ANIMATIONS
  // ════════════════════════════════════════════

  function playWorldEntrance(worldEl) {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var character = worldEl.querySelector('.menu__world-character');
    var title = worldEl.querySelector('.menu__world-title');
    var quote = worldEl.querySelector('.menu__world-quote');
    var desc = worldEl.querySelector('.menu__category-desc');
    var salsasSub = worldEl.querySelector('.salsas__subtitle');
    var items = worldEl.querySelectorAll('.menu__item');
    var salsasWrap = worldEl.querySelector('.salsas__image-wrap');

    if (reducedMotion) {
      if (title) title.style.opacity = '1';
      if (quote) quote.style.opacity = '1';
      if (desc) desc.style.opacity = '1';
      if (salsasSub) salsasSub.style.opacity = '1';
      items.forEach(function (it) { it.style.opacity = '1'; });
      if (salsasWrap) salsasWrap.style.opacity = '1';
      worldEl.classList.add('is-entered');
      return;
    }

    if (typeof gsap === 'undefined') {
      if (title) title.style.opacity = '1';
      if (quote) quote.style.opacity = '1';
      if (desc) desc.style.opacity = '1';
      if (salsasSub) salsasSub.style.opacity = '1';
      items.forEach(function (it) { it.style.opacity = '1'; });
      worldEl.classList.add('is-entered');
      return;
    }

    var tl = gsap.timeline({
      onComplete: function () {
        worldEl.classList.add('is-entered');
        updateWorldHeight(activeWorldIndex);
      }
    });

    // Character scale-in
    if (character) {
      tl.fromTo(character,
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }

    // Title fade up
    if (title) {
      tl.fromTo(title,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
        character ? '-=0.3' : '0'
      );
    }

    // Quote fade
    if (quote) {
      tl.fromTo(quote,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
        '-=0.2'
      );
    }

    // Description fade
    if (desc) {
      tl.fromTo(desc,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
        '-=0.2'
      );
    }

    // Salsas subtitle
    if (salsasSub) {
      tl.fromTo(salsasSub,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
        '-=0.2'
      );
    }

    // Items stagger in
    if (items.length > 0) {
      tl.fromTo(items,
        { opacity: 0, y: 25, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.4,
          stagger: 0.06,
          ease: 'power3.out'
        },
        '-=0.2'
      );
    }

    // Salsas image
    if (salsasWrap) {
      tl.fromTo(salsasWrap,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
        '-=0.2'
      );
    }
  }

  // ════════════════════════════════════════════
  //  CART SYSTEM
  // ════════════════════════════════════════════

  function findItemById(id) {
    for (var i = 0; i < menuData.categories.length; i++) {
      var cat = menuData.categories[i];
      for (var j = 0; j < cat.items.length; j++) {
        if (cat.items[j].id === id) return { item: cat.items[j], categoryName: cat.name, categoryId: cat.id };
      }
    }
    return null;
  }

  function getSalsasCount() {
    var count = 0;
    var keys = Object.keys(cart);
    for (var i = 0; i < keys.length; i++) {
      if (cart[keys[i]].categoryId === 'salsas') count += cart[keys[i]].qty;
    }
    return count;
  }

  function addToCart(id) {
    // Check salsas limit before creating entry
    var found = cart[id] ? null : findItemById(id);
    var catId = cart[id] ? cart[id].categoryId : (found ? found.categoryId : null);
    if (catId === 'salsas') {
      if (cart[id] && cart[id].qty >= 1) return;
      if (getSalsasCount() >= 2) return;
    }

    if (!cart[id]) {
      if (!found) return;
      cart[id] = { item: found.item, qty: 0, categoryName: found.categoryName, categoryId: found.categoryId };
    }

    cart[id].qty++;
    updateCartUI(id);
    saveCart();

    // Pulse animation on card
    var card = worldsTrack.querySelector('[data-item-id="' + id + '"]');
    if (card) {
      card.classList.add('has-items');
      card.classList.remove('is-pulse');
      void card.offsetWidth;
      card.classList.add('is-pulse');
    }

    // Update world height since content may have changed
    updateWorldHeight(activeWorldIndex);
  }

  function removeFromCart(id) {
    if (!cart[id] || cart[id].qty <= 0) return;
    cart[id].qty--;

    var card = worldsTrack.querySelector('[data-item-id="' + id + '"]');

    if (cart[id].qty === 0) {
      delete cart[id];
      if (card) card.classList.remove('has-items');
    }
    updateCartUI(id);
    saveCart();
    updateWorldHeight(activeWorldIndex);
  }

  function updateCartUI(changedId) {
    // For picker items, the count is handled by updateCartUIForPicker
    var foundItem = findItemById(changedId);
    if (foundItem && foundItem.item.hasIngredients) return;

    var countEl = document.getElementById('count-' + changedId);
    if (countEl) {
      countEl.textContent = cart[changedId] ? cart[changedId].qty : 0;
    }

    var totalItems = 0;
    var keys = Object.keys(cart);
    for (var i = 0; i < keys.length; i++) {
      if (cart[keys[i]].categoryId !== 'salsas') totalItems += cart[keys[i]].qty;
    }
    cartBadge.textContent = totalItems;
    cartFab.hidden = totalItems === 0;

    if (totalItems > 0) {
      cartFab.classList.remove('is-bounce');
      void cartFab.offsetWidth;
      cartFab.classList.add('is-bounce');
    }

    updateSendButton();
  }

  function calculateTotal() {
    var total = 0;
    var keys = Object.keys(cart);

    // Group compound entries by baseItemId for promo calculation
    var compoundGroups = {};
    var regularKeys = [];

    for (var i = 0; i < keys.length; i++) {
      var entry = cart[keys[i]];
      if (entry.baseItemId) {
        var baseId = entry.baseItemId;
        if (!compoundGroups[baseId]) {
          compoundGroups[baseId] = { promoQty: 0, nyTotal: 0, baseItem: null };
        }
        if (entry.ingredientName === 'New York') {
          compoundGroups[baseId].nyTotal += entry.qty * entry.item.price;
        } else {
          compoundGroups[baseId].promoQty += entry.qty;
          if (!compoundGroups[baseId].baseItem) {
            compoundGroups[baseId].baseItem = findItemById(baseId);
          }
        }
      } else {
        regularKeys.push(keys[i]);
      }
    }

    // Regular items: per-entry calculation
    for (var j = 0; j < regularKeys.length; j++) {
      var regEntry = cart[regularKeys[j]];
      total += calculateItemSubtotal(regEntry.item, regEntry.qty);
    }

    // Compound groups: group promo by base item (DP optimal multi-tier)
    var groupIds = Object.keys(compoundGroups);
    for (var k = 0; k < groupIds.length; k++) {
      var group = compoundGroups[groupIds[k]];
      total += group.nyTotal;
      if (group.promoQty > 0 && group.baseItem) {
        total += calculatePromoTotal(group.promoQty, group.baseItem.item);
      }
    }

    return total;
  }

  function calculateFullPrice() {
    var total = 0;
    var keys = Object.keys(cart);
    for (var i = 0; i < keys.length; i++) {
      var entry = cart[keys[i]];
      total += entry.qty * entry.item.price;
    }
    return total;
  }

  function calculatePromoTotal(qty, item) {
    var promos = item.promos || (item.promo ? [item.promo] : []);
    if (promos.length === 0) return qty * item.price;

    // DP: find cheapest price for qty items given multiple promo tiers
    var dp = [0];
    for (var i = 1; i <= qty; i++) {
      dp[i] = dp[i - 1] + item.price;
      for (var p = 0; p < promos.length; p++) {
        if (i >= promos[p].qty) {
          var cost = dp[i - promos[p].qty] + promos[p].price;
          if (cost < dp[i]) dp[i] = cost;
        }
      }
    }
    return dp[qty];
  }

  function calculateItemSubtotal(item, qty) {
    if (item.promo && qty >= item.promo.qty) {
      var promoSets = Math.floor(qty / item.promo.qty);
      var remainder = qty % item.promo.qty;
      return (promoSets * item.promo.price) + (remainder * item.price);
    }
    return qty * item.price;
  }

  function initCart() {
    cartFab.addEventListener('click', openSheet);
    restoreCart();
  }

  // ── Cart persistence (sessionStorage) ──

  function saveCart() {
    try {
      sessionStorage.setItem('ac14_cart', JSON.stringify(cart));
    } catch (e) {}
  }

  function restoreCart() {
    try {
      var saved = sessionStorage.getItem('ac14_cart');
      if (!saved) return;
      var parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') return;

      // Restore each entry, re-validating against menuData
      var keys = Object.keys(parsed);
      for (var i = 0; i < keys.length; i++) {
        var entry = parsed[keys[i]];
        if (!entry || !entry.item || !entry.qty) continue;
        cart[keys[i]] = entry;
      }

      // Update all UI: stepper counts, FAB badge, has-items classes
      var totalItems = 0;
      var cartKeys = Object.keys(cart);
      for (var j = 0; j < cartKeys.length; j++) {
        var ce = cart[cartKeys[j]];
        if (ce.categoryId !== 'salsas') totalItems += ce.qty;

        // Update stepper count on card
        if (ce.baseItemId) {
          // Compound entry — update base item card
          var countEl = document.getElementById('count-' + ce.baseItemId);
          if (countEl) countEl.textContent = getCompoundQty(ce.baseItemId);
          var card = worldsTrack.querySelector('[data-item-id="' + ce.baseItemId + '"]');
          if (card) card.classList.add('has-items');
        } else {
          var countEl2 = document.getElementById('count-' + ce.item.id);
          if (countEl2) countEl2.textContent = ce.qty;
          var card2 = worldsTrack.querySelector('[data-item-id="' + ce.item.id + '"]');
          if (card2) card2.classList.add('has-items');
        }
      }

      cartBadge.textContent = totalItems;
      cartFab.hidden = totalItems === 0;
    } catch (e) {
      cart = {};
    }
  }

  // ════════════════════════════════════════════
  //  ORDER TYPE
  // ════════════════════════════════════════════

  function initOrderType() {
    document.querySelectorAll('.order-card').forEach(function (card) {
      card.addEventListener('click', function () {
        setOrderType(card.dataset.type);
      });
    });
    initAddressToggle();
    initGeolocation();
  }

  function setOrderType(type) {
    orderType = type;
    var cardsContainer = document.getElementById('order-type-cards');
    document.querySelectorAll('.order-card').forEach(function (card) {
      card.setAttribute('aria-pressed', card.dataset.type === type);
    });
    cardsContainer.classList.add('has-selection');
    addressForm.hidden = type !== 'takeaway';
  }

  function initAddressToggle() {
    var toggle = document.getElementById('address-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function (e) {
      var btn = e.target.closest('.address-toggle__btn');
      if (!btn) return;
      setAddressMode(btn.dataset.mode);
    });
  }

  function setAddressMode(mode) {
    addressMode = mode;
    var addressFields = document.getElementById('address-fields');
    var locationShare = document.getElementById('location-share');
    var toggleBtns = document.querySelectorAll('.address-toggle__btn');

    toggleBtns.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.mode === mode);
    });

    if (mode === 'write') {
      addressFields.hidden = false;
      locationShare.hidden = true;
    } else {
      addressFields.hidden = true;
      locationShare.hidden = false;
    }
    updateSendButton();
  }

  function initGeolocation() {
    var btn = document.getElementById('btn-get-location');
    if (!btn) return;
    btn.addEventListener('click', requestLocation);
  }

  function requestLocation() {
    var btn = document.getElementById('btn-get-location');
    var statusEl = document.getElementById('location-status');
    var errorEl = document.getElementById('location-error');
    var linkEl = document.getElementById('location-link');

    errorEl.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Obteniendo...';

    if (!navigator.geolocation) {
      btn.disabled = false;
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Obtener ubicacion';
      errorEl.textContent = 'Tu navegador no soporta geolocalizacion.';
      errorEl.hidden = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        locationCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        var mapUrl = 'https://maps.google.com/?q=' + locationCoords.lat + ',' + locationCoords.lng;
        linkEl.href = mapUrl;
        statusEl.hidden = false;
        btn.disabled = false;
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Actualizar ubicacion';
        updateSendButton();
      },
      function (err) {
        btn.disabled = false;
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Obtener ubicacion';
        var msg = 'No se pudo obtener tu ubicacion. ';
        if (err.code === 1) msg += 'Permite el acceso a tu ubicacion en tu navegador.';
        else if (err.code === 2) msg += 'Ubicacion no disponible. Intenta de nuevo.';
        else msg += 'Intenta de nuevo.';
        errorEl.textContent = msg;
        errorEl.hidden = false;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  // ════════════════════════════════════════════
  //  BOTTOM SHEET
  // ════════════════════════════════════════════

  function initBottomSheet() {
    sheetOverlay.addEventListener('click', closeSheet);
    bottomSheet.querySelector('.bottom-sheet__handle').addEventListener('click', closeSheet);
    btnSend.addEventListener('click', sendWhatsApp);
    document.getElementById('customer-name').addEventListener('input', updateSendButton);
  }

  function openSheet() {
    renderSheet();
    sheetOverlay.hidden = false;
    requestAnimationFrame(function () {
      sheetOverlay.classList.add('is-visible');
      bottomSheet.classList.add('is-open');
      bottomSheet.setAttribute('aria-hidden', 'false');
    });
    document.body.style.overflow = 'hidden';
  }

  function closeSheet() {
    sheetOverlay.classList.remove('is-visible');
    bottomSheet.classList.remove('is-open');
    bottomSheet.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(function () { sheetOverlay.hidden = true; }, 300);
  }

  function renderSheet() {
    var entries = [];
    var keys = Object.keys(cart);
    for (var i = 0; i < keys.length; i++) {
      entries.push(cart[keys[i]]);
    }
    var hasItems = entries.length > 0;

    sheetEmpty.hidden = hasItems;
    sheetItems.hidden = !hasItems;

    if (orderType === 'dine-in') {
      sheetOrderType.textContent = 'Para Comer Aqui';
      sheetAddress.textContent = '';
    } else if (orderType === 'takeaway') {
      sheetOrderType.textContent = 'Para Llevar';
      if (addressMode === 'location' && locationCoords) {
        var mapUrl = 'https://maps.google.com/?q=' + locationCoords.lat + ',' + locationCoords.lng;
        var locRef = document.getElementById('location-ref').value;
        sheetAddress.innerHTML = '<a href="' + mapUrl + '" target="_blank" rel="noopener" style="color:var(--orange);text-decoration:underline;">Ver ubicacion en mapa</a>';
        if (locRef) sheetAddress.innerHTML += ' &middot; ' + locRef;
      } else {
        var street = document.getElementById('address-street').value;
        var colonia = document.getElementById('address-colonia').value;
        var ref = document.getElementById('address-ref').value;
        var parts = [street, colonia, ref].filter(Boolean);
        sheetAddress.textContent = parts.length ? parts.join(', ') : '';
      }
    } else {
      sheetOrderType.textContent = 'Selecciona tipo de pedido';
      sheetAddress.textContent = '';
    }

    if (!hasItems) {
      sheetTotalValue.textContent = '$0';
      return;
    }

    // Build promo info for compound groups
    var compoundPromoInfo = {};
    for (var ci = 0; ci < entries.length; ci++) {
      var ce = entries[ci];
      if (ce.baseItemId) {
        if (!compoundPromoInfo[ce.baseItemId]) {
          compoundPromoInfo[ce.baseItemId] = { promoQty: 0 };
        }
        if (ce.ingredientName !== 'New York') {
          compoundPromoInfo[ce.baseItemId].promoQty += ce.qty;
        }
      }
    }

    sheetItems.innerHTML = entries.map(function (entry) {
      var displayName = entry.item.name;
      var detail = entry.categoryName;
      var subtotal;
      var sheetId = entry.item.id;
      var isCompound = !!entry.baseItemId;

      if (isCompound) {
        displayName = entry.item.name + ' — ' + entry.ingredientName;
        subtotal = entry.qty * entry.item.price;

        // Show grouped promo note for non-NY items
        if (entry.ingredientName !== 'New York') {
          var groupInfo = compoundPromoInfo[entry.baseItemId];
          var baseRef = findItemById(entry.baseItemId);
          if (baseRef && groupInfo) {
            var promos = baseRef.item.promos || (baseRef.item.promo ? [baseRef.item.promo] : []);
            var activePromo = null;
            for (var pi = promos.length - 1; pi >= 0; pi--) {
              if (groupInfo.promoQty >= promos[pi].qty) { activePromo = promos[pi]; break; }
            }
            if (activePromo) {
              detail += ' (promo aplicada)';
            }
          }
        }
      } else {
        subtotal = calculateItemSubtotal(entry.item, entry.qty);
        if (entry.item.promo && entry.qty >= entry.item.promo.qty) {
          var promoSets = Math.floor(entry.qty / entry.item.promo.qty);
          detail += ' (' + promoSets + 'x promo)';
        }
      }

      return '<div class="sheet-item">' +
        '<div class="sheet-item__info">' +
          '<div class="sheet-item__name">' + displayName + '</div>' +
          '<div class="sheet-item__detail">' + detail + '</div>' +
        '</div>' +
        '<div class="sheet-item__stepper">' +
          '<button class="stepper__btn stepper__btn--minus" data-sheet-action="minus" data-id="' + sheetId + '"' + (isCompound ? ' data-compound="true" data-base-id="' + entry.baseItemId + '"' : '') + ' aria-label="Quitar uno">−</button>' +
          '<span class="stepper__count">' + entry.qty + '</span>' +
          '<button class="stepper__btn stepper__btn--plus" data-sheet-action="plus" data-id="' + sheetId + '"' + (isCompound ? ' data-compound="true" data-base-id="' + entry.baseItemId + '"' : '') + ' aria-label="Agregar uno">+</button>' +
        '</div>' +
        '<span class="sheet-item__subtotal">' + (subtotal > 0 ? '$' + subtotal : 'Incluida') + '</span>' +
      '</div>';
    }).join('');

    sheetItems.querySelectorAll('.stepper__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.id;
        var action = btn.dataset.sheetAction;
        var isCompound = btn.dataset.compound === 'true';

        if (isCompound) {
          if (action === 'plus') {
            if (cart[id]) {
              cart[id].qty++;
              updateCartUIForPicker(btn.dataset.baseId);
              saveCart();
            }
          }
          if (action === 'minus') {
            if (cart[id] && cart[id].qty > 0) {
              cart[id].qty--;
              if (cart[id].qty === 0) delete cart[id];
              updateCartUIForPicker(btn.dataset.baseId);
              saveCart();
              var totalCompound = getCompoundQty(btn.dataset.baseId);
              var card = worldsTrack.querySelector('[data-item-id="' + btn.dataset.baseId + '"]');
              if (card && totalCompound === 0) card.classList.remove('has-items');
            }
          }
        } else {
          if (action === 'plus') addToCart(id);
          if (action === 'minus') removeFromCart(id);
        }
        renderSheet();
      });
    });

    var total = calculateTotal();
    var fullPrice = calculateFullPrice();
    var savings = fullPrice - total;

    sheetTotalValue.textContent = '$' + total;

    var savingsEl = document.getElementById('sheet-savings');
    var savingsValue = document.getElementById('sheet-savings-value');
    if (savingsEl && savingsValue) {
      if (savings > 0) {
        savingsValue.textContent = '-$' + savings;
        savingsEl.hidden = false;
      } else {
        savingsEl.hidden = true;
      }
    }
  }

  function updateSendButton() {
    var hasItems = Object.keys(cart).length > 0;
    var hasName = document.getElementById('customer-name').value.trim().length > 0;
    var hasOrderType = orderType !== null;
    btnSend.disabled = !(hasItems && hasName && hasOrderType);
  }

  // ════════════════════════════════════════════
  //  WHATSAPP BUILDER
  // ════════════════════════════════════════════

  function sendWhatsApp() {
    var name = document.getElementById('customer-name').value.trim();
    if (!name) return;

    var msg = 'Hola! Quiero hacer un pedido:\n\n';

    if (orderType === 'dine-in') {
      msg += '*Para Comer Aqui*\n';
    } else {
      msg += '*Para Llevar*\n';
      if (addressMode === 'location' && locationCoords) {
        msg += 'Ubicacion: https://maps.google.com/?q=' + locationCoords.lat + ',' + locationCoords.lng + '\n';
        var locRef = document.getElementById('location-ref').value.trim();
        if (locRef) msg += 'Referencia: ' + locRef + '\n';
      } else {
        var street = document.getElementById('address-street').value.trim();
        var colonia = document.getElementById('address-colonia').value.trim();
        var ref = document.getElementById('address-ref').value.trim();
        var parts = [street, colonia, ref].filter(Boolean);
        if (parts.length) {
          msg += 'Direccion: ' + parts.join(', ') + '\n';
        }
      }
    }
    msg += '\n';

    var keys = Object.keys(cart);
    for (var i = 0; i < keys.length; i++) {
      var entry = cart[keys[i]];
      var isCompound = !!entry.baseItemId;
      var subtotal;
      var itemLabel;

      if (isCompound) {
        subtotal = entry.qty * entry.item.price;
        itemLabel = entry.item.name + ' (' + entry.ingredientName + ')';
      } else {
        subtotal = calculateItemSubtotal(entry.item, entry.qty);
        itemLabel = entry.item.name;
      }

      var line = '- ' + entry.qty + 'x ' + entry.categoryName + ' ' + itemLabel + (subtotal > 0 ? ' ($' + subtotal + ')' : ' (incluida)');

      if (!isCompound && entry.item.promo && entry.qty >= entry.item.promo.qty) {
        var promoSets = Math.floor(entry.qty / entry.item.promo.qty);
        line += ' [' + promoSets + 'x promo ' + entry.item.promo.label + ']';
      }
      msg += line + '\n';
    }

    // Add grouped promo note for compound items
    var compoundBases = {};
    for (var ci = 0; ci < keys.length; ci++) {
      var ce = cart[keys[ci]];
      if (ce.baseItemId && ce.ingredientName !== 'New York') {
        if (!compoundBases[ce.baseItemId]) compoundBases[ce.baseItemId] = 0;
        compoundBases[ce.baseItemId] += ce.qty;
      }
    }
    var baseIds = Object.keys(compoundBases);
    for (var bi = 0; bi < baseIds.length; bi++) {
      var baseRef = findItemById(baseIds[bi]);
      if (!baseRef) continue;
      var qty = compoundBases[baseIds[bi]];
      var fullPrice = qty * baseRef.item.price;
      var promoPrice = calculatePromoTotal(qty, baseRef.item);
      if (promoPrice < fullPrice) {
        msg += '  [' + baseRef.item.name + ': promo aplicada — $' + promoPrice + ']\n';
      }
    }

    msg += '\n*Total: $' + calculateTotal() + '*\n';
    msg += '\nNombre: ' + name;

    var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank', 'noopener');

    var celebration = document.getElementById('sheet-celebration');
    if (celebration) {
      celebration.hidden = false;
      setTimeout(function () { celebration.hidden = true; }, 4000);
    }
  }

  // ════════════════════════════════════════════
  //  QR CODE
  // ════════════════════════════════════════════

  function initQR() {
    var qrModalCode = document.getElementById('qr-modal-code');
    var qrBtn = document.getElementById('qr-download-btn');
    var qrOverlay = document.getElementById('qr-modal-overlay');
    var qrDownload = document.getElementById('qr-modal-download');
    var qrClose = document.getElementById('qr-modal-close');

    if (!qrModalCode || typeof QRCode === 'undefined') return;

    qrModalCode.innerHTML = '';
    new QRCode(qrModalCode, {
      text: 'https://asador.ganaderiacatorce.com',
      width: 200,
      height: 200,
      colorDark: '#D4231A',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });

    qrBtn.addEventListener('click', function () {
      qrOverlay.classList.add('is-visible');
    });

    qrClose.addEventListener('click', function () {
      qrOverlay.classList.remove('is-visible');
    });

    qrOverlay.addEventListener('click', function (e) {
      if (e.target === qrOverlay) {
        qrOverlay.classList.remove('is-visible');
      }
    });

    qrDownload.addEventListener('click', function () {
      var canvas = qrModalCode.querySelector('canvas');
      if (!canvas) return;
      var link = document.createElement('a');
      link.download = 'asador-callejero-catorce-qr.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }

  // ════════════════════════════════════════════
  //  ANIMATIONS (GSAP)
  // ════════════════════════════════════════════

  function initAnimations() {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      var heroEls = document.querySelectorAll('.hero__logo, .hero__subtitle, .hero__title, .hero__tagline, .hero__hours, .hero__bottom-info, .qr-download-btn');
      heroEls.forEach(function (el) { el.style.opacity = '1'; });

      // Show all world elements immediately
      document.querySelectorAll('.menu__world-title, .menu__world-quote, .menu__category-desc, .menu__item, .salsas__subtitle').forEach(function (el) {
        el.style.opacity = '1';
      });
      document.querySelectorAll('.menu__world').forEach(function (w) { w.classList.add('is-entered'); });

      splitHeroTitle();
      document.querySelectorAll('.hero__letter').forEach(function (l) { l.style.opacity = '1'; });

      // Show/hide nav on scroll (no GSAP)
      initNavVisibility();

      // Still init swipe for navigation
      initSwipe();
      goToWorld(0);

      // Recalculate height on resize
      window.addEventListener('resize', function () { updateWorldHeight(activeWorldIndex); });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    splitHeroTitle();

    // ── Act 1: Hero entrance ──
    var heroTl = gsap.timeline({ delay: 0.3 });

    heroTl.fromTo('.hero__logo',
      { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.8, ease: 'back.out(1.7)' }
    );

    heroTl.fromTo('.hero__subtitle',
      { opacity: 0, letterSpacing: '0.4em' },
      { opacity: 1, letterSpacing: '0.15em', duration: 0.6, ease: 'power3.out' },
      '-=0.3'
    );

    heroTl.set('.hero__title', { opacity: 1 });
    heroTl.fromTo('.hero__letter',
      { opacity: 0, y: 40, rotateX: -90 },
      {
        opacity: 1, y: 0, rotateX: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: 'back.out(2.5)'
      },
      '-=0.2'
    );

    heroTl.fromTo('.hero__tagline',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
      '-=0.2'
    );

    heroTl.fromTo('.hero__tagline--top',
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
      '-=0.3'
    );

    heroTl.fromTo('.hero__bottom-info',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
      '-=0.2'
    );

    heroTl.fromTo('.qr-download-btn',
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: 'power2.out' },
      '-=0.4'
    );

    // Fade out bottom info on scroll
    var heroBottomInfo = document.querySelector('.hero__bottom-info');
    var heroSection = document.querySelector('.hero');
    if (heroBottomInfo && heroSection) {
      gsap.to(heroBottomInfo, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: heroSection,
          start: '10% top',
          end: '30% top',
          scrub: true
        }
      });
    }

    // Show/hide fixed nav when in menu section
    var menuSection = document.getElementById('menu');
    if (menuSection) {
      ScrollTrigger.create({
        trigger: menuSection,
        start: 'top 80%',
        end: 'bottom top',
        onEnter: function () { menuNav.classList.add('is-visible'); },
        onLeave: function () { menuNav.classList.remove('is-visible'); },
        onEnterBack: function () { menuNav.classList.add('is-visible'); },
        onLeaveBack: function () { menuNav.classList.remove('is-visible'); }
      });
    }

    // Section reveals (order-type, footer)
    ['.order-type', '.footer'].forEach(function (selector) {
      var el = document.querySelector(selector);
      if (!el) return;
      gsap.fromTo(el,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true }
        }
      );
    });

    // Init swipe + first world
    requestAnimationFrame(function () {
      ScrollTrigger.refresh();
      initSwipe();
      goToWorld(0);
    });

    // Recalculate height on resize
    window.addEventListener('resize', function () { updateWorldHeight(activeWorldIndex); });
  }

  function initNavVisibility() {
    var menuSection = document.getElementById('menu');
    if (!menuSection) return;
    var threshold = window.innerHeight * 0.2;
    window.addEventListener('scroll', function () {
      var rect = menuSection.getBoundingClientRect();
      var visible = rect.top <= threshold && rect.bottom > 0;
      menuNav.classList.toggle('is-visible', visible);
    }, { passive: true });
  }

  function splitHeroTitle() {
    var titleEl = document.getElementById('hero-title');
    if (!titleEl || titleEl.dataset.split === 'true') return;
    var text = titleEl.textContent.trim();
    titleEl.innerHTML = '';
    for (var i = 0; i < text.length; i++) {
      var span = document.createElement('span');
      span.className = 'hero__letter';
      span.textContent = text[i];
      titleEl.appendChild(span);
    }
    titleEl.dataset.split = 'true';
  }

})();
