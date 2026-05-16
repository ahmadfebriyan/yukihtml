// V2/bubbles.js
// Bubble notification system (SAFE for ES Modules)

function getRoot() {
  const el = document.getElementById('bubbles');

  // Guard supaya kalau DOM belum siap tidak bikin crash
  if (!el) {
    console.warn('[bubbles] container #bubbles belum ada di DOM');
    return null;
  }

  return el;
}

/**
 * Tampilkan bubble message ke layar
 * @param {string} text  - isi pesan
 * @param {string} role  - info | user | error | success
 * @param {number} ms    - lama tampil (ms)
 */
export function bubble(text, role = 'info', ms = 2200) {
  const root = getRoot();
  if (!root) return; // stop kalau belum siap

  const el = document.createElement('div');
  el.className = `bubble ${role}`;
  el.textContent = text;

  root.appendChild(el);

  // trigger animation (biar CSS transition jalan)
  requestAnimationFrame(() => {
    el.classList.add('show');
  });

  // auto remove
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 250);
  }, ms);
}
