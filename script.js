// Tabs
document.querySelectorAll('.tab-button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc=>tc.classList.remove('active'));
    btn.classList.add('active');
    const pane = document.getElementById('tab-'+btn.dataset.tab);
    if(pane) pane.classList.add('active');
  });
});

// Galería (carga con manifest o fallback)
const gallery = document.getElementById('gallery');
const filterBar = document.getElementById('filterBar');
const editToggle = document.getElementById('editToggle');
const OV_KEY='media_overrides_v1';

const embeddedMedia = (()=>{
  const list = [];
  for(let i=1;i<=60;i++){ list.push({src:`assets/img/alangasi-${i}.jpg`, type:'image', category:'Procesión', caption:'Corpus Christi en Alangasí'}); }
  for(let i=1;i<=10;i++){ list.push({src:`assets/video/video-${i}.mp4`, type:'video', category:'Procesión', caption:'Comparsas y música'}); }
  list.push({src:'assets/img/danzante-silueta.svg', type:'image', category:'Danzas', caption:'Silueta CC0 del danzante'});
  return list;
})();

async function loadManifest(){
  try{
    const resp = await fetch('assets/media.json', {cache:'no-cache'});
    if(!resp.ok) throw new Error('no manifest');
    const data = await resp.json();
    const overrides = JSON.parse(localStorage.getItem(OV_KEY)||'{}');
    return data.media.map(m=> ({...m, ...(overrides[m.src]||{})}));
  }catch(e){
    const overrides = JSON.parse(localStorage.getItem(OV_KEY)||'{}');
    return embeddedMedia.map(m=> ({...m, ...(overrides[m.src]||{})}));
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
    b.addEventListener('click',()=>renderGallery(items,c));
    filterBar.appendChild(b);
  });
}
function renderGallery(items, category='Todos'){
  if(!gallery) return;
  gallery.innerHTML='';
  renderFilters(items, category);
  const shown = items.filter(i=> category==='Todos' || i.category===category);
  shown.forEach(item=>{
    const tile = document.createElement('div'); tile.className='tile';
    const fig = document.createElement('figure');
    if(item.type==='image'){
      const img = new Image(); img.src=item.src; img.alt=item.caption||'Imagen'; img.loading='lazy';
      img.onerror = ()=>{ fig.innerHTML='<div style="padding:1rem">Archivo no encontrado</div>'; };
      fig.appendChild(img);
    } else {
      const v = document.createElement('video'); v.src=item.src; v.controls=true; v.playsInline=true; v.preload='metadata';
      v.onerror = ()=>{ fig.innerHTML='<div style="padding:1rem">Video no disponible</div>'; };
      fig.appendChild(v);
    }
    const cap = document.createElement('figcaption'); cap.textContent=item.caption||'';
    if(editToggle){ cap.contentEditable = editToggle.checked; cap.className = editToggle.checked ? 'editable' : ''; }
    cap.addEventListener('input',()=>saveOverride(item.src,{caption:cap.textContent}));
    fig.appendChild(cap); tile.appendChild(fig);

    const meta = document.createElement('div'); meta.className='cap';
    if(editToggle){
      const sel = document.createElement('select');
      ['Procesión','Danzas','Gigantones','Altares','Músicos','Infancia','Otros'].forEach(opt=>{
        const o = document.createElement('option'); o.value=opt; o.textContent=opt; if((item.category||'Procesión')===opt) o.selected=true; sel.appendChild(o);
      });
      sel.disabled = !editToggle.checked; if(editToggle.checked) sel.className='editable';
      sel.addEventListener('change',()=>{ saveOverride(item.src,{category:sel.value}); renderGallery(items, sel.value); });
      meta.appendChild(sel);
    } else {
      meta.innerHTML = `<small>Categoría: <b>${item.category||'Procesión'}</b></small>`;
    }
    tile.appendChild(meta);
    gallery.appendChild(tile);
  });
}
document.addEventListener('DOMContentLoaded', async ()=>{
  const items = await loadManifest();
  renderGallery(items, 'Todos');
  if(editToggle){
    editToggle.addEventListener('change', async ()=>{
      const items2 = await loadManifest();
      renderGallery(items2, 'Todos');
    });
  }
});

// Trivia
const triviaHost = document.getElementById('trivia');
const triviaQs = [
  {q:'¿Qué palabra describe la mezcla de tradiciones andinas y católicas?', a:['Sincretismo','Modernización','Secularización'], ok:0},
  {q:'¿Qué celebra el Corpus Christi dentro del catolicismo?', a:['La Eucaristía','El Año Nuevo','El Carnaval'], ok:0},
  {q:'¿Qué símbolo andino aparece en los trajes de danzantes?', a:['Cóndor','Delfín','Ballena'], ok:0},
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
      btn.addEventListener('click', ()=>{ if(idx===t.ok){ btn.style.background='#000'; btn.style.color='#fff'; } else { btn.style.background='#fff'; btn.style.color='#000'; btn.style.borderColor='#000'; }});
      box.appendChild(btn);
    });
    triviaHost.appendChild(box);
  });
}
renderTrivia();

// Línea del tiempo (scrollable, por años)
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
  const width = 2000; // px
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

// Memorama con explicaciones
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
          if(matched===deck.length){ setTimeout(()=>alert('¡Memorama completo! Conversa qué significa cada símbolo.'),200); }
        } else {
          lock=true; setTimeout(()=>{ first.textContent='?'; card.textContent='?'; first=null; lock=false; }, 600);
        }
      }
    });
    mem.appendChild(card);
  });
}

// Viste al danzante (drag & drop sobre silueta CC0)
const avatar = document.querySelector('.avatar');
if(avatar){
  document.querySelectorAll('.item').forEach(it=> it.addEventListener('dragstart', e=> e.dataTransfer.setData('text/plain', it.dataset.slot)));
  avatar.addEventListener('dragover', e=> e.preventDefault());
  avatar.addEventListener('drop', e=>{
    e.preventDefault();
    const slot = e.dataTransfer.getData('text/plain');
    const target = avatar.querySelector(`.drop-slot[data-slot="${slot}"]`);
    if(target){ target.textContent = `✓ ${slot} colocado`; target.style.borderColor='#10b981'; }
  });
}

// Plantillas (SVG imprimible)
document.getElementById('printTemplates')?.addEventListener('click', ()=>{ window.open('assets/templates/plantillas-mascaras-CC0.svg','_blank'); });

// Relatos (igual que antes)
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
