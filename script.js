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
