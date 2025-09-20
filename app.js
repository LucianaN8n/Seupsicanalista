(function(){
  const $ = (sel, el=document)=>el.querySelector(sel);
  const form = $('#anamneseForm');
  const resultadoSection = $('#resultadoSection');
  const resultadoEl = $('#resultado');
  const anoEl = $('#ano'); if(anoEl) anoEl.textContent = new Date().getFullYear();
  const queixasEl = $('#queixas');
  const perguntasCard = $('#perguntasCard');
  const listaPerguntas = $('#listaPerguntas');
  const userEmailEl = $('#userEmail');
  const btnLogin = $('#btnLogin');
  const btnLogout = $('#btnLogout');
  const badgeLimite = $('#badgeLimite');

  function escapeHtml(s){ return String(s||'').replace(/[&<>\"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
  function nl2br(s){ return String(s).replace(/\n/g,'<br>'); }

  // Identity
  function updateAuthUI(user){
    if(user){
      userEmailEl.textContent = user.email || 'Conectado';
      btnLogin.classList.add('hidden'); btnLogout.classList.remove('hidden');
      atualizarContagem(); carregarConta(); checkAdmin();
    }else{
      userEmailEl.textContent = 'Não conectado';
      btnLogin.classList.remove('hidden'); btnLogout.classList.add('hidden');
      badgeLimite.textContent = '0/3 hoje';
      const panel = document.getElementById('adminPanel'); if(panel) panel.style.display='none';
    }
  }
  function getCurrentUser(){ try{ return netlifyIdentity?.currentUser() || null; }catch{ return null; } }
  async function getJWT(){ const u = getCurrentUser(); if(!u) return null; try{ return await u.jwt(); }catch{ return null; } }
  window.netlifyIdentity?.on('init', updateAuthUI);
  window.netlifyIdentity?.on('login', user=>{ updateAuthUI(user); netlifyIdentity.close(); });
  window.netlifyIdentity?.on('logout', ()=> updateAuthUI(null));
  btnLogin?.addEventListener('click', ()=> netlifyIdentity?.open());
  btnLogout?.addEventListener('click', ()=> netlifyIdentity?.logout());

  // Perguntas automáticas ao finalizar a queixa
  const qsBase = [
    'Quando isso começou? Qual gatilho mais recente?',
    'O que piora e o que alivia? O que você evita por causa disso?',
    'Onde aparece no corpo? Em que cenas isso se repete?',
    'Se essa sensação pudesse falar, o que diria? De quem é essa voz?'
  ];
  function pick3(a){ const x=a.slice(),o=[]; while(x.length&&o.length<3){ o.push(x.splice(Math.floor(Math.random()*x.length),1)[0]); } return o; }
  function refreshPerguntas(){
    const text = (queixasEl?.value||'').trim();
    if(!text){ perguntasCard?.classList.add('hidden'); listaPerguntas.innerHTML=''; return; }
    const qs = pick3(qsBase);
    listaPerguntas.innerHTML = qs.map(q=>`<li>${escapeHtml(q)}</li>`).join('');
    perguntasCard?.classList.remove('hidden');
  }
  queixasEl?.addEventListener('blur', refreshPerguntas);
  queixasEl?.addEventListener('change', refreshPerguntas);

  // Scales
  const gad7Items = [
    'Sentir-se nervoso(a), ansioso(a) ou no limite',
    'Não conseguir parar de se preocupar',
    'Preocupar-se excessivamente com diferentes coisas',
    'Dificuldade para relaxar',
    'Sentir-se tão inquieto(a) que é difícil ficar parado(a)',
    'Ficar facilmente irritado(a) ou aborrecido(a)',
    'Sentir medo como se algo horrível fosse acontecer'
  ];
  const phq9Items = [
    'Pouco interesse ou prazer em fazer as coisas',
    'Sentir-se para baixo, deprimido(a) ou sem esperança',
    'Dificuldade para pegar no sono ou permanecer dormindo, ou dormir demais',
    'Cansaço ou pouca energia',
    'Pouco apetite ou comer demais',
    'Sentir-se mal consigo mesmo(a) — ou que é um fracasso ou decepcionou sua família',
    'Dificuldade para se concentrar em coisas, como ler o jornal ou ver TV',
    'Andar devagar ou falar tão devagar que outras pessoas possam ter notado. Ou o oposto — estar tão agitado(a) que é mais do que o normal',
    'Pensamentos de que seria melhor estar morto(a) ou de se machucar de alguma forma'
  ];
  function buildScaleGrid(){
    const gadGrid = document.querySelector('[data-scale="gad7"]');
    const phqGrid = document.querySelector('[data-scale="phq9"]');
    if(gadGrid){ gad7Items.forEach((label, i)=> gadGrid.insertAdjacentHTML('beforeend', itemHTML('gad7', i, label))); }
    if(phqGrid){ phq9Items.forEach((label, i)=> phqGrid.insertAdjacentHTML('beforeend', itemHTML('phq9', i, label))); }
  }
  function itemHTML(prefix, idx, label){
    return `<div class="scale-item">
      <div style="flex:1">${escapeHtml(label)}</div>
      <div>
        ${[0,1,2,3].map(v=>`<label><input type="radio" name="${prefix}_${idx}" value="${v}"> ${v}</label>`).join(' ')}
      </div>
    </div>`;
  }
  function readScale(prefix, n){
    let sum = 0, answered = 0;
    for(let i=0;i<n;i++){
      const sel = document.querySelector(`input[name="${prefix}_${i}"]:checked`);
      if(sel){ sum += Number(sel.value); answered++; }
    }
    return {sum, answered};
  }
  function classifyGAD7(sum){ if(sum<=4) return 'mínima'; if(sum<=9) return 'leve'; if(sum<=14) return 'moderada'; return 'grave'; }
  function classifyPHQ9(sum){ if(sum<=4) return 'mínima'; if(sum<=9) return 'leve'; if(sum<=14) return 'moderada'; if(sum<=19) return 'moderadamente grave'; return 'grave'; }

  // ===== Psicanálise aprofundada =====
  function inferDefesas(text){
    const d=[];
    if(/evita|foge|adi|procrast|controle/i.test(text)) d.push('Evitação/controle');
    if(/culpa|auto.?cr[ií]tica|perfe/i.test(text)) d.push('Formação reativa/perfeccionismo');
    if(/raiva|explod|irrit|impaci/i.test(text)) d.push('Acting out/descarga agressiva');
    if(/despersonal|desreal/i.test(text)) d.push('Dissociação leve');
    if(!d.length) d.push('Defesas a especificar nas primeiras sessões');
    return d;
  }
  function eixoMetapsicologico(text){
    const estrut = /psicose|alucina|vozes/i.test(text) ? 'limítrofe/psicótico' : /perfeccion|controle|rigidez/i.test(text) ? 'neurose obsessiva' : /impulso|instabil|autoagress/i.test(text) ? 'limítrofe' : 'neurótico';
    const dinam = /culpa|auto.?acus|exig[ií]r/i.test(text) ? 'Superego severo — autoacusação' : /abandono|rejei/i.test(text) ? 'Angústias de abandono' : 'Conflitos eu–outro e ideal do eu';
    const econ = /ins[oô]ni|taquicard|hipervigi|p[aâ]nico|som[aá]t/i.test(text) ? 'Excitação elevada (ANS alto)' : 'Excitação moderada';
    const topico = /corpo|sensação|dor/i.test(text) ? 'Pré-consciente ↔ somático' : 'Pré-consciente ↔ inconsciente (cenas repetidas)';
    return { estrut, dinam, econ, topico };
  }
  function perguntasAvancadas(text){
    const out = [
      'Qual cena específica mais representa sua queixa? Quem está lá, e qual pedido fica sem resposta?',
      'O que fica proibido para você quando isso aparece (desejos, gestos, palavras)?',
      'O que você teme que eu (terapeuta) pense de você quando conta isso?'
    ];
    if(/trauma|abuso|viol[eê]ncia/i.test(text)){
      out.push('Quando o corpo sente que está em perigo hoje, a que lembrança ele volta (mesmo que difusa)?');
      out.push('O que te dá 10% de segurança agora? Vamos nomear juntos.');
    }
    if(/relacion|fam[ií]li|parceir|ci[úu]me/i.test(text)){
      out.push('Que frase sua costuma acender briga? O que você gostaria que fosse ouvido nela?');
    }
    if(/somat|dor|pele|gastr|enxaquec/i.test(text)){
      out.push('Qual emoção antecede o sintoma no corpo? O que estava acontecendo 2–3 minutos antes?');
    }
    return out.slice(0,5);
  }
  function planoPsicanaliticoProfundo(data){
    const {nome, idade, queixas, gad7, phq9} = data;
    const defs = inferDefesas(queixas);
    const eixo = eixoMetapsicologico(queixas);
    const perguntas = perguntasAvancadas(queixas);
    const metas = [
      'Reduzir sofrimento-alvo (0–10) em 30–40% nas primeiras 4–6 semanas.',
      'Favorecer simbolização: transformar descarga em narrativa com sentido.',
      'Mapear cenas repetitivas e deslocar padrões defensivos por escolhas mais funcionais.'
    ];
    const micro = [
      'Nomeação de afetos + “onde no corpo” (âncora sensorial).',
      'Pontuações curtas do padrão repetitivo (“a cena se repete quando…”).',
      'Interpretações graduadas, do descritivo ao conflitivo (sem antecipar).',
      'Experiência corretiva entre sessões: pequenos ensaios em cenas-alvo.',
    ];
    let html = `<div class="kv">
      <div><strong>Paciente</strong></div><div>${escapeHtml(nome)} (${idade} anos)</div>
      <div><strong>Queixas</strong></div><div>${nl2br(escapeHtml(queixas))}</div>
    </div>`;
    html += `<h3 class="section-title">Fórmula do Caso</h3>
      <ul>
        <li><strong>Padrão atual:</strong> ${escapeHtml(queixas.slice(0,220))}${queixas.length>220?'...':''}</li>
        <li><strong>Defesas predominantes:</strong> ${defs.map(escapeHtml).join(', ')}</li>
        <li><strong>Eixo metapsicológico:</strong> Estrutural: ${escapeHtml(eixo.estrut)}; Dinâmico: ${escapeHtml(eixo.dinam)}; Econômico: ${escapeHtml(eixo.econ)}; Tópico: ${escapeHtml(eixo.topico)}</li>
      </ul>`;
    if(gad7||phq9){
      html += `<h3 class="section-title">Marcadores de acompanhamento</h3><ul>`;
      if(gad7) html += `<li>GAD-7: ${gad7.sum} (${escapeHtml(gad7.class)}) — monitoramento semanal</li>`;
      if(phq9) html += `<li>PHQ-9: ${phq9.sum} (${escapeHtml(phq9.class)}) — monitoramento quinzenal</li>`;
      html += `</ul>`;
    }
    html += `<h3 class="section-title">Hipóteses de Transferência/Contratransferência</h3>
    <ul>
      <li>Transferência: expectativa de ${/abandono|rejei/i.test(queixas)?'abandono/não-resposta':'crítica ou controle'} do terapeuta.</li>
      <li>Contratransferência: risco de ${/controle|perfe/i.test(queixas)?'hiper-direcionar e coludir com perfeccionismo':'responder ao apelo de resgate/explicações em excesso'} — manter enquadre e ritmo do paciente.</li>
    </ul>`;
    html += `<h3 class="section-title">Foco do Tratamento (primeiras 4–6 semanas)</h3>
    <ul>
      <li>Escolher <strong>1–2 cenas-alvo</strong> que concentram o padrão.</li>
      <li>Construir <strong>linguagem comum</strong> para afetos e sinais físicos.</li>
      <li>Testar <strong>alternativas microcomportamentais</strong> nas cenas (pausa, pedir, dizer “não”, tolerar incerteza).</li>
    </ul>`;
    html += `<h3 class="section-title">Microtécnica</h3><ul>` + micro.map(m=>`<li>${escapeHtml(m)}</li>`).join('') + `</ul>`;
    html += `<h3 class="section-title">Perguntas Clínicas Avançadas</h3><ol>` + perguntas.map(q=>`<li>${escapeHtml(q)}</li>`).join('') + `</ol>`;
    html += `<h3 class="section-title">Plano de Sessões (1–4)</h3>
    <ol>
      <li><strong>S1</strong>: ancoragem corporal + cena índice; mapa rápido de defesas; contrato de foco.</li>
      <li><strong>S2</strong>: reconstrução da cena; nomear desejo/medo; ensaio de resposta mínima diferente.</li>
      <li><strong>S3</strong>: trabalhar eco antigo (sem sobreinterpretar); ajustar exposição/ensaio.</li>
      <li><strong>S4</strong>: rever indicadores; consolidar script; prevenir recaída (gatilhos e respostas).</li>
    </ol>`;
    html += `<h3 class="section-title">Metas</h3><ul>` + metas.map(m=>`<li>${escapeHtml(m)}</li>`).join('') + `</ul>`;
    return html;
  }

  // ===== Notas criptografadas (AES-GCM via WebCrypto) =====
  async function deriveKey(passphrase, saltBase64){
    const enc = new TextEncoder();
    const salt = saltBase64 ? Uint8Array.from(atob(saltBase64), c=>c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
    const saltB64 = saltBase64 || btoa(String.fromCharCode(...salt));
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name:'PBKDF2', salt, iterations: 120000, hash:'SHA-256' },
      keyMaterial,
      { name:'AES-GCM', length:256 },
      false,
      ['encrypt','decrypt']
    );
    return { key, saltB64 };
  }
  async function encryptNote(passphrase, plaintext){
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const { key, saltB64 } = await deriveKey(passphrase);
    const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, enc.encode(plaintext));
    const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ct)));
    const ivB64 = btoa(String.fromCharCode(...iv));
    return { ciphertext: ctB64, iv: ivB64, salt: saltB64 };
  }
  async function decryptNote(passphrase, ciphertext, ivB64, saltB64){
    const dec = new TextDecoder();
    const iv = Uint8Array.from(atob(ivB64), c=>c.charCodeAt(0));
    const ct = Uint8Array.from(atob(ciphertext), c=>c.charCodeAt(0));
    const { key } = await deriveKey(passphrase, saltB64);
    const pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, ct);
    return dec.decode(pt);
  }

  // Limites
  async function atualizarContagem(){
    const token = await getJWT(); if(!token) return;
    const r = await fetch('/.netlify/functions/limite?scope=all', { headers:{ authorization:`Bearer ${token}` } });
    if(!r.ok) return;
    const data = await r.json();
    badgeLimite.textContent = `${data.count||0}/${data.daily_limit||3} hoje`;
    const pn = $('#planoNome'), plim = $('#planoLimites'), uH = $('#usoHoje'), lD = $('#limiteDia'), uM = $('#usoMes'), lM = $('#limiteMes');
    if(pn) pn.textContent = (data.plan||'basic').toUpperCase();
    if(plim) plim.textContent = `• limites: ${data.daily_limit}/dia, ${data.monthly_limit}/mês`;
    if(uH) uH.textContent = data.count || 0;
    if(lD) lD.textContent = data.daily_limit || 0;
    if(uM) uM.textContent = data.month_count || 0;
    if(lM) lM.textContent = data.monthly_limit || 0;
  }
  async function checarLimite(){
    const token = await getJWT(); if(!token){ alert('Entre na sua conta para gerar planos.'); return false; }
    const r = await fetch('/.netlify/functions/limite', { method:'POST', headers:{ authorization:`Bearer ${token}` } });
    if (r.status === 429){
      const d = await r.json().catch(()=>({}));
      badgeLimite.textContent = `${d.count||0}/${d.daily_limit||0} hoje`;
      alert(d.reason==='monthly' ? 'Você atingiu o limite MENSAL do seu plano.' : 'Você atingiu o limite DIÁRIO do seu plano.');
      return false;
    }
    if (!r.ok){ alert('Falha ao checar limite.'); return false; }
    const data = await r.json(); badgeLimite.textContent = `${data.count||0}/${data.daily_limit||0} hoje`; atualizarContagem(); return true;
  }

  // Upgrade/Downgrade
  $('#btnUpgrade')?.addEventListener('click', async ()=>{
    const token = await getJWT(); if(!token) return alert('Faça login.');
    const r = await fetch('/.netlify/functions/plan', { method:'POST', headers:{ authorization:`Bearer ${token}`, 'content-type':'application/json' }, body: JSON.stringify({ plan:'pro' }) });
    if(r.ok){ alert('Plano PRO ativado.'); atualizarContagem(); } else { alert('Falha no upgrade.'); }
  });
  $('#btnDowngrade')?.addEventListener('click', async ()=>{
    const token = await getJWT(); if(!token) return alert('Faça login.');
    const r = await fetch('/.netlify/functions/plan', { method:'POST', headers:{ authorization:`Bearer ${token}`, 'content-type':'application/json' }, body: JSON.stringify({ plan:'basic' }) });
    if(r.ok){ alert('Plano Básico ativado.'); atualizarContagem(); } else { alert('Falha ao alterar plano.'); }
  });

  // Submit
  form?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if(!(await checarLimite())) return;
    const g = readScale('gad7',7), p = readScale('phq9',9);
    const gad7 = g.answered ? {sum:g.sum, answered:g.answered, class: classifyGAD7(g.sum)} : null;
    const phq9 = p.answered ? {sum:p.sum, answered:p.answered, class: classifyPHQ9(p.sum)} : null;
    const nome = ($('#anamneseForm [name="nome"]')?.value||'').trim();
    const idade = Number($('#anamneseForm [name="idade"]')?.value)||0;
    const queixas = ($('#anamneseForm [name="queixas"]')?.value||'').trim();

    const html = planoPsicanaliticoProfundo({nome, idade, queixas, gad7, phq9});
    const tagsRaw = (document.getElementById('tagsCaso')?.value||'').trim();
    const chips = tagsRaw? `<div class='section-title'>Tags</div><div>`+tagsRaw.split(',').map(t=>`<span class='badge'>${escapeHtml(t.trim())}</span>`).join(' ')+`</div>` : '';
    resultadoEl.innerHTML = html + chips;
    resultadoSection.classList.remove('hidden');
    resultadoSection.scrollIntoView({behavior:'smooth'});
  });

  // CSV
  document.querySelector('#btnCSV')?.addEventListener('click', async (e)=>{
    e.preventDefault();
    const u = getCurrentUser(); if(!u) return alert('Faça login.');
    window.location.href = '/.netlify/functions/usage_export';
  });

  // PDFs
  async function exportPDF(node, filename){
    const { jsPDF } = window.jspdf || {}; if(!jsPDF) return alert('jsPDF não carregou.');
    const canvas = await html2canvas(node, { scale: 2, backgroundColor:'#fff' });
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p','mm','a4'); const w = pdf.internal.pageSize.getWidth(); const h = (canvas.height * (w-20))/canvas.width;
    pdf.addImage(img,'PNG',10,10,w-20,h,'','FAST'); pdf.save(filename);
  }
  document.querySelector('#btnPdfPaciente')?.addEventListener('click', ()=> exportPDF(resultadoEl, 'relatorio_paciente.pdf'));
  document.querySelector('#btnPdfSupervisao')?.addEventListener('click', ()=> exportPDF(resultadoEl, 'relatorio_supervisao.pdf'));
  document.querySelector('#btnNova')?.addEventListener('click', ()=>{ form.reset(); listaPerguntas.innerHTML=''; perguntasCard.classList.add('hidden'); resultadoEl.innerHTML=''; resultadoSection.classList.add('hidden'); window.scrollTo({top:0, behavior:'smooth'}); });

  // Salvar nota (criptografia)
  document.getElementById('btnSalvarNota')?.addEventListener('click', async ()=>{
    const note = (document.getElementById('notaClinica')?.value||'').trim();
    const pass = (document.getElementById('passphrase')?.value||'').trim();
    const tagsRaw = (document.getElementById('tagsCaso')?.value||'').trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];
    if(!note) return alert('Escreva a nota.');
    if(!pass) return alert('Defina uma senha para criptografar.');
    const u = getCurrentUser(); if(!u) return alert('Faça login.');
    try{
      const payload = await encryptNote(pass, note);
      const token = await u.jwt();
      const r = await fetch('/.netlify/functions/notes', {
        method:'POST',
        headers:{ authorization:`Bearer ${token}`, 'content-type':'application/json' },
        body: JSON.stringify({ ...payload, tags })
      });
      if(r.ok){ alert('Nota salva com segurança.'); document.getElementById('notaClinica').value=''; }
      else { alert('Falha ao salvar nota.'); }
    }catch(e){ alert('Erro ao criptografar/salvar.'); }
  });

  // ===== Minhas Notas =====
  async function listarMinhasNotas(){
    const u = getCurrentUser(); if(!u) return alert('Faça login.');
    const token = await u.jwt();
    const mk = (document.getElementById('minhasNotasMes')?.value||'').replace('-','');
    const r = await fetch('/.netlify/functions/notes' + (mk?`?month=${mk}`:''), { headers:{ authorization:`Bearer ${token}` } });
    if(!r.ok) return alert('Falha ao listar notas.');
    const data = await r.json();
    const list = document.getElementById('notasLista');
    const arr = (data.notes||[]).sort((a,b)=> String(b.ts).localeCompare(String(a.ts)));
    if(!arr.length){ list.innerHTML = '<p class="muted">Sem notas neste período.</p>'; return; }
    list.innerHTML = arr.map(n => `
      <div class="card">
        <div class="grid">
          <div class="field"><span>Data/hora</span><div>${escapeHtml(n.ts||'')}</div></div>
          <div class="field"><span>Tags</span><div>${(n.tags||[]).map(t=>`<span class='badge'>${escapeHtml(t)}</span>`).join(' ')||'-'}</div></div>
        </div>
        <div class="actions">
          <button class="btn" data-open-note="${escapeHtml(n.id)}">Abrir</button>
        </div>
        <pre class="pre" id="noteBody_${escapeHtml(n.id)}" style="display:none"></pre>
      </div>
    `).join('');
    list.querySelectorAll('[data-open-note]').forEach(btn=>{
      btn.addEventListener('click', ()=> abrirNota(btn.getAttribute('data-open-note')));
    });
  }
  async function abrirNota(id){
    const pass = (document.getElementById('minhasNotasPass')?.value||'').trim();
    if(!pass) return alert('Digite a senha de descriptografia.');
    const u = getCurrentUser(); if(!u) return alert('Faça login.');
    const token = await u.jwt();
    const mk = (document.getElementById('minhasNotasMes')?.value||'').replace('-','');
    const qp = new URLSearchParams({ id }); if(mk) qp.set('month', mk);
    const r = await fetch('/.netlify/functions/notes?' + qp.toString(), { headers:{ authorization:`Bearer ${token}` } });
    if(!r.ok) return alert('Falha ao carregar a nota.');
    const obj = await r.json();
    try{
      const text = await decryptNote(pass, obj.ciphertext, obj.iv, obj.salt);
      const pre = document.getElementById('noteBody_'+id);
      pre.style.display='block';
      pre.textContent = text;
    }catch(e){ alert('Senha incorreta (ou dado corrompido).'); }
  }
  document.getElementById('btnListarNotas')?.addEventListener('click', listarMinhasNotas);

  // ===== Painel Admin =====
  async function checkAdmin(){
    const panel = document.getElementById('adminPanel');
    const u = getCurrentUser(); if(!u){ panel.style.display='none'; return false; }
    try{
      const token = await u.jwt();
      const r = await fetch('/.netlify/functions/admin?fn=users', { headers:{ authorization:`Bearer ${token}` } });
      if(r.ok){ panel.style.display='block'; return true; }
    }catch(e){}
    panel.style.display='none'; return false;
  }
  window.netlifyIdentity?.on('login', checkAdmin);
  window.netlifyIdentity?.on('init', checkAdmin);
  window.netlifyIdentity?.on('logout', checkAdmin);
  document.addEventListener('DOMContentLoaded', checkAdmin);

  const adminSetPlan = document.getElementById('adminSetPlan');
  adminSetPlan?.addEventListener('click', async ()=>{
    const email = (document.getElementById('adminEmail')?.value||'').trim();
    const plan = document.getElementById('adminPlano')?.value || 'basic';
    if(!email) return alert('Informe o e-mail do aluno.');
    const u = getCurrentUser(); if(!u) return alert('Faça login.');
    const token = await u.jwt();
    const r = await fetch('/.netlify/functions/admin?fn=plan', { method:'POST', headers:{ authorization:`Bearer ${token}`, 'content-type':'application/json' }, body: JSON.stringify({ email, plan }) });
    if(r.ok){ alert('Plano atualizado.'); } else { alert('Falha ao atualizar plano.'); }
  });

  const btnList = document.getElementById('adminListUsers');
  const outUsers = document.getElementById('adminUsersOut');
  btnList?.addEventListener('click', async ()=>{
    const u = getCurrentUser(); if(!u) return alert('Faça login.');
    const token = await u.jwt();
    const mk = (document.getElementById('adminMes')?.value||'').replace('-','');
    const r = await fetch('/.netlify/functions/admin?fn=users' + (mk?`&month=${mk}`:''), { headers:{ authorization:`Bearer ${token}` } });
    if(!r.ok) return alert('Falha ao listar.');
    const data = await r.json();
    outUsers.style.display='block';
    outUsers.textContent = (data.users||[]).join('\n') || 'Vazio';
  });

  const btnUsage = document.getElementById('adminGetUsage');
  const btnCSVAdm = document.getElementById('adminCSV');
  const outUsage = document.getElementById('adminUsageOut');
  btnUsage?.addEventListener('click', async ()=>{
    const email = (document.getElementById('adminEmailUsage')?.value||'').trim();
    if(!email) return alert('Informe o e-mail.');
    const u = getCurrentUser(); if(!u) return alert('Faça login.');
    const token = await u.jwt();
    const mk = (document.getElementById('adminMes')?.value||'').replace('-','');
    const r = await fetch('/.netlify/functions/admin?fn=usage&email=' + encodeURIComponent(email) + (mk?`&month=${mk}`:''), { headers:{ authorization:`Bearer ${token}` } });
    if(!r.ok) return alert('Falha ao obter uso.');
    const data = await r.json();
    outUsage.style.display='block';
    outUsage.textContent = JSON.stringify(data, null, 2);
  });
  btnCSVAdm?.addEventListener('click', async ()=>{
    const email = (document.getElementById('adminEmailUsage')?.value||'').trim();
    if(!email) return alert('Informe o e-mail.');
    const mk = (document.getElementById('adminMes')?.value||'').replace('-','');
    window.location.href = '/.netlify/functions/admin?fn=csv&email=' + encodeURIComponent(email) + (mk?`&month=${mk}`:'');
  });

  document.addEventListener('DOMContentLoaded', ()=>{ buildScaleGrid(); updateAuthUI(getCurrentUser()); window.netlifyIdentity?.init(); });
})();