// main.js — entry point (root)
import { cfg, history, saveHistory } from './config.js';
import { ensureModel, streamChat } from './api.js';
import { bubble } from './bubbles.js';
import { speak, onSTTText } from './voice.js';
import { initModeToggle, setMode } from './modes.js';
import { initSettings } from './settings.js';
import { initCharacter } from './character.js';
import { initBackground } from './background.js';

function wireSend() {
  const input   = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');

  onSTTText((text)=>{ input.value = text; send(); });

  async function send(){
    const text = (input.value || '').trim();
    if(!text) return;
    input.value='';
    bubble(text, 'user');
    history.push({role:'user', content:text});
    saveHistory();

    try{
      await ensureModel();
      let acc=''; for await (const tok of streamChat(history)) acc+=tok;
      history.push({role:'assistant', content:acc});
      saveHistory();
      bubble(acc, 'ai'); speak(acc);
    }catch(e){
      bubble('Gagal: '+(e?.message||e), 'ai');
    }
  }

  sendBtn?.addEventListener('click', send);
  input?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') send(); });
}

window.addEventListener('DOMContentLoaded', () => {
  try { initModeToggle(); }  catch(e){ bubble('Init mode error: '+e.message, 'info'); }
  try { initSettings(); }    catch(e){ bubble('Init settings error: '+e.message, 'info'); }
  try { initCharacter(); }   catch(e){ bubble('Init character error', 'info'); }
  try { initBackground(); }  catch(e){ bubble('Init background error', 'info'); }
  try { wireSend(); }        catch(e){ bubble('Init send error', 'info'); }
  try { setMode('chat'); }   catch(e){ bubble('Set mode error', 'info'); }
});
