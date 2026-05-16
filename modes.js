import { startSTT, stopSTT } from './voice.js';

const card = document.getElementById('card');
const modeBtn = document.getElementById('modeBtn');
const modeIcon = document.getElementById('modeIcon');
const modeLabel= document.getElementById('modeLabel');

export function setMode(mode){ // 'speak'|'chat'
  card.classList.remove('speak','chat');
  card.classList.add(mode);
  if (mode === 'speak') {
    modeLabel.textContent = 'Speak';
    modeIcon.innerHTML = '<rect x="9" y="3" width="6" height="10" rx="3" fill="currentColor"></rect><path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke="currentColor" stroke-width="2"></path><path d="M12 18v3" stroke="currentColor" stroke-width="2"></path>';
    startSTT();
  } else {
    modeLabel.textContent = 'Chat';
    modeIcon.innerHTML = '<path d="M4 5h16v10H8l-4 4V5Z" fill="none" stroke="currentColor" stroke-width="2"></path>';
    stopSTT();
  }
}

export function initModeToggle(){
  modeBtn.addEventListener('click', ()=>{
    const next = card.classList.contains('chat') ? 'speak' : 'chat';
    setMode(next);
  });
}
