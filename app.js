(function(){
  const $ = (sel, el=document)=>el.querySelector(sel);
  const $$ = (sel, el=document)=>Array.from(el.querySelectorAll(sel));
  const form = $('#anamneseForm');
  const resultadoSection = $('#resultadoSection');
  const resultadoEl = $('#resultado');
  const anoEl = $('#ano'); if(anoEl) anoEl.textContent = new Date().getFullYear();

  const perguntasCard = $('#perguntasCard');
  const listaPerguntas = $('#listaPerguntas');
  const observacoesEl = $('#observacoes');
  const obsIncluirPdf = $('#obsIncluirPdf');
  const queixasEl = $('#queixas');

  // ====== Lexicon → tags
  const lexicon = [
    {kw:[/ansiedad|p[aâ]nico|palpita|taquicard|crise/i], tags:['ansiedade','hiperalerta','evitacao']},
    {kw:[/ins[oô]ni|sono ruim|acordar|pesadelo/i], tags:['insônia','ruminacao']},
    {kw:[/triste|depress|anedoni|desan[ií]mo/i], tags:['humor','autoacusacao']},
    {kw:[/trauma|abuso|viol[eê]ncia|ptsd|flashback|gatilho/i], tags:['trauma','hipervigilancia']},
    {kw:[/compuls|binge|alcool|drog|porn|jogo/i], tags:['compulsao','adicao']},
    {kw:[/relacion|casament|fam[ií]li|ci[úu]me|trai/i], tags:['relacional','familia','sistemico']},
    {kw:[/autoestima|vergonh|culpa|perfeccion/i], tags:['autoestima','perfeccionismo']},
    {kw:[/trabalho|produtiv|burnout|estresse/i], tags:['trabalho','estresse']},
    {kw:[/luto|perda/i], tags:['luto']},
    {kw:[/obsess|to[ck]/i], tags:['obsessivo']},
    {kw:[/crian[cç]a|inf[aâ]ncia|filh/i], tags:['infancia']},
    {kw:[/idos[oa]|envelhec|dem[eê]n/i], tags:['idoso']},
    {kw:[/sexual|g[eê]nero|divers|lgbt/i], tags:['sexualidade','diversidade']},
    {kw:[/dor cr[oô]nic|fibrom|gastrit|enxaquec|pele|psico?soma/i], tags:['psicossomatico']},
    {kw:[/vazio|sem sentido|prop[oó]sit|existenc/i], tags:['sentido','existencial']},
    {kw:[/suic|matar|auto.?mutila|psicose|voz|alucina/i], tags:['risco']},
  ];

  // ====== Técnica auxiliar por tag (nomes completos, sem abreviações)
  const integrations = {
    'ansiedade':['Terapia Cognitiva Baseada em Mindfulness (atenção às sensações/respiração)','Terapia de Aceitação e Compromisso (defusão + ação guiada por valores)'],
    'insônia':['Higiene do sono + Terapia Cognitiva Baseada em Mindfulness','Rotina circadiana estável'],
    'ruminacao':['Terapia Cognitiva Baseada em Mindfulness (descentralização do pensamento)'],
    'humor':['Psicoterapia breve focal (contrato de foco)'],
    'trauma':['Psicanálise (manejo de defesas + simbolização)','Psicoterapia Baseada na Mentalização (estabilização afetiva)'],
    'adicao':['Método Clínico Centrado na Pessoa (acolhimento/congruência)','Terapia de Aceitação e Compromisso (técnica de “surf da urgência”)'],
    'compulsao':['Terapia de Aceitação e Compromisso (defusão + valores)','Terapia Psicossomática (integração emoção–corpo)'],
    'relacional':['Psicanálise sistêmica (padrões transgeracionais)','Herança emocional'],
    'familia':['Genograma 3 gerações + papéis','Herança emocional'],
    'sistemico':['Terapia Sistêmica focal'],
    'autoestima':['Terapia positiva (forças de caráter)','Método Clínico Centrado na Pessoa (empatia ativa)'],
    'perfeccionismo':['Terapia de Aceitação e Compromisso (aceitação da imperfeição funcional)','Terapia Cognitiva Baseada em Mindfulness (observação do crítico interno)'],
    'trabalho':['Psicoterapia contextual (função do comportamento)','Terapia de Aceitação e Compromisso (valores ocupacionais)'],
    'estresse':['Terapia Cognitiva Baseada em Mindfulness + regulação autonômica'],
    'luto':['Psicanálise do luto (trabalho de perda)','Método Clínico Centrado na Pessoa (presença)'],
    'obsessivo':['Terapia Cognitiva Baseada em Mindfulness (observação de rituais)','Terapia de Aceitação e Compromisso (tolerância à incerteza)'],
    'infancia':['Psicanálise infantil','Intervenção precoce (pais/cuidadores)'],
    'idoso':['Psicanálise no envelhecimento','Logoterapia (sentido)'],
    'sexualidade':['Psicanálise na diversidade sexual'],
    'diversidade':['Psicanálise na diversidade sexual'],
    'psicossomatico':['Terapia Psicossomática (integração emoção–corpo)','Terapia Cognitiva Baseada em Mindfulness (interocepção)'],
    'sentido':['Logoterapia (valores de criação/experiência/atitude)'],
    'existencial':['Logoterapia'],
  };

  // ====== Perguntas cirúrgicas (por eixo)
  const surgicalQs = {
    base:[
      'Quando isso começou? Qual gatilho mais recente?',
      'O que piora e o que alivia, mesmo que pouco?',
      'O que você evita por causa disso? O que tentou e não funcionou?',
      'Onde isso aparece no corpo? Em que cenas do dia isso se repete?',
      'Se essa sensação pudesse falar, o que diria? De quem é essa voz?',
    ],
    ansiedade:[
      'Qual é o medo central quando a crise aparece?',
      'No auge do sintoma, o que você faz (evita/foge/controla)? E depois?',
    ],
    trauma:[
      'Quando surgem gatilhos, o que seu corpo faz primeiro?',
      'O que te faria sentir 10% mais seguro(a) aqui e agora?',
    ],
    relacional:[
      'Que padrão se repete nos seus vínculos? Em que frase a conversa vira briga?',
      'O que você faz para não depender de ninguém? E qual o custo?',
    ],
    psicossomatico:[
      'Que emoção antecede a dor/sintoma? Qual a cena imediatamente anterior?',
      'Como você cuida do corpo quando o sintoma surge?',
    ],
    sentido:[
      'Se sua vida tivesse capítulos, que título tem o atual? O que este capítulo pede de você?',
      'Qual pequeno ato de sentido cabe nesta semana?',
    ],
    luto:[
      'O que foi perdido além da pessoa/coisa? (rotina, papel, futuro imaginado)',
      'Como é falar disso agora comigo?',
    ],
    obsessivo:[
      'O que você teme que aconteça se não checar/fazer o ritual?',
      'Qual “regra secreta” te governa aqui? De onde ela vem?',
    ],
  };

  function parseTags(text){
    const tags = new Set();
    lexicon.forEach(rule=> rule.kw.forEach(rx=> { if(rx.test(text)) rule.tags.forEach(t=>tags.add(t)); }));
    return Array.from(tags);
  }
  function pick3(array){
    const arr = array.slice();
    const out = [];
    while(arr.length && out.length<3){
      const i = Math.floor(Math.random()*arr.length);
      out.push(arr.splice(i,1)[0]);
    }
    return out;
  }

  // ====== Auto-gerar perguntas ao terminar a queixa
  function refreshPerguntas(){
    const text = (queixasEl?.value||'').trim();
    if(!text){ perguntasCard?.classList.add('hidden'); if(listaPerguntas) listaPerguntas.innerHTML=''; return; }
    const tags = parseTags(text);
    const base = [].concat(surgicalQs.base);
    const map = {
      'ansiedade':'ansiedade','ruminacao':'ansiedade','trauma':'trauma',
      'relacional':'relacional','familia':'relacional','sistemico':'relacional',
      'psicossomatico':'psicossomatico','sentido':'sentido','existencial':'sentido',
      'luto':'luto','obsessivo':'obsessivo'
    };
    new Set(tags.map(t=>map[t]).filter(Boolean)).forEach(key=> (surgicalQs[key]||[]).forEach(q=>base.push(q)));
    const qs = pick3(base);
    if(listaPerguntas) listaPerguntas.innerHTML = qs.map(q=>`<li>${escapeHtml(q)}</li>`).join('');
    perguntasCard?.classList.remove('hidden');
  }
  queixasEl?.addEventListener('blur', refreshPerguntas);
  queixasEl?.addEventListener('change', refreshPerguntas);
  queixasEl?.addEventListener('keyup', (e)=>{ if(e.key==='Enter'){ refreshPerguntas(); } });

  // ====== Escalas
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
  function classifyGAD7(sum){
    if(sum<=4) return 'mínima';
    if(sum<=9) return 'leve';
    if(sum<=14) return 'moderada';
    return 'grave';
  }
  function classifyPHQ9(sum){
    if(sum<=4) return 'mínima';
    if(sum<=9) return 'leve';
    if(sum<=14) return 'moderada';
    if(sum<=19) return 'moderadamente grave';
    return 'grave';
  }

  // ====== Helpers
  function escapeHtml(s){ return String(s||'').replace(/[&<>\"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
  function nl2br(s){ return String(s).replace(/\n/g,'<br>'); }
  function riskMessage(riscos, intensidade){
    const danger = /suicid|matar|auto.?mutila|psicose|voz|alucina/i.test(riscos||'');
    if (danger || intensidade==='grave'){
      return '⚠️ RISCO: acione avaliação médica/psiquiátrica e rede de proteção imediatamente; priorize segurança antes de aprofundar.';
    }
    return 'Sem risco grave explícito informado; manter triagem em toda sessão.';
  }
  function goalsByTags(tags){
    const g = [];
    if(tags.includes('ansiedade')||tags.includes('ruminacao')) g.push('Ansiedade/ruminação 8→5/10 em 4 semanas (auto-relato, 3×/semana).');
    if(tags.includes('insônia')) g.push('Sono total ≥6h em 4 semanas (registro de sono).');
    if(tags.includes('relacional')) g.push('Conflito 2→1×/semana usando script de pausa/retorno.');
    if(tags.includes('psicossomatico')) g.push('Mapear 2 gatilhos corpo→emoção e aplicar cuidado ≥3×/semana.');
    if(tags.includes('sentido')||tags.includes('existencial')) g.push('1 ato de sentido/semana (log de atividades).');
    if(!g.length) g.push('Definir meta específica na Sessão 2 (métrica 0–10 + marcador comportamental).');
    return g;
  }
  function subRoteiros(tags){
    const out = [];
    if(tags.includes('infancia')){
      out.push(['Sub-roteiro — Infantil',[
        'Sessões com cuidadores (contrato claro): rotina, limites, vínculo.',
        'Brincar como linguagem: observar temas repetitivos e afetos.',
        'Intervenção precoce nas cenas-problema (orientação prática aos pais).'
      ]]);
    }
    if(tags.includes('idoso')){
      out.push(['Sub-roteiro — Envelhecimento',[
        'Trabalhar perdas/tempo/legado; lutos acumulados.',
        'Ajustar ritmo e memória: repetição útil e validação.',
        'Logoterapia: atos de sentido proporcionais à energia disponível.'
      ]]);
    }
    if(tags.includes('sexualidade')||tags.includes('diversidade')){
      out.push(['Sub-roteiro — Diversidade Sexual',[
        'Transferência em torno de identidade e reconhecimento; evitar suposições.',
        'Explorar efeitos de minoria/violência simbólica sem patologizar.',
        'Cuidar do enquadre inclusivo: linguagem, nomes e pronomes preferidos.'
      ]]);
    }
    return out;
  }

  // ====== Build result (duas versões: paciente e supervisão)
  function buildHTML(data, tipo='paciente'){
    const {nome, idade, tempo, intensidade, queixas, areas, riscos, gad7, phq9, obs, obsIncluir} = data;
    const tags = parseTags([queixas, areas].join(' '));
    const addOns = Array.from(new Set(tags.flatMap(t=>integrations[t]||[])));
    const risk = riskMessage(riscos, intensidade);
    const goals = goalsByTags(tags);
    const subs = subRoteiros(tags);
    const now = new Date().toLocaleString('pt-BR');

    let html = `<div class="kv">
      <div><strong>Paciente</strong></div><div>${escapeHtml(nome)} (${idade} anos)</div>
      <div><strong>Data</strong></div><div>${escapeHtml(now)}</div>
      ${tempo?`<div><strong>Curso da queixa</strong></div><div>${escapeHtml(tempo)}</div>`:''}
      ${intensidade?`<div><strong>Intensidade</strong></div><div>${escapeHtml(intensidade)}</div>`:''}
      <div><strong>Queixas</strong></div><div>${nl2br(escapeHtml(queixas))}</div>
      ${areas?`<div><strong>Áreas</strong></div><div>${escapeHtml(areas)}</div>`:''}
      ${riscos?`<div><strong>Alertas</strong></div><div>${escapeHtml(riscos)}</div>`:''}
    </div>`;

    // Observações (se marcado)
    if(obs && obsIncluir){
      html += `<h3 class="section-title">Observações do terapeuta</h3><blockquote>${nl2br(escapeHtml(obs))}</blockquote>`;
    }

    // Escalas (monitoramento)
    if(gad7 || phq9){
      html += `<h3 class="section-title">Escalas (monitoramento)</h3><ul>`;
      if(gad7){ html += `<li>GAD-7: ${gad7.sum} (${escapeHtml(gad7.class)}) — respondidos: ${gad7.answered}/7</li>`; }
      if(phq9){ html += `<li>PHQ-9: ${phq9.sum} (${escapeHtml(phq9.class)}) — respondidos: ${phq9.answered}/9</li>`; }
      html += `</ul><small class="helper">Uso exclusivo para acompanhamento — não é diagnóstico.</small>`;
    }

    // Hipóteses (apenas versão supervisão)
    if(tipo==='supervisao'){
      const hyp = [];
      if(tags.includes('trauma')) hyp.push('Trauma não-integrado com hipervigilância/evitação.');
      if(tags.includes('ansiedade')) hyp.push('Ansiedade sustentada por ruminação/evitação/necessidade de controle.');
      if(tags.includes('humor')) hyp.push('Humor deprimido ligado a perdas/autoacusação.');
      if(tags.includes('relacional')) hyp.push('Padrões repetitivos de vínculo (eco parental) na transferência.');
      if(tags.includes('psicossomatico')) hyp.push('Somatização como descarga de afetos pouco simbolizados.');
      if(tags.includes('existencial')||tags.includes('sentido')) hyp.push('Desalinhamento de valores e vazio de sentido.');
      if(hyp.length){ html += `<h3 class="section-title">Hipóteses clínicas iniciais</h3><ul>` + hyp.map(h=>`<li>${escapeHtml(h)}</li>`).join('') + `</ul>`; }

      html += `<h3 class="section-title">Eixo Psicanalítico</h3><ul>` +
        ['Setting/limites e foco por cena',
         'Transferência e defesas: nomear função/custo',
         'Interpretação graduada e experiências corretivas entre sessões',
         'Revisões periódicas com ajuste de foco conforme resposta'
        ].map(x=>`<li>${escapeHtml(x)}</li>`).join('') + `</ul>`;
    }

    // Plano de ação (comum)
    function actionPlan(tags){
      const pl = [];
      pl.push(['Semana 1 • Estabilização', [
        'Ritual de presença diária (2×/dia, 3–5 min): respiração + nota corporal (Terapia Cognitiva Baseada em Mindfulness).',
        ...(tags.includes('insônia') ? ['Higiene do sono (horário fixo, luz baixa 1h antes, cama=sono).'] : []),
        ...(tags.includes('ansiedade') ? ['Listar 3 gatilhos + resposta de evitação; experimentar alternativa mais funcional.'] : []),
        'Escala (0–10) do sofrimento-alvo, 3 ×/semana.'
      ]]);
      pl.push(['Semana 2 • Insight aplicado', [
        'Registrar 3 cenas repetitivas com “eco antigo” (quem/onde/pedido não ouvido).',
        ...(tags.includes('relacional') ? ['Genograma simples (3 gerações): papéis e lealdades.'] : []),
        ...(tags.includes('psicossomatico') ? ['Diário psicossomático: emoção→sensação→evento→cuidado possível.'] : []),
      ]]);
      pl.push(['Semana 3 • Experiência corretiva', [
        ...(tags.includes('ansiedade')||tags.includes('ruminacao') ? ['Exposição leve (1 situação/semana) com defusão/respiração (Terapia de Aceitação e Compromisso).'] : []),
        ...(tags.includes('sentido')||tags.includes('existencial') ? ['Ato de sentido: 1 ação pequena alinhada a valores (Logoterapia).'] : []),
        'Ensaio de script para a cena-problema (o que fará diferente).'
      ]]);
      pl.push(['Semana 4 • Consolidação', [
        'Revisar indicadores (sintomas, funcionamento, vínculos).',
        'Plano de continuidade (frequência/focos) + prevenção de recaída (gatilhos e respostas).'
      ]]);
      pl.push(['Continuado', [
        'Revisões periódicas com ajuste de foco conforme resposta do paciente.'
      ]]);
      return pl;
    }
    const plan = actionPlan(tags);
    html += `<h3 class="section-title">Plano de Ação (4 semanas + continuidade)</h3>` + 
      plan.map(([t, arr])=> `<h4><span class="badge">Fase</span> ${escapeHtml(t)}</h4><ul>${arr.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`).join('');

    // Integrações técnicas (comum)
    if(addOns.length){
      html += `<h3 class="section-title">Integrações Técnicas Pertinentes</h3><ul>` +
      addOns.map(a=>`<li>${escapeHtml(a)}</li>`).join('') + `</ul>`;
    }

    // Sub-roteiros (comum)
    if(subs.length){
      html += `<h3 class="section-title">Sub-roteiros por População</h3>`;
      subs.forEach(([t, arr])=>{
        html += `<h4><span class="badge">População</span> ${escapeHtml(t)}</h4><ul>${arr.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
      });
    }

    // Metas (comum)
    html += `<h3 class="section-title">Metas e Métricas</h3><ul>` + goals.map(g=>`<li>${escapeHtml(g)}</li>`).join('') + `</ul>`;

    // Segurança (comum)
    html += `<h3 class="section-title">Segurança & Encaminhamento</h3><p>${escapeHtml(risk)}</p><ul><li>Encaminhar para avaliação médica/psiquiátrica quando aplicável.</li></ul>`;

    // Devolutiva (comum, linguagem simples p/ paciente)
    if(tipo==='paciente'){
      html += `<h3 class="section-title">Devolutiva ao Paciente (script)</h3>`;
      html += `<blockquote>“${escapeHtml(nome)}, vamos trabalhar cenas específicas nas quais esse padrão aparece. Eu vou nomear o que se repete, conectar com experiências antigas quando fizer sentido e te dar recursos práticos (atenção ao corpo, exposição leve, atos de sentido). Entre as sessões, combinamos pequenas experiências para você ensaiar o ‘novo’.”</blockquote>`;
    }

    html += `<small class="helper">${tipo==='paciente'?'Relatório em linguagem simples.':'Versão detalhada para estudo/supervisão.'}</small>`;
    return html;
  }

  // ====== Form submit (com try/catch para não "matar" a página)
  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    try{
      const g = readScale('gad7', 7); const p = readScale('phq9', 9);
      const gad7 = g.answered ? {sum:g.sum, answered:g.answered, class: classifyGAD7(g.sum)} : null;
      const phq9 = p.answered ? {sum:p.sum, answered:p.answered, class: classifyPHQ9(p.sum)} : null;
      const data = {
        nome: ($('#anamneseForm [name="nome"]')?.value||'').trim(),
        idade: Number($('#anamneseForm [name="idade"]')?.value)||0,
        tempo: $('#anamneseForm [name="tempo"]')?.value||'',
        intensidade: $('#anamneseForm [name="intensidade"]')?.value||'',
        queixas: ($('#anamneseForm [name="queixas"]')?.value||'').trim(),
        areas: ($('#anamneseForm [name="areas"]') ? Array.from($('#anamneseForm [name="areas"]').selectedOptions).map(o=>o.value).join(', ') : ''),
        riscos: ($('#anamneseForm [name="riscos"]')?.value||'').trim(),
        gad7, phq9,
        obs: (document.getElementById('observacoes')?.value||'').trim(),
        obsIncluir: document.getElementById('obsIncluirPdf')?.checked || false
      };
      resultadoEl.innerHTML = buildHTML(data, 'paciente');
      resultadoSection.classList.remove('hidden');
      resultadoSection.scrollIntoView({behavior:'smooth', block:'start'});
      window.__lastData = data;
    }catch(err){
      console.error(err);
      alert('Erro ao gerar plano: ' + err.message);
    }
  });

  // ====== Copiar / Nova / PDFs
  $('#btnNova')?.addEventListener('click', ()=>{
    try{
      form.reset();
      if(listaPerguntas) listaPerguntas.innerHTML='';
      perguntasCard?.classList.add('hidden');
      resultadoEl.innerHTML='';
      resultadoSection.classList.add('hidden');
      window.scrollTo({top:0, behavior:'smooth'});
    }catch(err){ console.error(err); }
  });
  $('#btnCopiar')?.addEventListener('click', async ()=>{
    try{ await navigator.clipboard.writeText(resultadoEl.innerText); alert('Resumo copiado!'); }
    catch{ alert('Não consegui copiar automaticamente. Selecione e copie manualmente.'); }
  });

  async function exportPDF(node, filename){
    const { jsPDF } = window.jspdf || {};
    if(!jsPDF){ alert('Biblioteca jsPDF não carregou. Verifique conexão/CSP.'); return; }
    const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor:'#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight, '', 'FAST');
    heightLeft -= (pageHeight - 20);
    while (heightLeft > 0){
      pdf.addPage();
      position = 10 - (imgHeight - heightLeft);
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight, '', 'FAST');
      heightLeft -= (pageHeight - 20);
    }
    pdf.save(filename);
  }

  $('#btnPdfPaciente')?.addEventListener('click', async ()=>{
    await exportPDF(resultadoEl, `relatorio_paciente.pdf`);
  });
  $('#btnPdfSupervisao')?.addEventListener('click', async ()=>{
    const data = window.__lastData || {};
    const holder = document.createElement('div');
    holder.style.position='fixed'; holder.style.left='-9999px'; holder.style.top='0';
    holder.innerHTML = `<div class="resultado">${buildHTML(data, 'supervisao')}</div>`;
    document.body.appendChild(holder);
    await exportPDF(holder, `relatorio_supervisao.pdf`);
    document.body.removeChild(holder);
  });

  // ====== Modo Treino — Protótipo simples (garantir listeners mesmo se DOM carregar depois)
  function setupTreino(){
    const exemplos = [
      {nome:'Felipe', idade:28, queixa:'Crises de pânico no trânsito, evita dirigir sozinho.', extra:'Sono ruim, taquicardia, medo de perder o controle.'},
      {nome:'Mariana', idade:34, queixa:'Luto pela morte da avó, culpa por não ter se despedido.', extra:'Insônia inicial, choro fácil.'},
      {nome:'João', idade:9, queixa:'Medo de dormir sozinho e pesadelos.', extra:'Pais relatam brigas à noite.'},
      {nome:'Dona Neide', idade:72, queixa:'Sentido de vazio após aposentadoria.', extra:'Diminuiu convívios sociais.'}
    ];
    const btnCaso = $('#btnCaso');
    const btnFeed = $('#btnCasoFeedback');
    const casoOut = $('#casoOut');
    const feedbackOut = $('#feedbackOut');
    if(btnCaso){
      btnCaso.addEventListener('click', ()=>{
        const c = exemplos[Math.floor(Math.random()*exemplos.length)];
        if(casoOut) casoOut.textContent = `Nome: ${c.nome} (${c.idade})\nQueixa: ${c.queixa}\nExtra: ${c.extra}`;
      });
    }
    if(btnFeed){
      btnFeed.addEventListener('click', ()=>{
        const txt = (casoOut?.textContent||'').toLowerCase();
        const hits = [];
        if(/p[aâ]nico|taquicard/.test(txt)) hits.push('Pergunte pelo medo central (morrer, enlouquecer, rejeição, fracasso).');
        if(/luto/.test(txt)) hits.push('Trabalhe perdas secundárias e ritual simbólico.');
        if(/ins[oô]ni|pesadelo/.test(txt)) hits.push('Higiene do sono + rebaixar estímulos noturnos.');
        if(/aposent/.test(txt)) hits.push('Logoterapia: pequenos atos de sentido semanais.');
        if(feedbackOut) feedbackOut.textContent = hits.length? ('Feedback:\n- '+hits.join('\n- ')) : 'Feedback: explore defesas, transferência e uma cena específica.';
      });
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    try{
      buildScaleGrid();
      setupTreino();
    }catch(err){ console.error(err); }
  });
})();