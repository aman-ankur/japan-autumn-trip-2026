const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('nav');

const openLinkedDetails = () => {
  const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  if (target?.matches('details')) target.open = true;
  target?.closest('details')?.setAttribute('open', '');
};

openLinkedDetails();
window.addEventListener('hashchange', openLinkedDetails);

menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'Close' : 'Menu';
});

nav?.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    if (menuButton) menuButton.textContent = 'Menu';
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav?.classList.contains('open')) {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    if (menuButton) menuButton.textContent = 'Menu';
    menuButton?.focus();
  }
});
