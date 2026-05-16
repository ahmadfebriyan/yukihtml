export const cfg = {
  apiBase: localStorage.getItem('yuki_apiBase') || '/v1',
  modelId: localStorage.getItem('yuki_modelId') || '',
  systemPrompt: localStorage.getItem('yuki_systemPrompt') ||
    'Kamu adalah YUKI, asisten AI 2D ringan. Indonesia natural & ringkas. Sapa "kak Febri" saat pas.'
};

export const history = JSON.parse(localStorage.getItem('yuki_history') || '[]');
if (!history.length) history.push({ role: 'system', content: cfg.systemPrompt });

export const saveCfg = () => {
  localStorage.setItem('yuki_apiBase', cfg.apiBase);
  localStorage.setItem('yuki_systemPrompt', cfg.systemPrompt);
  if (cfg.modelId) localStorage.setItem('yuki_modelId', cfg.modelId);
};
export const saveHistory = () =>
  localStorage.setItem('yuki_history', JSON.stringify(history));
export const resetAll = () => {
  ['yuki_apiBase','yuki_modelId','yuki_systemPrompt','yuki_history']
    .forEach(k=>localStorage.removeItem(k));
};

export const join = (b,p)=>`${String(b).replace(/\/+$/,'')}/${String(p).replace(/^\/+/,'')}`;
