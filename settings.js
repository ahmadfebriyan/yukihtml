import { cfg, saveCfg, resetAll, join } from './config.js';
import { bubble } from './bubbles.js';

const dlg = document.getElementById('settings');
const openBtn = document.getElementById('settingsBtn');
const closeBtn= document.getElementById('closeSettings');

const apiBaseEl = document.getElementById('apiBase');
const modelIdEl = document.getElementById('modelId'); // hidden
const systemPromptEl = document.getElementById('systemPrompt');
const testBtn = document.getElementById('testBtn');
const autoBtn = document.getElementById('autoBtn');
const resetBtn= document.getElementById('resetBtn');
const saveBtn = document.getElementById('saveBtn');

// Tabs
const tabBtns = [
  document.getElementById('tabGeneralBtn'),
  document.getElementById('tabConnBtn'),
  document.getElementById('tabVoiceBtn'),
  document.getElementById('tabAppearBtn'),
];
const pages = Array.from(document.querySelectorAll('.oa-page'));

function dialogFallback(){
  const supportsDialog =
    typeof window.HTMLDialogElement !== 'undefined' &&
    typeof HTMLDialogElement.prototype.showModal === 'function';
  if (!supportsDialog) {
    dlg.showModal = function(){ this.setAttribute('open',''); };
    dlg.close = function(){ this.removeAttribute('open'); };
  }
}

function activateTab(name){
  tabBtns.forEach(btn=>{
    const active = btn?.dataset?.tab === name;
    btn?.classList.toggle('active', !!active);
  });
  pages.forEach(p=>{
    p.classList.toggle('hidden', p.dataset.tab !== name);
  });
  if (name === 'voice') lazyInitVoiceUI(); // <- hanya init voice ketika tab Voice dibuka
}

export function initSettings(){
  dialogFallback();

  openBtn.addEventListener('click', ()=>{
    try{
      apiBaseEl.value = cfg.apiBase;
      systemPromptEl.value = cfg.systemPrompt;
      activateTab('general');
      dlg.showModal();
    }catch(e){ bubble('Tidak bisa buka Settings','info'); }
  });

  closeBtn.addEventListener('click', ()=> { try{ dlg.close(); }catch{} });

  dlg.addEventListener('click', (e)=>{
    try{
      const box = dlg.querySelector('.oa-panel').getBoundingClientRect();
      if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) dlg.close();
    }catch{}
  });

  // switch tab
  tabBtns.forEach(btn=>{
    btn?.addEventListener('click', ()=> {
      try{ activateTab(btn.dataset.tab); }catch{}
    });
  });

  // API actions
  testBtn?.addEventListener('click', async ()=>{
    try{
      const base = (apiBaseEl.value.trim() || cfg.apiBase);
      const r = await fetch(join(base, '/models'));
      bubble(r.ok ? 'Tes koneksi: OK' : `Tes koneksi: HTTP ${r.status}`, 'info');
    }catch{ bubble('Tes koneksi: gagal', 'info'); }
  });

  autoBtn?.addEventListener('click', async ()=>{
    try{
      const base = (apiBaseEl.value.trim() || cfg.apiBase);
      const r = await fetch(join(base, '/models')); const j = await r.json();
      const first = j?.data?.[0]?.id;
      bubble(first ? 'Model: '+first : 'Tidak ada model', 'info');
      if(first) modelIdEl.value = first;
    }catch{ bubble('Gagal ambil /models', 'info'); }
  });

  resetBtn?.addEventListener('click', ()=>{
    try{ resetAll(); bubble('Reset OK','info'); }catch{}
  });

  saveBtn?.addEventListener('click', async (e)=>{
    e.preventDefault();
    try{
      cfg.apiBase = apiBaseEl.value.trim() || cfg.apiBase;
      cfg.systemPrompt = systemPromptEl.value.trim() || cfg.systemPrompt;
      saveCfg();
      try{
        const r = await fetch(join(cfg.apiBase, '/models')); const j = await r.json();
        const first = j?.data?.[0]?.id;
        if(first){ cfg.modelId = first; localStorage.setItem('yuki_modelId', first); bubble('Tersimpan & model terdeteksi','info'); }
        else bubble('Tersimpan (model tidak terdeteksi)','info');
      }catch{ bubble('Tersimpan (deteksi model gagal)','info'); }
      dlg.close();
    }catch{ bubble('Gagal menyimpan','info'); }
  });
}

/* ----------------- VOICE TAB (lazy + robust) ----------------- */
let voiceInited = false;

function lazyInitVoiceUI(){
  if (voiceInited) return;
  voiceInited = true;

  try{
    const voiceSelect = document.getElementById('voiceSelect');
    const rateEl      = document.getElementById('voiceRate');
    const pitchEl     = document.getElementById('voicePitch');
    const rateVal     = document.getElementById('rateVal');
    const pitchVal    = document.getElementById('pitchVal');
    const previewBtn  = document.getElementById('voicePreview');
    const stopBtn     = document.getElementById('voiceStop');
    const reloadBtn   = document.getElementById('voiceReload');
    const infoEl      = document.getElementById('voiceInfo');
    const sampleEl    = document.getElementById('voiceSample');

    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      if (voiceSelect) voiceSelect.innerHTML = '<option>(TTS tidak didukung)</option>';
      if (infoEl) infoEl.textContent = 'Browser tidak mendukung Speech Synthesis, atau situs tidak HTTPS.';
      return;
    }

    // --- helpers ---
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
    const unlockTTS = () => {
      // beberapa browser butuh "kick"
      try {
        window.speechSynthesis.resume();
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0; // senyap
        window.speechSynthesis.speak(u);
        window.speechSynthesis.cancel();
      } catch {}
    };

    const awaitVoices = async (tries=30) => {
      for (let i=0;i<tries;i++){
        const list = window.speechSynthesis.getVoices() || [];
        if (list.length) return list;
        window.speechSynthesis.getVoices(); // trigger load
        await new Promise(r=>setTimeout(r,150));
      }
      return [];
    };

    async function fillVoices(){
      unlockTTS();
      const voices = await awaitVoices();
      if (!voices.length){
        voiceSelect.innerHTML = '<option value="">(Voices belum siap)</option>';
        infoEl.textContent = isSecure ? 'Klik Preview/Reload setelah 1–2 detik.' : 'Aktifkan HTTPS atau gunakan /v1 same-origin.';
        return;
      }
      voiceSelect.innerHTML = voices.map((v,i)=>`<option value="${i}">${v.name} (${v.lang})${v.default?' — default':''}</option>`).join('');
      const savedIdx = localStorage.getItem('yuki_voiceIndex');
      if (savedIdx && voices[savedIdx]) voiceSelect.value = savedIdx;
      infoEl.textContent = `${voices.length} voice terdeteksi`;
    }

    // restore nilai ui
    let rate  = parseFloat(localStorage.getItem('yuki_rate'))  || 1;
    let pitch = parseFloat(localStorage.getItem('yuki_pitch')) || 1;
    rateEl.value = rate;   rateVal.textContent = rate.toFixed(1);
    pitchEl.value = pitch; pitchVal.textContent = pitch.toFixed(1);
    sampleEl.value = localStorage.getItem('yuki_voiceSample') || sampleEl.value;

    // load pertama + listener perubahan
    fillVoices();
    window.speechSynthesis.onvoiceschanged = () => { fillVoices(); };

    // events ui
    voiceSelect.addEventListener('change', ()=> {
      localStorage.setItem('yuki_voiceIndex', voiceSelect.value);
    });
    rateEl.addEventListener('input', ()=>{
      rate = parseFloat(rateEl.value); rateVal.textContent = rate.toFixed(1);
      localStorage.setItem('yuki_rate', rate);
    });
    pitchEl.addEventListener('input', ()=>{
      pitch = parseFloat(pitchEl.value); pitchVal.textContent = pitch.toFixed(1);
      localStorage.setItem('yuki_pitch', pitch);
    });
    sampleEl.addEventListener('input', ()=>{
      localStorage.setItem('yuki_voiceSample', sampleEl.value);
    });

    reloadBtn?.addEventListener('click', ()=> fillVoices());
    stopBtn?.addEventListener('click', ()=> { try{ window.speechSynthesis.cancel(); }catch{} });

    previewBtn?.addEventListener('click', async ()=>{
      try{
        unlockTTS(); // pastikan autoplay unblocked
        const voices = await awaitVoices();
        if (!voices.length){ infoEl.textContent = 'Voices belum siap'; return; }
        const idx = parseInt(voiceSelect.value || '0', 10);
        const utter = new SpeechSynthesisUtterance(sampleEl.value || 'Halo, ini contoh suara.');
        utter.voice = voices[idx] || null;
        utter.rate  = rate;
        utter.pitch = pitch;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      }catch{}
    });

  }catch(e){
    // jangan matikan app kalau error
    console.error('Voice init error', e);
  }
}
