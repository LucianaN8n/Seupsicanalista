(function(){
  const $ = (sel, el=document)=>el.querySelector(sel);
  const $$ = (sel, el=document)=>Array.from(el.querySelectorAll(sel));
  const form = $('#anamneseForm');
  const resultadoSection = $('#resultadoSection');
  const resultadoEl = $('#resultado');
  const anoEl = $('#ano'); if(anoEl) anoEl.textContent = new Date().getFullYear();

  // ====== Lexicon → tags
  const lexicon = [
    {kw:[/ansiedad|p[aâ]nico|palpita|taquicard/i], tags:['ansiedade','hiperalerta','evitacao']},
    {kw:[/ins[oô]ni|sono ruim|acordar/i], tags:['insônia','ruminacao']},
    {kw:[/triste|depress|anedoni/i], tags:['humor','autoacusacao']},
    {kw:[/trauma|abuso|viol[eê]ncia|ptsd|flashback|pesadelo/i], tags:['trauma','hipervigilancia']},
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

  // ====== Técnica auxiliar por tag
  const integrations = {
    'ansiedade':['MBCT (atenção às sensações/respiração)','ACT (defusão + ação por valores)'],
    'insônia':['Higiene do sono + MBCT','Rotina circadiana estável'],
    'ruminacao':['MBCT (descentralização do pensamento)'],
    'humor':['Psicoterapia breve focal (contrato de foco)'],
    'trauma':['Psicanálise (manejo de defesas + simbolização)','Mentalização (estabilização afetiva)'],
    'adicao':['MCC (acolhimento/congruência)','ACT (urge surfing)'],
    'compulsao':['ACT (defusão + valores)','Psicossomática (emoção→corpo)'],
    'relacional':['Psicanálise sistêmica (padrões transgeracionais)','Herança emocional'],
    'familia':['Genograma 3 gerações + papéis','Herança emocional'],
    'sistemico':['Terapia Sistêmica focal'],
    'autoestima':['Terapia positiva (forças)','MCC (empatia ativa)'],
    'perfeccionismo':['ACT (aceitação da imperfeição)','MBCT (observação do crítico)'],
    'trabalho':['Psicoterapia contextual','ACT (valores ocupacionais)'],
    'estresse':['MBCT + regulação autonômica'],
    'luto':['Psicanálise do luto','MCC (presença)'],
    'obsessivo':['MBCT (observar rituais)','ACT (tolerar incerteza)'],
    'infancia':['Psicanálise infantil','Intervenção precoce'],
    'idoso':['Psicanálise no envelhecimento','Logoterapia (sentido)'],
    'sexualidade':['Psicanálise na diversidade sexual'],
    'diversidade':['Psicanálise na diversidade sexual'],
    'psicossomatico':['Psicossomática (psique-corpo)','MBCT (interocepção)'],
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
      'Medo principal é de quê exatamente? (morrer, enlouquecer, rejeição, fracasso?)',
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

  // ====== Sub-roteiros dedicados
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

  // ====== Scales builder (GAD-7 / PHQ-9)
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
    'Andar devagar ou falar tão devagar que outras pessoas possam ter notado. Ou o oposto — estar tão agitado(a) que você tem se mexido mais do que o normal',
    'Pensamentos de que seria melhor estar morto(a) ou de se machucar de alguma forma'
  ];

  function buildScaleGrid(){
    const gadGrid = document.querySelector('[data-scale="gad7"]');
    const phqGrid = document.querySelector('[data-scale="phq9"]');
    if(gadGrid){
      gad7Items.forEach((label, i)=>{
        gadGrid.insertAdjacentHTML('beforeend', itemHTML('gad7', i, label));
      });
    }
    if(phqGrid){
      phq9Items.forEach((label, i)=>{
        phqGrid.insertAdjacentHTML('beforeend', itemHTML('phq9', i, label));
      });
    }
  }
  function itemHTML(prefix, idx, label){
    return `<div class="scale-item">
      <div style="flex:1">${esc(label)}</div>
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
  function parseTags(text){
    const tags = new Set();
    lexicon.forEach(rule=> rule.kw.forEach(rx=> { if(rx.test(text)) rule.tags.forEach(t=>tags.add(t)); }));
    return Array.from(tags);
  }
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
  function pick3(array){
    const arr = array.slice();
    const out = [];
    while(arr.length && out.length<3){
      const i = Math.floor(Math.random()*arr.length);
      out.push(arr.splice(i,1)[0]);
    }
    return out;
  }
  function esc(s){ return String(s||'').replace(/[&<>\"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function nl2br(s){ return String(s).replace(/\n/g,'<br>'); }

  // ====== Questions on demand
  $('#btnPerguntar')?.addEventListener('click', ()=>{
    const fd = new FormData(form);
    const text = [fd.get('queixas')||'', (fd.getAll('areas')||[]).join(' ')].join(' ');
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
    alert('Pergunte agora:\\n• ' + qs.join('\\n• '));
  });

  // ====== Build result
  function buildHTML(data){
    const {nome, idade, tempo, intensidade, queixas, areas, riscos, gad7, phq9} = data;
    const tags = parseTags([queixas, areas].join(' '));
    const addOns = Array.from(new Set(tags.flatMap(t=>integrations[t]||[])));
    const risk = riskMessage(riscos, intensidade);
    const goals = goalsByTags(tags);
    const subs = subRoteiros(tags);

    const now = new Date().toLocaleString('pt-BR');
    let html = `<div class="kv">
      <div><strong>Paciente</strong></div><div>${esc(nome)} (${idade} anos)</div>
      <div><strong>Data</strong></div><div>${esc(now)}</div>
      ${tempo?`<div><strong>Curso da queixa</strong></div><div>${esc(tempo)}</div>`:''}
      ${intensidade?`<div><strong>Intensidade</strong></div><div>${esc(intensidade)}</div>`:''}
      <div><strong>Queixas</strong></div><div>${nl2br(esc(queixas))}</div>
      ${areas?`<div><strong>Áreas</strong></div><div>${esc(areas)}</div>`:''}
      ${riscos?`<div><strong>Alertas</strong></div><div>${esc(riscos)}</div>`:''}
    </div>`;

    // Escalas (monitoramento)
    if(gad7 || phq9){
      html += `<h3 class="section-title">Escalas (monitoramento)</h3><ul>`;
      if(gad7){
        html += `<li>GAD-7: ${gad7.sum} (${esc(gad7.class)}) — respondidos: ${gad7.answered}/7</li>`;
      }
      if(phq9){
        html += `<li>PHQ-9: ${phq9.sum} (${esc(phq9.class)}) — respondidos: ${phq9.answered}/9</li>`;
      }
      html += `</ul><small class="helper">Uso exclusivo para acompanhamento — não é diagnóstico.</small>`;
    }

    // Hipóteses iniciais
    const hyp = [];
    if(tags.includes('trauma')) hyp.push('Trauma não-integrado com hipervigilância/evitação.'); 
    if(tags.includes('ansiedade')) hyp.push('Ansiedade sustentada por ruminação/evitação/necessidade de controle.');
    if(tags.includes('humor')) hyp.push('Humor deprimido ligado a perdas/autoacusação.');
    if(tags.includes('relacional')) hyp.push('Padrões repetitivos de vínculo (eco parental) na transferência.');
    if(tags.includes('psicossomatico')) hyp.push('Somatização como descarga de afetos pouco simbolizados.');
    if(tags.includes('existencial')||tags.includes('sentido')) hyp.push('Desalinhamento de valores e vazio de sentido.');
    if(hyp.length){
      html += `<h3 class="section-title">Hipóteses clínicas iniciais</h3><ul>` + hyp.map(h=>`<li>${esc(h)}</li>`).join('') + `</ul>`;
    }

    // Roteiro de sessão (minutagem)
    html += `<h3 class="section-title">Roteiro de Atendimento (minutagem)</h3><ol>` +
    [['0–3 min','Revisar enquadre e foco micro (uma cena).'],
     ['3–10 min','Fala livre orientada: cenas específicas, não resumos.'],
     ['10–25 min','Explorar defesas/afetos/transferência; usar perguntas cirúrgicas.'],
     ['25–40 min','Intervir: clarificar, confrontar com empatia, interpretar.'],
     ['40–50 min','Síntese, tarefa e métrica (0–10).'],
     ['50–55 min','Próximos passos e triagem de risco.']].map(([t,d])=>`<li><strong>${esc(t)}:</strong> ${esc(d)}</li>`).join('') + `</ol>`;

    // Eixo psicanalítico
    html += `<h3 class="section-title">Eixo Psicanalítico</h3><ul>` +
      ['Setting/limites e foco por cena',
       'Transferência e defesas: nomear função/custo',
       'Interpretação graduada e experiências corretivas entre sessões',
       'Revisões a cada 4–6 sessões; supervisão quando necessário'
      ].map(x=>`<li>${esc(x)}</li>`).join('') + `</ul>`;

    if(addOns.length){
      html += `<h3 class="section-title">Integrações Técnicas Pertinentes</h3><ul>` +
      addOns.map(a=>`<li>${esc(a)}</li>`).join('') + `</ul>`;
    }

    // Sub-roteiros
    if(subs.length){
      html += `<h3 class="section-title">Sub-roteiros por População</h3>`;
      subs.forEach(([t, arr])=>{
        html += `<h4><span class="badge">População</span> ${esc(t)}</h4><ul>${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
      });
    }

    // Plano de ação
    function actionPlan(tags){
      const pl = [];
      pl.push(['Semana 1 • Estabilização', [
        'Ritual de presença diária (2×/dia, 3–5 min): respiração + nota corporal (MBCT).',
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
        ...(tags.includes('ansiedade')||tags.includes('ruminacao') ? ['Exposição leve (1 situação/semana) com defusão/respiração.'] : []),
        ...(tags.includes('sentido')||tags.includes('existencial') ? ['Ato de sentido: 1 ação pequena alinhada a valores.'] : []),
        'Ensaio de script para a cena-problema (o que fará diferente).'
      ]]);
      pl.push(['Semana 4 • Consolidação', [
        'Revisar indicadores (sintomas, funcionamento, vínculos).',
        'Plano de continuidade (frequência/focos) + prevenção de recaída (gatilhos e respostas).'
      ]]);
      pl.push(['Continuado', [
        'Revisão a cada 4–6 sessões; ajustar foco/técnicas conforme resposta.',
        'Supervisão para impasses/risco.'
      ]]);
      return pl;
    }
    const plan = actionPlan(tags);
    html += `<h3 class="section-title">Plano de Ação (4 semanas + continuidade)</h3>` + 
      plan.map(([t, arr])=> `<h4><span class="badge">Fase</span> ${esc(t)}</h4><ul>${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`).join('');

    // Metas
    html += `<h3 class="section-title">Metas e Métricas</h3><ul>` + goals.map(g=>`<li>${esc(g)}</li>`).join('') + `</ul>`;

    // Segurança
    html += `<h3 class="section-title">Segurança & Encaminhamento</h3><p>${esc(risk)}</p><ul><li>Encaminhar para avaliação médica/psiquiátrica quando aplicável.</li><li>Supervisão em impasses técnicos/contratransferência intensa.</li></ul>`;

    // Script de devolutiva
    html += `<h3 class="section-title">Devolutiva ao Paciente (script)</h3>`;
    html += `<blockquote>“${esc(nome)}, vamos trabalhar cenas específicas nas quais esse padrão aparece. Eu vou nomear o que se repete entre nós e nos seus vínculos, conectando com experiências antigas quando fizer sentido. Quando surgir ansiedade/ruminação, testaremos recursos práticos (atenção ao corpo, exposição leve, atos de sentido). Entre as sessões, combinamos pequenas experiências para você ensaiar o ‘novo’.”</blockquote>`;

    html += `<small class="helper">Hipóteses são clínicas (não diagnósticas). Use o roteiro como bússola, não como script rígido.</small>`;
    return html;
  }

  // ====== Form submit
  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    // Read scales
    const g = readScale('gad7', 7); const p = readScale('phq9', 9);
    const gad7 = g.answered ? {sum:g.sum, answered:g.answered, class: classifyGAD7(g.sum)} : null;
    const phq9 = p.answered ? {sum:p.sum, answered:p.answered, class: classifyPHQ9(p.sum)} : null;

    const data = {
      nome: (fd.get('nome')||'').trim(),
      idade: Number(fd.get('idade'))||0,
      tempo: fd.get('tempo')||'',
      intensidade: fd.get('intensidade')||'',
      queixas: (fd.get('queixas')||'').trim(),
      areas: (fd.getAll('areas')||[]).join(', '),
      riscos: (fd.get('riscos')||'').trim(),
      gad7, phq9
    };
    resultadoEl.innerHTML = buildHTML(data);
    resultadoSection.classList.remove('hidden');
    resultadoSection.scrollIntoView({behavior:'smooth', block:'start'});
  });

  // ====== Basic actions
  $('#btnNova')?.addEventListener('click', ()=>{
    form.reset();
    resultadoEl.innerHTML='';
    resultadoSection.classList.add('hidden');
    window.scrollTo({top:0, behavior:'smooth'});
  });
  $('#btnCopiar')?.addEventListener('click', async ()=>{
    try{ await navigator.clipboard.writeText(resultadoEl.innerText); alert('Resumo copiado!'); }
    catch{ alert('Não consegui copiar automaticamente. Selecione e copie manualmente.'); }
  });
  $('#btnPdf')?.addEventListener('click', async ()=>{
    const { jsPDF } = window.jspdf || {};
    if(!jsPDF){ alert('Biblioteca jsPDF não carregou. Verifique a internet/CDN.'); return; }
    const node = resultadoEl;
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
    const paciente = (document.querySelector('input[name="nome"]')?.value||'plano').replace(/[^\p{L}\p{N}_\-]+/gu,'_');
    pdf.save(`plano_${paciente}_v3.pdf`);
  });

  // ====== init
  function init(){ buildScaleGrid(); }
  document.addEventListener('DOMContentLoaded', init);
})();