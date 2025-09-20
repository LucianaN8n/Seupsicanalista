(function(){
  const $ = (s, el=document)=> el.querySelector(s);
  const anoEl = $('#ano'); if(anoEl) anoEl.textContent = new Date().getFullYear();
  const userEmailEl = $('#userEmail'); const btnLogout = $('#btnLogout'); const badgeLimite = $('#badgeLimite');
  const qe = $('#queixas'); const perguntasCard = $('#perguntasCard'); const listaPerguntas = $('#listaPerguntas');

  const TOKEN_KEY='app_token';
  function getToken(){ return localStorage.getItem(TOKEN_KEY)||''; }
  function setToken(t){ localStorage.setItem(TOKEN_KEY, t||''); }
  async function me(){ const t=getToken(); if(!t) return null; const r=await fetch('/.netlify/functions/auth_me',{headers:{authorization:`Bearer ${t}`}}); if(!r.ok) return null; return await r.json(); }
  async function updateAuthUI(){
    const m = await me();
    if(m){ userEmailEl.textContent=m.email; btnLogout.classList.remove('hidden'); await atualizarContagem(); await checkAdmin(); }
    else{ userEmailEl.textContent='Não conectado'; btnLogout.classList.add('hidden'); badgeLimite.textContent='0/3 hoje'; $('#adminPanel').style.display='none'; }
  }
  btnLogout?.addEventListener('click', ()=>{ setToken(''); updateAuthUI(); });

  async function doRegister(){
    const email=$('#authEmail').value.trim(), pass=$('#authPass').value.trim();
    if(!email || !pass) return alert('Preencha e-mail e senha.');
    const r=await fetch('/.netlify/functions/auth_register',{method:'POST',headers:{'content-type':'application/json'},body: JSON.stringify({ email, password: pass })});
    if(r.ok){ alert('Conta criada. Agora faça login.'); } else { alert('Falha ao criar conta (usuário pode já existir).'); }
  }
  async function doLogin(){
    const email=$('#authEmail').value.trim(), pass=$('#authPass').value.trim();
    if(!email || !pass) return alert('Preencha e-mail e senha.');
    const r=await fetch('/.netlify/functions/auth_login',{method:'POST',headers:{'content-type':'application/json'},body: JSON.stringify({ email, password: pass })});
    if(!r.ok) return alert('E-mail ou senha inválidos.');
    const d=await r.json(); setToken(d.token); updateAuthUI();
  }
  $('#btnDoRegister')?.addEventListener('click', doRegister);
  $('#btnDoLogin')?.addEventListener('click', doLogin);

  // Google OAuth
  $('#btnGoogle')?.addEventListener('click', ()=>{
    window.location.href='/.netlify/functions/auth_oauth_start';
  });

  // Forgot password flow
  $('#btnForgot')?.addEventListener('click', async ()=>{
    const email = prompt('Digite seu e-mail para receber o link de redefinição:');
    if(!email) return;
    await fetch('/.netlify/functions/auth_request_reset', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ email }) });
    alert('Se existir uma conta com este e-mail, enviaremos um link de redefinição.');
  });

  // Limits/plan
  async function atualizarContagem(){
    const t=getToken(); if(!t) return;
    const r=await fetch('/.netlify/functions/limite?scope=all',{headers:{authorization:`Bearer ${t}`}});
    if(!r.ok) return;
    const d=await r.json();
    badgeLimite.textContent = `${d.count||0}/${d.daily_limit||3} hoje`;
    $('#planoNome').textContent=(d.plan||'basic').toUpperCase();
    $('#planoLimites').textContent=`• limites: ${d.daily_limit}/dia, ${d.monthly_limit}/mês`;
    $('#usoHoje').textContent=d.count||0; $('#limiteDia').textContent=d.daily_limit||0; $('#usoMes').textContent=d.month_count||0; $('#limiteMes').textContent=d.monthly_limit||0;
  }
  async function checarLimite(){
    const t=getToken(); if(!t){ alert('Entre na sua conta.'); return false; }
    const r=await fetch('/.netlify/functions/limite',{method:'POST',headers:{authorization:`Bearer ${t}`}});
    if(r.status===429){ const d=await r.json().catch(()=>({})); badgeLimite.textContent=`${d.count||0}/${d.daily_limit||0} hoje`; alert(d.reason==='monthly'?'Você atingiu o limite MENSAL.':'Você atingiu o limite DIÁRIO.'); return false; }
    if(!r.ok){ alert('Falha ao checar limite.'); return false; }
    const d=await r.json(); badgeLimite.textContent=`${d.count||0}/${d.daily_limit||0} hoje`; await atualizarContagem(); return true;
  }

  // Admin
  async function checkAdmin(){
    const t=getToken(); if(!t) return false;
    const r=await fetch('/.netlify/functions/admin?fn=users',{headers:{authorization:`Bearer ${t}`}});
    const panel=$('#adminPanel'); if(r.ok){ panel.style.display='block'; return true; } panel.style.display='none'; return false;
  }
  $('#adminSetPlan')?.addEventListener('click', async ()=>{
    const email=($('#adminEmail')?.value||'').trim(), plan=$('#adminPlano')?.value||'basic';
    const t=getToken(); if(!t) return alert('Faça login.');
    const r=await fetch('/.netlify/functions/admin?fn=plan',{method:'POST',headers:{authorization:`Bearer ${t}`,'content-type':'application/json'},body: JSON.stringify({ email, plan })});
    if(r.ok) alert('Plano atualizado.'); else alert('Falha ao atualizar plano.');
  });
  $('#adminGetUsage')?.addEventListener('click', async ()=>{
    const email=($('#adminEmailUsage')?.value||'').trim(); const t=getToken(); if(!t) return alert('Faça login.');
    const mk=($('#adminMes')?.value||'').replace('-',''); const r=await fetch('/.netlify/functions/admin?fn=usage&email='+encodeURIComponent(email)+(mk?`&month=${mk}`:''),{headers:{authorization:`Bearer ${t}`}});
    if(!r.ok) return alert('Falha ao obter uso.'); const data=await r.json(); const out=$('#adminUsageOut'); out.style.display='block'; out.textContent=JSON.stringify(data,null,2);
  });
  $('#adminCSV')?.addEventListener('click', async ()=>{
    const email=($('#adminEmailUsage')?.value||'').trim(); const mk=($('#adminMes')?.value||'').replace('-','');
    window.location.href='/.netlify/functions/admin?fn=csv&email='+encodeURIComponent(email)+(mk?`&month=${mk}`:'');
  });

  // Perguntas dinâmicas
  const qsBase=['Quando isso começou? Qual gatilho mais recente?','O que piora e o que alivia? O que você evita por causa disso?','Onde aparece no corpo? Em que cenas isso se repete?','Se essa sensação pudesse falar, o que diria? De quem é essa voz?'];
  function pick3(a){ const x=a.slice(),o=[]; while(x.length&&o.length<3){ o.push(x.splice(Math.floor(Math.random()*x.length),1)[0]); } return o; }
  function refreshPerguntas(){ const text=(qe?.value||'').trim(); if(!text){ perguntasCard?.classList.add('hidden'); listaPerguntas.innerHTML=''; return; } const qs=pick3(qsBase); listaPerguntas.innerHTML=qs.map(q=>`<li>${q}</li>`).join(''); perguntasCard?.classList.remove('hidden'); }
  qe?.addEventListener('blur', refreshPerguntas); qe?.addEventListener('change', refreshPerguntas);

  // Escalas
  const gad7Items=['Nervoso(a)/no limite','Não parar de se preocupar','Preocupar-se com várias coisas','Dificuldade em relaxar','Inquietação','Irritabilidade','Medo de algo ruim'];
  const phq9Items=['Pouco interesse/prazer','Humor deprimido/sem esperança','Sono alterado','Cansaço/baixa energia','Apetite alterado','Autoimagem negativa/culpa','Concentração difícil','Lentidão/agitação','Ideação de morte/autoagressão'];
  function buildScaleGrid(){ const g=$('[data-scale="gad7"]'), p=$('[data-scale="phq9"]'); if(g) gad7Items.forEach((l,i)=> g.insertAdjacentHTML('beforeend', itemHTML('gad7',i,l))); if(p) phq9Items.forEach((l,i)=> p.insertAdjacentHTML('beforeend', itemHTML('phq9',i,l))); }
  function itemHTML(prefix, idx, label){ return `<div class="scale-item"><div>${label}</div><div>${[0,1,2,3].map(v=>`<label><input type="radio" name="${prefix}_${idx}" value="${v}"> ${v}</label>`).join(' ')}</div></div>`; }
  function readScale(prefix, n){ let sum=0, ans=0; for(let i=0;i<n;i++){ const el=document.querySelector(`input[name="${prefix}_${i}"]:checked`); if(el){ sum+=Number(el.value); ans++; } } return {sum, ans}; }
  function classGAD7(s){ if(s<=4) return 'mínima'; if(s<=9) return 'leve'; if(s<=14) return 'moderada'; return 'grave'; }
  function classPHQ9(s){ if(s<=4) return 'mínima'; if(s<=9) return 'leve'; if(s<=14) return 'moderada'; if(s<=19) return 'moderadamente grave'; return 'grave'; }
  function escapeHtml(s){ return String(s||'').replace(/[&<>\"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
  function nl2br(s){ return String(s).replace(/\n/g,'<br>'); }

  function planoPsicanalitico({nome, idade, queixas, gad7, phq9}){
    const metas=['Reduzir sofrimento-alvo em 30–40% (4–6 semanas)','Aumentar simbolização (da descarga à narrativa)','Identificar cenas repetitivas e deslocar defesas'];
    let html=`<div class="kv"><div><strong>Paciente</strong></div><div>${escapeHtml(nome)} (${idade} anos)</div><div><strong>Queixas</strong></div><div>${nl2br(escapeHtml(queixas))}</div></div>`;
    if(gad7||phq9){ html+=`<h3 class="section-title">Marcadores</h3><ul>`; if(gad7) html+=`<li>GAD-7: ${gad7.sum} (${escapeHtml(gad7.class)}) — monitorar</li>`; if(phq9) html+=`<li>PHQ-9: ${phq9.sum} (${escapeHtml(phq9.class)}) — monitorar</li>`; html+=`</ul>`; }
    html+=`<h3 class="section-title">Plano de Sessões (1–4)</h3><ol><li><b>S1</b>: ancoragem corporal + cena índice; contrato de foco.</li><li><b>S2</b>: reconstrução da cena; nomear desejo/medo; ensaio.</li><li><b>S3</b>: eco antigo; ajustar exposição.</li><li><b>S4</b>: revisar indicadores; consolidar script; prevenção de recaída.</li></ol>`;
    html+=`<h3 class="section-title">Metas</h3><ul>`+metas.map(m=>`<li>${escapeHtml(m)}</li>`).join('')+`</ul>`;
    return html;
  }

  const form=$('#anamneseForm'); const resultadoSection=$('#resultadoSection'); const resultadoEl=$('#resultado');
  form?.addEventListener('submit', async (e)=>{
    e.preventDefault(); if(!(await checarLimite())) return;
    const g=readScale('gad7',7), p=readScale('phq9',9); const gad7=g.ans?{sum:g.sum,class:classGAD7(g.sum)}:null; const phq9=p.ans?{sum:p.sum,class:classPHQ9(p.sum)}:null;
    const nome=($('#anamneseForm [name="nome"]')?.value||'').trim(); const idade=Number($('#anamneseForm [name="idade"]')?.value)||0; const queixas=($('#anamneseForm [name="queixas"]')?.value||'').trim();
    const html=planoPsicanalitico({nome, idade, queixas, gad7, phq9});
    resultadoEl.innerHTML=html; resultadoSection.classList.remove('hidden'); resultadoSection.scrollIntoView({behavior:'smooth'});
  });

  async function exportPDF(node, filename){ const { jsPDF }=window.jspdf||{}; if(!jsPDF) return alert('jsPDF não carregou.'); const canvas=await html2canvas(node,{scale:2,backgroundColor:'#fff'}); const img=canvas.toDataURL('image/png'); const pdf=new jsPDF('p','mm','a4'); const w=pdf.internal.pageSize.getWidth(); const h=(canvas.height*(w-20))/canvas.width; pdf.addImage(img,'PNG',10,10,w-20,h,'','FAST'); pdf.save(filename); }
  $('#btnPdfPaciente')?.addEventListener('click', ()=> exportPDF($('#resultado'),'relatorio_paciente.pdf'));
  $('#btnPdfSupervisao')?.addEventListener('click', ()=> exportPDF($('#resultado'),'relatorio_supervisao.pdf'));
  $('#btnNova')?.addEventListener('click', ()=>{ $('#anamneseForm').reset(); listaPerguntas.innerHTML=''; perguntasCard.classList.add('hidden'); $('#resultado').innerHTML=''; $('#resultadoSection').classList.add('hidden'); window.scrollTo({top:0,behavior:'smooth'}); });
  $('#btnCSV')?.addEventListener('click', async ()=>{ const t=getToken(); if(!t) return alert('Faça login.'); const r=await fetch('/.netlify/functions/usage_export',{headers:{authorization:`Bearer ${t}`}}); if(!r.ok) return alert('Falha.'); const blob=await r.blob(); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='uso.csv'; a.click(); });

  $('#btnUpgrade')?.addEventListener('click', async ()=>{ const t=getToken(); if(!t) return alert('Faça login.'); const r=await fetch('/.netlify/functions/plan',{method:'POST',headers:{authorization:`Bearer ${t}`,'content-type':'application/json'},body: JSON.stringify({ plan:'pro' })}); if(r.ok){ alert('Plano PRO ativado.'); atualizarContagem(); } else alert('Falha no upgrade.'); });
  $('#btnDowngrade')?.addEventListener('click', async ()=>{ const t=getToken(); if(!t) return alert('Faça login.'); const r=await fetch('/.netlify/functions/plan',{method:'POST',headers:{authorization:`Bearer ${t}`,'content-type':'application/json'},body: JSON.stringify({ plan:'basic' })}); if(r.ok){ alert('Plano Básico ativado.'); atualizarContagem(); } else alert('Falha no downgrade.'); });

  document.addEventListener('DOMContentLoaded', ()=>{ buildScaleGrid(); updateAuthUI(); });
})();