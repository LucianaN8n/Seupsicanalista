/* Mentor Clínico — Regras simples + plano de atendimento com foco em Psicanálise */
(function(){
  const $ = (sel, el=document)=>el.querySelector(sel);
  const $$ = (sel, el=document)=>Array.from(el.querySelectorAll(sel));
  const form = $('#anamneseForm');
  const resultadoSection = $('#resultadoSection');
  const resultadoEl = $('#resultado');
  const anoEl = $('#ano');
  anoEl.textContent = new Date().getFullYear();

  // Vocabulário → tags clínicas
  const lexicon = [
    {kw: [/ansiedade|pânico|palpita/i], tags: ['ansiedade','evitacao','hiperalerta']},
    {kw: [/insônia|insónia|sono/i], tags: ['insônia','ruminação']},
    {kw: [/triste|depress/i], tags: ['humor','anedonia','autoacusacao']},
    {kw: [/trauma|abuso|viol[eê]ncia|p[ts]sd/i], tags: ['trauma','hipervigilancia','flashbacks']},
    {kw: [/compuls[ií]v|compulsao|binge|alcool|drog/i], tags: ['compulsao','adicao']},
    {kw: [/relaciona|casamento|fam[ií]lia|conflit/i], tags: ['relacional','familia','sistemico']},
    {kw: [/autoestima|autoconfian/i], tags: ['autoestima']},
    {kw: [/trabalho|produtiv|burnout|estresse/i], tags: ['trabalho','estresse']},
    {kw: [/luto|perda/i], tags: ['luto']},
    {kw: [/obsess|toc/i], tags: ['obsessivo']},
    {kw: [/crian[cç]a|inf[aâ]ncia|filh/], tags: ['infancia']},
    {kw: [/idos[oa]|envelhec/i], tags: ['idoso']},
    {kw: [/sexual|g[eê]nero|lgbt|diversidade/i], tags: ['sexualidade','diversidade']},
    {kw: [/dor|tens[aã]o|gastro|psico?soma/i], tags: ['psicossomatico']},
    {kw: [/espiritual|sentido|prop[oó]sito|vazio exist/i], tags: ['sentido','existencial']},
  ];

  // Mapa de tags → integrações úteis
  const integrations = {
    'ansiedade': ['MBCT (Terapia Cognitiva Baseada em Mindfulness)','ACT (aceitação e compromisso)'],
    'evitacao': ['ACT (valores + ação comprometida)'],
    'insônia': ['Higiene do sono + MBCT'],
    'ruminação': ['MBCT (descentralização do pensamento)'],
    'humor': ['Psicoterapia breve focal (contrato de foco)'],
    'trauma': ['Psicanálise com manejo de defesas','Mentalização (estabilização)', 'Intervenção precoce (se criança/adolescente)'],
    'adicao': ['MCC (clínico centrado na pessoa)','ACT (urge surfing)'],
    'compulsao': ['ACT (defusão + valores)','Psicossomática (ciclo emoção→corpo)'],
    'relacional': ['Psicanálise sistêmica (padrões transgeracionais)','Herança emocional'],
    'familia': ['Terapia Sistêmica/Genograma','Herança emocional'],
    'sistemico': ['Terapia Sistêmica'],
    'autoestima': ['Terapia positiva (forças de caráter)','MCC (acolhimento e congruência)'],
    'trabalho': ['Psicoterapia contextual (funções do comportamento)','ACT (valores ocupacionais)'],
    'estresse': ['MBCT + técnicas de regulação autônoma'],
    'luto': ['Psicanálise do luto (trabalho de luto)','MCC (presença empática)'],
    'obsessivo': ['MBCT (observação dos rituais)','ACT (aceitação da incerteza)'],
    'infancia': ['Psicanálise infantil','Intervenção precoce','Mapas mentais (psicoeducação aos cuidadores)'],
    'idoso': ['Psicanálise no envelhecimento (perdas/tempo)','Logoterapia'],
    'sexualidade': ['Psicanálise na diversidade sexual (transferência e identidade)'],
    'diversidade': ['Psicanálise na diversidade sexual'],
    'psicossomatico': ['Psicossomática (circuitos corpo-mente)','MBCT (interocepção)'],
    'sentido': ['Logoterapia (análise existencial)'],
    'existencial': ['Logoterapia (valores de criação/experiência/atitude)'],
  };

  // Núcleo psicanalítico — sempre presente
  function corePsychoanalysis({nome, idade, tempo, intensidade}){
    return [
      {title:'Enquadre e contrato terapêutico', items:[
        'Apresentar setting (tempo, frequência, honorário, sigilo, limites).',
        'Estabelecer foco inicial (sofrimento manifesto) sem fechar prematuramente hipóteses.'
      ]},
      {title:'Escuta e associação livre', items:[
        'Convidar à fala livre; observar lapsos, repetições, metáforas e afetos.',
        'Cartografar defesas (racionalização, idealização, controle, projeção, etc.).'
      ]},
      {title:'Transferência e contratransferência', items:[
        'Identificar padrões de relação que emergem no setting.',
        'Usar a contratransferência como instrumento clínico (com supervisão quando necessário).'
      ]},
      {title:'Interpretação e manejo', items:[
        'Intervir pontualmente: devolver sentido, ligar passado-presente, nomear conflitos.',
        'Respeitar timing do ego: interpretações graduais, evitando intrusão.'
      ]},
      {title:'Avaliação contínua', items:[
        'Revisitar objetivos a cada 4–6 sessões.',
        'Ajustar frequência/intensidade conforme resposta e riscos.'
      ]},
    ];
  }

  function parseTextToTags(text){
    const tags = new Set();
    lexicon.forEach(rule=>{
      rule.kw.forEach(rx=>{
        if(rx.test(text)){ rule.tags.forEach(t=>tags.add(t)); }
      });
    });
    return Array.from(tags);
  }

  function pickIntegrations(tags){
    const out = new Set();
    tags.forEach(t=>{
      (integrations[t]||[]).forEach(x=>out.add(x));
    });
    return Array.from(out);
  }

  function ageSpecific(idade, tags){
    const blocks = [];
    if(idade <= 12 || tags.includes('infancia')){
      blocks.push('Direcionar a técnica para Psicanálise Infantil e trabalho com cuidadores (rotina, limites, vínculo).');
    }
    if(idade >= 60 || tags.includes('idoso')){
      blocks.push('Considerar Psicanálise no Envelhecimento (luto, perdas, tempo, corpo) e Logoterapia para sentido.'); 
    }
    return blocks;
  }

  function systemicIfNeeded(tags){
    if(tags.includes('familia') || tags.includes('relacional') || tags.includes('sistemico')){
      return 'Investigar padrões transgeracionais (genograma de 3 gerações) e “herança emocional” que mantêm o sintoma.';
    }
    return null;
  }

  function riskAdvice(riscos, intensidade){
    const hasRisk = /suicid|auto.?mutila|psicose|abuso|viol[eê]ncia|agress/i.test(riscos||'');
    if(hasRisk || intensidade==='grave'){
      return '⚠️ Sinais de risco identificados: acione avaliação médica/psiquiátrica e rede de proteção. Priorize segurança antes de qualquer intervenção aprofundada.';
    }
    return 'Sem sinais explícitos de risco grave informados. Mantenha triagem ativa a cada sessão.';
  }

  function sessionPlan(tags, idade){
    // Plano de 12 sessões (exemplo)
    const s = [];
    s.push(['Sessões 1–2','Aliança terapêutica, história do sintoma, mapa de defesas, acordo de foco inicial.']);
    s.push(['Sessões 3–4','Trabalho na transferência; interpretações leves; psicoeducação pontual quando útil.']);
    s.push(['Sessões 5–6','Aprofundar conflitos (infância/dinâmicas atuais). Incluir MBCT/ACT quando houver ansiedade/ruminação/evitação.']);
    s.push(['Sessões 7–8','Se padrões familiares presentes: eixo sistêmico + herança emocional. Genograma + vínculos.']);
    s.push(['Sessões 9–10','Consolidar ganhos; introduzir Logoterapia se houver vazio/sentido; tarefas experienciais.']);
    s.push(['Sessões 11–12','Revisão de indicadores de mudança e plano de continuidade/alta.']);
    if(idade <= 12) s.push(['Observação','Incluir encontros com cuidadores (contrato claro).']);
    return s;
  }

  function buildResult(data){
    const {nome, idade, tempo, intensidade, queixas, areas, riscos} = data;
    const tags = parseTextToTags(queixas + ' ' + (areas || ''));
    const addons = pickIntegrations(tags);
    const core = corePsychoanalysis(data);
    const ageBlocks = ageSpecific(idade, tags);
    const systemic = systemicIfNeeded(tags);
    const risk = riskAdvice(riscos, intensidade);
    const sessions = sessionPlan(tags, idade);

    // Hipóteses não diagnósticas
    const hipoteses = [];
    if(tags.includes('trauma')) hipoteses.push('Trauma não-integrado sustentando hipervigilância/evitação.');
    if(tags.includes('ansiedade')) hipoteses.push('Ansiedade mantida por ruminação e controle (defesas do ego).');
    if(tags.includes('humor')) hipoteses.push('Humor deprimido associado a perdas/autoacusação.');
    if(tags.includes('relacional')) hipoteses.push('Padrões repetitivos em vínculos (transferência com figuras parentais).');
    if(tags.includes('psicossomatico')) hipoteses.push('Somatização como via de descarga afetiva não simbolizada.');
    if(tags.includes('existencial')||tags.includes('sentido')) hipoteses.push('Vazio de sentido/valores desalinhados.');

    // Recomendações técnicas priorizando Psicanálise
    const recs = [
      'Psicanálise como eixo principal (escuta, transferência, interpretação, manejo de resistências).',
      ...(addons.length ? ['Integrações úteis: ' + addons.join(' • ')] : []),
      ...(systemic ? [systemic] : []),
      ...ageBlocks
    ];

    // Mantra clínico (para o terapeuta lembrar)
    const mantra = 'Menos “consertar”, mais simbolizar. Ritmo do paciente, timing da interpretação, vínculo como instrumento.';

    // Construir HTML
    const now = new Date();
    const dateStr = now.toLocaleString('pt-BR');

    let html = '';
    html += `<div class="kv"><div><strong>Paciente</strong></div><div>${escapeHtml(nome)} (${idade} anos)</div>`;
    html += `<div><strong>Data</strong></div><div>${dateStr}</div>`;
    if(tempo) html += `<div><strong>Curso da queixa</strong></div><div>${escapeHtml(tempo)}</div>`;
    if(intensidade) html += `<div><strong>Intensidade</strong></div><div>${escapeHtml(intensidade)}</div>`;
    html += `<div><strong>Queixas</strong></div><div>${nl2br(escapeHtml(queixas))}</div>`;
    if(areas) html += `<div><strong>Áreas</strong></div><div>${escapeHtml(areas)}</div>`;
    if(riscos) html += `<div><strong>Alertas</strong></div><div>${escapeHtml(riscos)}</div>`;
    html += `</div>`;

    if(hipoteses.length){
      html += `<h3 class="section-title">Hipóteses clínicas iniciais (não diagnósticas)</h3><ul>`;
      hipoteses.forEach(h=> html += `<li>${escapeHtml(h)}</li>`);
      html += `</ul>`;
    }

    html += `<h3 class="section-title">Plano de Atendimento — Eixo Psicanalítico</h3>`;
    core.forEach(block=>{
      html += `<h4><span class="badge">Eixo</span> ${escapeHtml(block.title)}</h4><ul>`;
      block.items.forEach(it=> html += `<li>${escapeHtml(it)}</li>`);
      html += `</ul>`;
    });

    if(recs.length){
      html += `<h3 class="section-title">Complementos Técnicos (uso criterioso)</h3><ul>`;
      recs.forEach(r=> html += `<li>${escapeHtml(r)}</li>`);
      html += `</ul>`;
    }

    html += `<h3 class="section-title">Roteiro em Fases (12 sessões)</h3><ol>`;
    sessions.forEach(([t,desc])=>{
      html += `<li><strong>${escapeHtml(t)}:</strong> ${escapeHtml(desc)}</li>`;
    });
    html += `</ol>`;

    html += `<h3 class="section-title">Instrumentos e Tarefas</h3><ul>`;
    html += `<li>Registro de sonhos e cenas repetitivas (para simbolização).</li>`;
    if(tags.includes('ansiedade')||tags.includes('ruminação')){
      html += `<li>Prática formal de atenção (MBCT) 10 min/dia; registro de gatilhos e respostas.</li>`;
    }
    if(tags.includes('existencial')||tags.includes('sentido')){
      html += `<li>Exercício de Logoterapia: valores de criação/experiência/atitude + uma ação de sentido/semana.</li>`;
    }
    if(tags.includes('psicossomatico')){
      html += `<li>Diário psicossomático (emoção→sensação→evento→cuidado possível).</li>`;
    }
    html += `</ul>`;

    html += `<h3 class="section-title">Segurança e Encaminhamento</h3><p>${escapeHtml(risk)}</p>`;

    html += `<h3 class="section-title">Indicadores de Progresso</h3><ul>`;
    html += `<li>Redução de sintomas-alvo e melhora do funcionamento (sono, apetite, vínculos).</li>`;
    html += `<li>Aumento de insight, simbolização e tolerância à frustração/ambivalência.</li>`;
    html += `<li>Maior autonomia para escolhas alinhadas a valores.</li>`;
    html += `</ul>`;

    html += `<h3 class="section-title">Script de Devolutiva (ao paciente)</h3>`;
    html += `<p>“${escapeHtml(nome)}, pelo que você trouxe, vamos trabalhar juntos para dar sentido a esses padrões que se repetem e aliviar o sofrimento. Vamos usar principalmente Psicanálise — com escuta profunda, nomeando conflitos e cuidando da relação terapêutica — e, quando fizer sentido, integrar práticas como atenção plena ou alinhamento de valores. A ideia é avançarmos com calma, mas com direção.”</p>`;

    html += `<h3 class="section-title">Mantra clínico</h3><p><em>${escapeHtml(mantra)}</em></p>`;

    return html;
  }

  function escapeHtml(str){
    return String(str||'').replace(/[&<>"']/g, s=> ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[s]));
  }
  function nl2br(str){ return String(str).replace(/\n/g,'<br>'); }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const data = {
      nome: fd.get('nome')?.trim(),
      idade: Number(fd.get('idade'))||0,
      tempo: fd.get('tempo')||'',
      intensidade: fd.get('intensidade')||'',
      queixas: fd.get('queixas')?.trim()||'',
      areas: (fd.getAll('areas')||[]).join(', '),
      riscos: fd.get('riscos')?.trim()||''
    };
    const html = buildResult(data);
    resultadoEl.innerHTML = html;
    resultadoSection.classList.remove('hidden');
    // scroll
    resultadoSection.scrollIntoView({behavior:'smooth', block:'start'});
  });

  $('#btnNova').addEventListener('click', ()=>{
    form.reset();
    resultadoEl.innerHTML='';
    resultadoSection.classList.add('hidden');
    window.scrollTo({top:0, behavior:'smooth'});
  });

  $('#btnCopiar').addEventListener('click', async ()=>{
    try {
      const text = resultadoEl.innerText;
      await navigator.clipboard.writeText(text);
      alert('Resumo copiado!');
    } catch(err){
      alert('Não consegui copiar automaticamente. Selecione e copie manualmente.');
    }
  });

  // PDF via html2canvas + jsPDF (sem cabeçalho/rodapé do navegador)
  $('#btnPdf').addEventListener('click', async ()=>{
    const { jsPDF } = window.jspdf || {};
    if(!jsPDF){ alert('Biblioteca jsPDF não carregou. Verifique a internet/CDN.'); return; }
    const node = resultadoEl;
    // Canvas do resultado
    const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor:'#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // dimensionar imagem para largura da página mantendo proporção
    const imgWidth = pageWidth - 20; // margens
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let y = 10;
    let remaining = imgHeight;
    // Se quebrar em múltiplas páginas
    let position = 10;
    let heightLeft = imgHeight;
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight, '', 'FAST');
    heightLeft -= (pageHeight - 20);
    while (heightLeft > 0){
      pdf.addPage();
      position = 10 - (imgHeight - heightLeft);
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight, '', 'FAST');
      heightLeft -= (pageHeight - 20);
    }
    const nomePaciente = ($('input[name="nome"]').value||'plano').replace(/[^\p{L}\p{N}_\-]+/gu,'_');
    pdf.save(`plano_${nomePaciente}.pdf`);
  });

})();