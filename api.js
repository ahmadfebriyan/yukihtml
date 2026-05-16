import { cfg, join } from './config.js';

export async function ensureModel(){
  if (cfg.modelId) return cfg.modelId;
  const r = await fetch(join(cfg.apiBase, '/models'));
  const j = await r.json();
  const first = j?.data?.[0]?.id;
  if (!first) throw new Error('Model tidak ditemukan');
  cfg.modelId = first;
  localStorage.setItem('yuki_modelId', first);
  return first;
}

export async function* streamChat(messages){
  const url = join(cfg.apiBase, '/chat/completions');
  const res = await fetch(url, {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer lm-studio'},
    body: JSON.stringify({ model: cfg.modelId, messages, stream:true, temperature:0.7 })
  });
  if(!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder('utf-8');
  let buf='';
  while(true){
    const {value,done} = await reader.read();
    if(done) break;
    buf += dec.decode(value,{stream:true});
    const parts = buf.split('\n\n'); buf = parts.pop() || '';
    for(const p of parts){
      const line = p.trim(); if(!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      try{
        const j = JSON.parse(data);
        const d = j.choices?.[0]?.delta?.content || '';
        if (d) yield d;
      }catch{}
    }
  }
}
