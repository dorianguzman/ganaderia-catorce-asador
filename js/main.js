/* ===== Asador Callejero Catorce — Main JS ===== */

(function () {
  'use strict';

  // ── Config ──
  var WHATSAPP_NUMBER = '5214461060320';
  var SWIPE_THRESHOLD = 50;
  var SWIPE_LOCK_MS = 450;

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
  document.addEventListener('DOMContentLoaded', init);

  function init() {
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
    if (item.promo) {
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
    if (action === 'plus') addToCart(id);
    if (action === 'minus') removeFromCart(id);
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
      gsap.to(menuWorlds, { height: targetHeight, duration: 0.35, ease: 'power2.out' });
    } else {
      menuWorlds.style.height = targetHeight + 'px';
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
    updateWorldHeight(activeWorldIndex);
  }

  function updateCartUI(changedId) {
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
    for (var i = 0; i < keys.length; i++) {
      var entry = cart[keys[i]];
      total += calculateItemSubtotal(entry.item, entry.qty);
    }
    return total;
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

    sheetItems.innerHTML = entries.map(function (entry) {
      var subtotal = calculateItemSubtotal(entry.item, entry.qty);
      var detail = entry.categoryName;
      if (entry.item.promo && entry.qty >= entry.item.promo.qty) {
        var promoSets = Math.floor(entry.qty / entry.item.promo.qty);
        detail += ' (' + promoSets + 'x promo)';
      }
      return '<div class="sheet-item">' +
        '<div class="sheet-item__info">' +
          '<div class="sheet-item__name">' + entry.item.name + '</div>' +
          '<div class="sheet-item__detail">' + detail + '</div>' +
        '</div>' +
        '<div class="sheet-item__stepper">' +
          '<button class="stepper__btn stepper__btn--minus" data-sheet-action="minus" data-id="' + entry.item.id + '" aria-label="Quitar uno">−</button>' +
          '<span class="stepper__count">' + entry.qty + '</span>' +
          '<button class="stepper__btn stepper__btn--plus" data-sheet-action="plus" data-id="' + entry.item.id + '" aria-label="Agregar uno">+</button>' +
        '</div>' +
        '<span class="sheet-item__subtotal">' + (subtotal > 0 ? '$' + subtotal : 'Incluida') + '</span>' +
      '</div>';
    }).join('');

    sheetItems.querySelectorAll('.stepper__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.id;
        var action = btn.dataset.sheetAction;
        if (action === 'plus') addToCart(id);
        if (action === 'minus') removeFromCart(id);
        renderSheet();
      });
    });

    sheetTotalValue.textContent = '$' + calculateTotal();
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
      var subtotal = calculateItemSubtotal(entry.item, entry.qty);
      var line = '- ' + entry.qty + 'x ' + entry.categoryName + ' ' + entry.item.name + (subtotal > 0 ? ' ($' + subtotal + ')' : ' (incluida)');
      if (entry.item.promo && entry.qty >= entry.item.promo.qty) {
        var promoSets = Math.floor(entry.qty / entry.item.promo.qty);
        line += ' [' + promoSets + 'x promo ' + entry.item.promo.label + ']';
      }
      msg += line + '\n';
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
