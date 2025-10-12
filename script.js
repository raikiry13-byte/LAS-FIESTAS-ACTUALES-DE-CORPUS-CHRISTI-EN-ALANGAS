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

// Galería con filtros (fallback si media.json no carga)
const gallery = document.getElementById('gallery');
const filterBar = document.getElementById('filterBar');
const editToggle = document.getElementById('editToggle');
const OV_KEY='media_overrides_v1';

const embeddedMedia = (()=>{
  const list = [];
  for(let i=1;i<=60;i++){
    list.push({src:`assets/img/alangasi-${i}.jpg`, type:'image', category:'Procesión', caption:'Corpus Christi en Alangasí'});
  }
  for(let i=1;i<=10;i++){
    list.push({src:`assets/video/video-${i}.mp4`, type:'video', category:'Procesión', caption:'Comparsas y música'});
  }
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
  triviaHost.innerHTML='';
  triviaQs.forEach((t,i)=>{
    const box = document.createElement('div'); box.style.marginBottom='8px';
    const p = document.createElement('p'); p.innerHTML = `<b>${i+1}.</b> ${t.q}`;
    box.appendChild(p);
    t.a.forEach((opt,idx)=>{
      const btn = document.createElement('button'); btn.textContent = opt; btn.style.marginRight='6px'; btn.className='tab-button';
      btn.addEventListener('click', ()=>{ if(idx===t.ok){ btn.style.background='#10b981'; btn.style.color='#fff'; } else { btn.style.background='#ef4444'; btn.style.color='#fff'; } });
      box.appendChild(btn);
    });
    triviaHost.appendChild(box);
  });
}
renderTrivia();

// Línea del tiempo
const tl = document.getElementById('timeline');
const facts = [
  {year:'s. XIII', text:'La fiesta del Corpus Christi se institucionaliza en Europa.'},
  {year:'s. XVI', text:'Llega a los Andes y se integra a rituales agrícolas de junio.'},
  {year:'Hoy', text:'La comunidad celebra danzas, ofrendas y procesión en sincretismo.'}
];
if(tl){
  tl.innerHTML='';
  facts.forEach(f=>{ const b = document.createElement('span'); b.className='badge'; b.title=f.text; b.textContent=f.year; tl.appendChild(b); });
}

// Memorama
const mem = document.getElementById('memory');
if(mem){
  const symbols = ['☀️','🌽','🕊️','🪶','🥁','🪗','🪙','🕯️'];
  let deck = symbols.concat(symbols).sort(()=>Math.random()-0.5);
  let first=null, lock=false, matched=0;
  deck.forEach((s)=>{
    const card = document.createElement('div'); card.className='mem-card'; card.dataset.symbol=s; card.textContent='?';
    card.addEventListener('click', ()=>{
      if(lock || card.classList.contains('matched') || card===first) return;
      card.textContent = s;
      if(!first){ first = card; }
      else {
        if(first.dataset.symbol===s){ first.classList.add('matched'); card.classList.add('matched'); matched+=2; first=null; if(matched===deck.length){ setTimeout(()=>alert('¡Memorama completo! Conversa qué significa cada símbolo.'),200); } }
        else { lock=true; setTimeout(()=>{ first.textContent='?'; card.textContent='?'; first=null; lock=false; }, 600); }
      }
    });
    mem.appendChild(card);
  });
}

// Viste al danzante
const avatar = document.getElementById('avatar');
if(avatar){
  ['cabeza','pechera','faldon','brazaletes'].forEach(slot=>{
    const span = document.createElement('span'); span.className='drop-slot'; span.dataset.slot=slot;
    span.textContent = `Zona: ${slot}`; avatar.appendChild(document.createElement('br')); avatar.appendChild(span);
  });
  document.querySelectorAll('.item').forEach(it=> it.addEventListener('dragstart', e=> e.dataTransfer.setData('text/plain', it.dataset.slot)));
  avatar.addEventListener('dragover', e=> e.preventDefault());
  avatar.addEventListener('drop', e=>{ e.preventDefault(); const slot = e.dataTransfer.getData('text/plain'); const target = Array.from(avatar.querySelectorAll('.drop-slot')).find(s=>s.dataset.slot===slot); if(target){ target.textContent = `✓ ${slot} colocado`; target.style.borderColor='#10b981'; } });
}

// Plantillas (SVG imprimible)
document.getElementById('printTemplates')?.addEventListener('click', ()=>{ window.open('assets/templates/plantillas-mascaras-CC0.svg','_blank'); });
