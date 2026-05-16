import { bubble } from './bubbles.js';

const viz = document.getElementById('viz');
const vizCore = viz.querySelector('.core');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let rec=null, listening=false, audioStream=null, analyser=null, rafId=null;

export function isListening(){ return listening; }

export async function startSTT(){
  if(!SpeechRecognition){ bubble('STT butuh browser & HTTPS','info'); return; }
  if(listening) return;

  try{
    audioStream = await navigator.mediaDevices.getUserMedia({ audio:true });
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const src = ctx.createMediaStreamSource(audioStream);
    analyser = ctx.createAnalyser(); analyser.fftSize = 512;
    src.connect(analyser); meterLoop();
  }catch{}

  rec = new SpeechRecognition();
  rec.lang='id-ID'; rec.continuous=false; rec.interimResults=true;
  rec.onstart=()=>{listening=true; viz.style.display='grid';};
  rec.onend=()=>{listening=false; viz.style.display='none'; stopMeter(true);};
  rec.onresult=(e)=>{
    let final=''; 
    for(let i=e.resultIndex;i<e.results.length;i++){
      const t=e.results[i][0].transcript;
      if(e.results[i].isFinal) final+=t;
    }
    if(final.trim()) onText(final.trim());
  };
  rec.start();
}

export function stopSTT(){ try{ if(rec&&listening) rec.stop(); stopMeter(true); }catch{} }

function stopMeter(force){
  if(rafId){ cancelAnimationFrame(rafId); rafId=null; }
  if(force && audioStream){ try{ audioStream.getTracks().forEach(t=>t.stop()); }catch{} audioStream=null; }
}
function meterLoop(){
  if(!analyser) return;
  const data = new Uint8Array(analyser.frequencyBinCount);
  const tick = () => {
    if(!analyser) return;
    analyser.getByteTimeDomainData(data);
    let sum=0; for(let i=0;i<data.length;i++){ const v=(data[i]-128)/128; sum+=v*v; }
    const rms = Math.sqrt(sum/data.length);
    const s = 1 + Math.min(0.6, rms*3);
    vizCore.style.transform = `scale(${s.toFixed(3)})`;
    rafId = requestAnimationFrame(tick);
  };
  tick();
}

// STT callback (set dari main)
let onText = ()=>{};
export function onSTTText(fn){ onText = fn; }

// TTS — aman, pakai preferensi bila ada
export function speak(text){
  try{
    if(!('speechSynthesis' in window)) return;

    // kick/resume (autoplay policy)
    try { window.speechSynthesis.resume(); } catch {}
    try {
      const prim = new SpeechSynthesisUtterance(' ');
      prim.volume = 0; window.speechSynthesis.speak(prim);
      window.speechSynthesis.cancel();
    } catch {}

    const u = new SpeechSynthesisUtterance(text);
    const idx   = parseInt(localStorage.getItem('yuki_voiceIndex') || '0', 10);
    const rate  = parseFloat(localStorage.getItem('yuki_rate')  || '1');
    const pitch = parseFloat(localStorage.getItem('yuki_pitch') || '1');

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices[idx]) u.voice = voices[idx];
    if (!isNaN(rate))  u.rate  = rate;
    if (!isNaN(pitch)) u.pitch = pitch;

    window.speechSynthesis.speak(u);
  }catch{}
}

