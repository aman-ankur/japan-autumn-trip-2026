const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.primary-nav');
const navGroups = [...document.querySelectorAll('.nav-group')];

const closeDropdown = (group, returnFocus = false) => {
  const trigger = group?.querySelector('.nav-trigger');
  const panel = group?.querySelector('.nav-panel');
  if (!trigger || !panel) return;
  group.classList.remove('is-open');
  trigger.setAttribute('aria-expanded', 'false');
  panel.hidden = true;
  if (returnFocus) trigger.focus();
};

const closeAllDropdowns = (except) => {
  navGroups.forEach((group) => {
    if (group !== except) closeDropdown(group);
  });
};

const closeMobileNavigation = (returnFocus = false) => {
  if (!nav?.classList.contains('open')) return;
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  if (menuButton) menuButton.textContent = 'Menu';
  if (returnFocus) menuButton?.focus();
};

const openLinkedDetails = () => {
  const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  if (target?.matches('details')) target.open = true;
  target?.closest('details')?.setAttribute('open', '');
};

const updateActiveNavigation = () => {
  const hash = window.location.hash || '#top';
  nav?.querySelectorAll('[aria-current="location"]').forEach((item) => item.removeAttribute('aria-current'));
  const linkedItem = [...(nav?.querySelectorAll('a[href^="#"]') || [])].find((item) => item.hash === hash);
  if (!linkedItem) return;
  linkedItem.setAttribute('aria-current', 'location');
  linkedItem.closest('.nav-group')?.querySelector('.nav-trigger')?.setAttribute('aria-current', 'location');
};

openLinkedDetails();
updateActiveNavigation();
window.addEventListener('hashchange', () => {
  openLinkedDetails();
  updateActiveNavigation();
});

const routeVersions = document.querySelectorAll('.plan-detail-grid > .plan-detail');

const loadVersionMaps = (version) => {
  version.querySelectorAll('img[data-src]').forEach((image) => {
    image.src = image.dataset.src;
    image.removeAttribute('data-src');
  });
};

routeVersions.forEach((version) => {
  const gallery = version.querySelector('.route-map-gallery');
  if (gallery && version.open) loadVersionMaps(version);

  version.addEventListener('toggle', () => {
    if (!version.open) return;
    routeVersions.forEach((otherVersion) => {
      if (otherVersion !== version) otherVersion.open = false;
    });
    if (gallery && gallery.querySelector('img[data-src]')) loadVersionMaps(version);
  });
});

navGroups.forEach((group) => {
  const trigger = group.querySelector('.nav-trigger');
  const panel = group.querySelector('.nav-panel');
  if (!trigger || !panel) return;

  trigger.addEventListener('click', () => {
    const willOpen = !group.classList.contains('is-open');
    closeAllDropdowns(group);
    group.classList.toggle('is-open', willOpen);
    trigger.setAttribute('aria-expanded', String(willOpen));
    panel.hidden = !willOpen;
  });

  group.addEventListener('focusout', () => {
    window.requestAnimationFrame(() => {
      if (!group.contains(document.activeElement)) closeDropdown(group);
    });
  });
});

menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'Close' : 'Menu';
  if (!open) closeAllDropdowns();
});

nav?.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) return;

  const linkedTarget = link.hash ? document.getElementById(decodeURIComponent(link.hash.slice(1))) : null;
  if (linkedTarget?.matches('.plan-detail')) {
    event.preventDefault();
    linkedTarget.open = true;
    window.history.pushState(null, '', link.hash);
    updateActiveNavigation();
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => linkedTarget.scrollIntoView({ block: 'start' }));
    });
  }

  closeAllDropdowns();
  closeMobileNavigation();
});

document.addEventListener('click', (event) => {
  if (!nav?.contains(event.target)) closeAllDropdowns();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openGroup = navGroups.find((group) => group.classList.contains('is-open'));
  if (openGroup) {
    closeDropdown(openGroup, true);
    return;
  }
  closeMobileNavigation(true);
});

const foodFilters = [...document.querySelectorAll('[data-food-filter]')];
const foodCityFilters = [...document.querySelectorAll('[data-food-city-filter]')];
const foodCards = [...document.querySelectorAll('[data-food-category]')];
const foodResultCount = document.querySelector('#food-result-count');
let activeFoodFilter = 'all';
let activeCityFilter = 'all';

const updateFoodCards = () => {
  let visibleCount = 0;

  foodCards.forEach((card) => {
    const categoryMatches = activeFoodFilter === 'all' || card.dataset.foodCategory === activeFoodFilter;
    const cityMatches = activeCityFilter === 'all' || card.dataset.foodCity === activeCityFilter;
    const visible = categoryMatches && cityMatches;
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  if (foodResultCount) foodResultCount.textContent = `Showing ${visibleCount} ${visibleCount === 1 ? 'pick' : 'picks'}`;
};

const selectFoodFilter = (buttons, selectedButton) => {
  buttons.forEach((item) => {
    const selected = item === selectedButton;
    item.classList.toggle('is-active', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
};

foodFilters.forEach((button) => {
  button.addEventListener('click', () => {
    activeFoodFilter = button.dataset.foodFilter;
    selectFoodFilter(foodFilters, button);
    updateFoodCards();
  });
});

foodCityFilters.forEach((button) => {
  button.addEventListener('click', () => {
    activeCityFilter = button.dataset.foodCityFilter;
    selectFoodFilter(foodCityFilters, button);
    updateFoodCards();
  });
});

// Private details: real names are encrypted in #vault-data and swapped in after unlock.
const vaultData = document.getElementById('vault-data');
const VAULT_KEY = 'trip-vault-pass';

const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const openVault = async (passphrase) => {
  const { s, i, d } = JSON.parse(vaultData.textContent);
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(s), iterations: 600000, hash: 'SHA-256' },
    baseKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
  );
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(i) }, key, fromB64(d));
  return JSON.parse(new TextDecoder().decode(plain));
};

const applyVault = ({ t, b, h }) => {
  document.querySelectorAll('[data-vt]').forEach((el) => { el.textContent = t[el.dataset.vt]; });
  document.querySelectorAll('[data-vb]').forEach((el) => { el.outerHTML = b[el.dataset.vb]; });
  document.querySelectorAll('[data-vh]').forEach((el) => { el.href = h[el.dataset.vh]; });
  document.body.classList.add('vault-open');
};

if (vaultData && window.crypto?.subtle) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'vault-button';
  button.textContent = '🔒';
  button.setAttribute('aria-label', 'Unlock private details');
  document.body.append(button);

  const unlock = async (passphrase, remember) => {
    try {
      applyVault(await openVault(passphrase));
      if (remember) localStorage.setItem(VAULT_KEY, passphrase);
      button.textContent = '🔓';
      button.setAttribute('aria-label', 'Lock private details');
      return true;
    } catch {
      return false;
    }
  };

  button.addEventListener('click', async () => {
    if (document.body.classList.contains('vault-open')) {
      localStorage.removeItem(VAULT_KEY);
      location.reload();
      return;
    }
    const passphrase = prompt('Passphrase');
    if (passphrase && !(await unlock(passphrase, true))) alert('Wrong passphrase');
  });

  const saved = localStorage.getItem(VAULT_KEY);
  if (saved) unlock(saved, false).then((ok) => { if (!ok) localStorage.removeItem(VAULT_KEY); });
}
