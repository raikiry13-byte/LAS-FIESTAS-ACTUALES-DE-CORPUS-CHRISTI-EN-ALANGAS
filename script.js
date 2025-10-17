// ========================== TABS ==========================
document.querySelectorAll('.tab-button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc=>tc.classList.remove('active'));
    btn.classList.add('active');
    const pane = document.getElementById('tab-'+btn.dataset.tab);
    if(pane) pane.classList.add('active');
  });
});

// ========================== GALERÍA (SLIDER CON FILTROS) ==========================
const filterBar = document.getElementById('filterBar');
const editToggle = document.getElementById('editToggle');
const OV_KEY='media_overrides_v1';

// Elementos del slider
const sPrev = document.getElementById('sPrev');
const sNext = document.getElementById('sNext');
const sImg  = document.getElementById('sImg');
const sVid  = document.getElementById('sVid');
const sCap  = document.getElementById('sCap');
const sMeta = document.getElementById('sMeta');
const sCount= document.getElementById('sCount');
const sStage= document.getElementById('sStage');

let ALL_ITEMS = [];
let SHOWN = [];
let IDX = 0;

// Detecta automáticamente qué fotos existen en assets/img/alangasi-#.jpg
async function detectImages(min=1, max=28) {
  const promises = [];
  const found = [];
  for (let i=min; i<=max; i++){
    const src = `assets/img/alangasi-${i}.jpg`;
    promises.push(new Promise(resolve=>{
      const im = new Image();
      im.onload = ()=>{ 
        found.push({ src, type:'image', category:'Procesión', caption:'Corpus Christi en Alangasí' });
        resolve();
      };
      im.onerror = ()=> resolve();
      im.src = src + `?v=${Date.now()}`; // evitar caché
    }));
  }
  await Promise.all(promises);
  found.sort((a,b)=>{
    const na = parseInt(a.src.match(/alangasi-(\d+)\.jpg/)[1],10);
    const nb = parseInt(b.src.match(/alangasi-(\d+)\.jpg/)[1],10);
    return na - nb;
  });
  return found;
}

// Carga manifest si existe; si no, usa autodetección + overrides locales
async function loadManifest(){
  try{
    const resp = await fetch('assets/media.json', {cache:'no-cache'});
    if(!resp.ok) throw new Error('no manifest');
    const data = await resp.json();
    const overrides = JSON.parse(localStorage.getItem(OV_KEY)||'{}');
    return data.media.map(m=> ({...m, ...(overrides[m.src]||{})}));
  }catch(e){
    const base = await detectImages(1,28); // ← si subes más, cambia 28 por el último número
    const overrides = JSON.parse(localStorage.getItem(OV_KEY)||'{}');
    return base.map(m=> ({...m, ...(overrides[m.src]||{})}));
  }
}

function saveOverride(src, patch){
  const ov = JSON.parse(localStorage.getItem(OV_KEY)||'{}');
  ov[src] = {...(ov[src]||{}), ...patch};
  localStorage.setItem(OV_KEY, JSON.stringify(ov));
}
function unique(a){ return [...new Set(a)]; }

function renderFilters(items, current='Todos'){
  if(!filterBar) return;
  filterBar.innerHTML='';
  const cats = ['Todos', ...unique(items.map(i=>i.category||'Procesión'))];
  cats.forEach(c=>{
    const b=document.createElement('button');
    b.className='filter-btn' + (c===current?' active':'');
    b.textContent=c;
    b.addEventListener('click',()=>applyFilter(c));
    filterBar.appendChild(b);
  });
}

function show(i){
  if(!SHOWN.length) return;
  IDX = (i + SHOWN.length) % SHOWN.length;
  const item = SHOWN[IDX];

  if(item.type==='image'){
    sVid.pause(); sVid.style.display='none';
    sImg.style.display='block'; sImg.src=item.src; sImg.alt=item.caption||'';
  } else {
    sImg.style.display='none';
    sVid.style.display='block'; sVid.src=item.src;
  }

  sCap.textContent = item.caption || '';
  if(editToggle){
    sCap.contentEditable = editToggle.checked;
    sCap.className = editToggle.checked ? 'editable' : '';
    sCap.oninput = ()=> saveOverride(item.src,{caption:sCap.textContent});
  }
  sMeta.textContent = item.category ? `Categoría: ${item.category}` : '';
  sCount.textContent = `${IDX+1} / ${SHOWN.length}`;
}

function applyFilter(cat='Todos'){
  SHOWN = (cat==='Todos') ? ALL_ITEMS : ALL_ITEMS.filter(i=> i.category===cat);
  renderFilters(ALL_ITEMS, cat);
  show(0);
}

// Controles
sPrev?.addEventListener('click', ()=> show(IDX-1));
sNext?.addEventListener('click', ()=> show(IDX+1));
document.addEventListener('keydown', (e)=>{
  if(e.key==='ArrowLeft') show(IDX-1);
  if(e.key==='ArrowRight') show(IDX+1);
});
let tx=0;
sStage?.addEventListener('touchstart', e=> tx = e.changedTouches[0].clientX);
sStage?.addEventListener('touchend', e=>{
  const dx = e.changedTouches[0].clientX - tx;
  if(Math.abs(dx)>40) (dx<0 ? show(IDX+1) : show(IDX-1));
});

// Inicializar galería
document.addEventListener('DOMContentLoaded', async ()=>{
  ALL_ITEMS = await loadManifest();
  applyFilter('Todos');
  if(editToggle){
    editToggle.addEventListener('change', async ()=>{
      ALL_ITEMS = await loadManifest();
      applyFilter('Todos');
    });
  }
});

// ========================== TRIVIA ==========================
const triviaHost = document.getElementById('trivia');
const triviaQs = [
  {q:'¿Qué palabra describe la mezcla de tradiciones andinas y católicas?', a:['Sincretismo','Modernización','Secularización'], ok:0},
  {q:'¿Qué celebra el Corpus Christi dentro del catolicismo?', a:['La Eucaristía','El Año Nuevo','El Carnaval'], ok:0},
  {q:'¿Qué símbolo andino aparece en los trajes de danzantes?', a:['Cóndor','Delfín','Ballena'], ok:0},
  {q:'¿Qué elementos del Corpus Christi provienen de prácticas prehispánicas?', a:['Figurina','Trompeta','Sombreros'], ok:0 },
];
function renderTrivia(){
  if(!triviaHost) return;
  triviaHost.innerHTML = '';
  triviaQs.forEach((t,i)=>{
    const box = document.createElement('div'); box.style.marginBottom='8px';
    const p = document.createElement('p'); p.innerHTML = `<b>${i+1}.</b> ${t.q}`;
    box.appendChild(p);
    t.a.forEach((opt,idx)=>{
      const btn = document.createElement('button'); btn.textContent = opt; btn.style.marginRight='6px'; btn.className='tab-button';
      btn.addEventListener('click', ()=>{ 
        if(idx===t.ok){ btn.style.background='#000'; btn.style.color='#fff'; } 
        else { btn.style.background='#fff'; btn.style.color='#000'; btn.style.borderColor='#000'; }
      });
      box.appendChild(btn);
    });
    triviaHost.appendChild(box);
  });
}
renderTrivia();

// ========================== LÍNEA DEL TIEMPO ==========================
const tlRail = document.getElementById('timeline');
const tlInner = document.getElementById('timelineInner');
const tlRange = document.getElementById('tlRange');
const tlNote = document.getElementById('tlNote');
const tlEvents = [
  {year:1200, note:'S. XIII: Se consolidan celebraciones eucarísticas en Europa.'},
  {year:1500, note:'S. XVI: Llega a los Andes en tiempos coloniales.'},
  {year:1600, note:'S. XVII: Se afianzan procesiones y comparsas locales.'},
  {year:1900, note:'S. XX: La fiesta se adapta a nuevos contextos urbanos.'},
  {year:2000, note:'S. XXI: Patrimonio vivo, participación juvenil y escuelas.'},
  {year:2024, note:'Actualidad: celebración comunitaria con identidad andina.'}
];
function renderTimeline(){
  if(!tlInner) return;
  tlInner.innerHTML='';
  const min=1200, max=2025;
  const width = 2000; 
  tlInner.style.minWidth = width+'px';
  tlEvents.forEach(e=>{
    const x = (e.year-min)/(max-min) * width;
    const dot = document.createElement('div'); dot.className='tl-dot'; dot.style.left = x+'px'; dot.title=e.note;
    const lab = document.createElement('div'); lab.className='tl-label'; lab.style.left = x+'px'; lab.textContent = e.year;
    dot.addEventListener('click', ()=> tlNote.textContent = e.year+': '+e.note);
    lab.addEventListener('click', ()=> tlNote.textContent = e.year+': '+e.note);
    tlInner.appendChild(dot); tlInner.appendChild(lab);
  });
}
renderTimeline();
if(tlRange && tlRail){
  tlRange.addEventListener('input', ()=>{
    const min=1200, max=2025, width = tlInner.getBoundingClientRect().width;
    const pos = (tlRange.value-min)/(max-min) * (width - tlRail.clientWidth);
    tlRail.scrollTo({left: pos, behavior:'smooth'});
  });
}

// ========================== MEMORAMA ==========================
const mem = document.getElementById('memory');
const memExplain = document.getElementById('memExplain');
if(mem){
  const symbols = ['☀️','🌽','🕊️','🪶','🥁','🪗','🪙','🕯️'];
  const explain = {
    '☀️':'Sol (Inti): ciclo agrícola y energía vital.',
    '🌽':'Maíz: alimento sagrado y ofrenda comunitaria.',
    '🕊️':'Paloma: paz y dimensión espiritual de la fiesta.',
    '🪶':'Plumas: vínculo con aves andinas y libertad.',
    '🥁':'Tambor: ritmo para la procesión y las danzas.',
    '🪗':'Acordeón: música popular en comparsas.',
    '🪙':'Monedas: mayordomías y economía de la fiesta.',
    '🕯️':'Vela: luz, promesas y memoria familiar.'
  };
  let deck = symbols.concat(symbols).sort(()=>Math.random()-0.5);
  let first=null, lock=false, matched=0;
  const added = new Set();
  function addExplain(sym){
    if(added.has(sym) || !memExplain) return;
    const li = document.createElement('li'); li.textContent = explain[sym] || sym;
    memExplain.appendChild(li); added.add(sym);
  }
  deck.forEach((s)=>{
    const card = document.createElement('div'); card.className='mem-card'; card.dataset.symbol=s; card.textContent='?';
    card.addEventListener('click', ()=>{
      if(lock || card.classList.contains('matched') || card===first) return;
      card.textContent = s;
      if(!first){ first = card; }
      else {
        if(first.dataset.symbol===s){
          first.classList.add('matched'); card.classList.add('matched'); matched+=2; addExplain(s); first=null;
          if(matched===deck.length){ setTimeout(()=>alert('¡Memorama completo! ¿Qué símbolos relacionados al Corpus Christi o a la ritualidad andina reconoces en tu entorno cotidiano? Escribelo en los comentarios.'),200); }
        } else {
          lock=true; setTimeout(()=>{ first.textContent='?'; card.textContent='?'; first=null; lock=false; }, 600);
        }
      }
    });
    mem.appendChild(card);
  });
}

// ========================== VISTE AL DANZANTE (CAPAS + MENSAJE FINAL) ==========================
(function setupDressUp(){
  const avatar = document.querySelector('.avatar');
  if(!avatar) return;

  // Capas por parte (deben existir en el HTML con estos IDs)
  const layers = {
    cabeza:     document.getElementById('layer-cabeza'),
    pechera:    document.getElementById('layer-pechera'),
    faldon:     document.getElementById('layer-faldon'),
    brazaletes: document.getElementById('layer-brazaletes'),
  };

  const requiredParts = Object.keys(layers);
  const placed = new Set();

  function equip(part, src){
    const layer = layers[part];
    if(!layer) return;
    layer.src = src;
    layer.style.display = 'block';
    placed.add(part);
    checkCompletion();
  }

  // Permite quitar una prenda con doble clic sobre la capa
  Object.entries(layers).forEach(([part, layer])=>{
    layer?.addEventListener('dblclick', ()=>{
      layer.src = '';
      layer.style.display = 'none';
      placed.delete(part);
    });
  });

  // Arrastrar piezas (imagenes con class="item" y data-part)
  document.querySelectorAll('.item[data-part]').forEach(img=>{
    img.addEventListener('dragstart', e=>{
      e.dataTransfer.setData('part', img.dataset.part);
      e.dataTransfer.setData('src', img.getAttribute('src'));
    });
    // Doble clic para equipar sin arrastrar
    img.addEventListener('dblclick', ()=>{
      equip(img.dataset.part, img.getAttribute('src'));
    });
  });

  avatar.addEventListener('dragover', e=> e.preventDefault());
  avatar.addEventListener('drop', e=>{
    e.preventDefault();
    const part = e.dataTransfer.getData('part');
    const src  = e.dataTransfer.getData('src');
    if(part && src) equip(part, src);
  });

  function checkCompletion(){
    if(placed.size === requiredParts.length){
      setTimeout(()=>{
        alert(
          '🎭 A los participantes del juego:\n\nEn el área de comentarios, escribe cómo te identificas o cómo sientes que se refleja tu herencia cultural en este tipo de vestimenta.'
        );
      }, 300);
    }
  }
})();

// ========================== PLANTILLAS (PDF) ==========================
document.getElementById('printTemplates')?.addEventListener('click', ()=>{ 
  window.open('assets/templates/plantillas-mascaras.pdf','_blank'); 
});

// ========================== RELATOS ==========================
const RKEY='relatos_cc_alangasi';
const relForm = document.getElementById('relatoForm');
const relList = document.getElementById('relatosList');
function loadRel(){ try{return JSON.parse(localStorage.getItem(RKEY)||'[]')}catch(e){return []} }
function saveRel(d){ localStorage.setItem(RKEY, JSON.stringify(d)) }
function renderRel(){
  if(!relList) return;
  const data = loadRel();
  relList.innerHTML='';
  data.forEach((r,idx)=>{
    const card = document.createElement('div'); card.className='tile';
    card.innerHTML = `<div style="padding:10px"><h4>${r.title}</h4>
      <small>Por ${r.name||'Anónimo'} — ${r.age||''} — ${r.com||''}</small><p>${r.body}</p>
      <button data-i="${idx}" class="btn-like">Eliminar</button></div>`;
    card.querySelector('.btn-like').addEventListener('click', e=>{
      const i = parseInt(e.target.dataset.i); const arr = loadRel(); arr.splice(i,1); saveRel(arr); renderRel();
    });
    relList.appendChild(card);
  });
}
if(relForm){
  relForm.addEventListener('submit', e=>{
    e.preventDefault();
    const data = loadRel();
    data.unshift({name:document.getElementById('rName').value,
                  age:document.getElementById('rAge').value,
                  com:document.getElementById('rCom').value,
                  title:document.getElementById('rTitle').value,
                  body:document.getElementById('rBody').value});
    saveRel(data); relForm.reset(); renderRel();
  });
  document.getElementById('exportRelatos').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(loadRel(),null,2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'relatos.json'; a.click();
  });
  document.getElementById('importFile').addEventListener('change', e=>{
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader(); r.onload = ev=>{ saveRel(JSON.parse(ev.target.result)); renderRel(); };
    r.readAsText(f);
  });
  renderRel();
}
