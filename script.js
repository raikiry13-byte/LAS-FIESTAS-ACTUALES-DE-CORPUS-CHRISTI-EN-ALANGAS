
// Tabs
document.querySelectorAll('.tab-button').forEach(btn=>{
  btn.addEventListener('click', e=>{
    document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc=>tc.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
  });
});

// Gallery loader

const gallery = document.getElementById('gallery');
const filterBar = document.getElementById('filterBar');
const editToggle = document.getElementById('editToggle');
const OV_KEY='media_overrides_v1';

async function loadManifest(){
  const resp = await fetch('assets/media.json');
  const data = await resp.json();
  // Merge overrides
  const overrides = JSON.parse(localStorage.getItem(OV_KEY)||'{}');
  return data.media.map(m=> ({...m, ...(overrides[m.src]||{})}));
}

function saveOverride(src, patch){
  const ov = JSON.parse(localStorage.getItem(OV_KEY)||'{}');
  ov[src] = {...(ov[src]||{}), ...patch};
  localStorage.setItem(OV_KEY, JSON.stringify(ov));
}

function unique(arr){ return [...new Set(arr)]; }

function renderFilters(items, current='Todos'){
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
  gallery.innerHTML='';
  renderFilters(items, category);
  const shown = items.filter(i=>category==='Todos' or i.category===category);
  shown.forEach(item=>{
    const tile = document.createElement('div'); tile.className='tile';
    const fig = document.createElement('figure');
    if(item.type==='image'){
      const img = new Image(); img.src=item.src; img.alt=item.caption||'Imagen de la fiesta'; img.loading='lazy';
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

    // Selector de categoría en modo edición
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
const triviaQs = [
  {q:'¿Qué palabra describe la mezcla de tradiciones andinas y católicas?',
   a:['Sincretismo','Modernización','Secularización'], ok:0},
  {q:'¿Qué celebra el Corpus Christi dentro del catolicismo?', a:['La Eucaristía','El Año Nuevo','El Carnaval'], ok:0},
  {q:'¿Qué símbolo andino aparece en los trajes de danzantes?', a:['Cóndor','Delfín','Ballena'], ok:0},
];
const triviaHost = document.getElementById('trivia');
function renderTrivia(){
  triviaHost.innerHTML = '';
  triviaQs.forEach((t,i)=>{
    const box = document.createElement('div'); box.style.marginBottom='8px';
    const p = document.createElement('p'); p.innerHTML = `<b>${i+1}.</b> ${t.q}`;
    box.appendChild(p);
    t.a.forEach((opt,idx)=>{
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.style.marginRight='6px'; btn.className='tab-button';
      btn.addEventListener('click', ()=>{
        if(idx===t.ok){ btn.style.background='#10b981'; btn.style.color='#fff';}
        else { btn.style.background='#ef4444'; btn.style.color='#fff'; }
      });
      box.appendChild(btn);
    });
    triviaHost.appendChild(box);
  });
}
renderTrivia();

// Timeline simple
const facts = [
  {year:'s. XIII', text:'La fiesta del Corpus Christi se institucionaliza en Europa.'},
  {year:'s. XVI', text:'Llega a los Andes y se integra a rituales agrícolas de junio.'},
  {year:'Hoy', text:'La comunidad celebra danzas, ofrendas y procesión en sincretismo.'}
];
const tl = document.getElementById('timeline');
facts.forEach(f=>{
  const b = document.createElement('span'); b.className='badge'; b.title=f.text; b.textContent=f.year;
  tl.appendChild(b);
});

// Memory
const symbols = ['☀️','🌽','🕊️','🪶','🥁','🪗','🪙','🕯️'];
let deck = symbols.concat(symbols).sort(()=>Math.random()-0.5);
const mem = document.getElementById('memory');
let first=null, lock=false, matched=0;
deck.forEach((s,i)=>{
  const card = document.createElement('div'); card.className='mem-card'; card.dataset.symbol=s; card.textContent='?';
  card.addEventListener('click', ()=>{
    if(lock || card.classList.contains('matched') || card===first) return;
    card.textContent = s;
    if(!first){ first = card; }
    else {
      if(first.dataset.symbol===s){ first.classList.add('matched'); card.classList.add('matched'); matched+=2; first=null;
        if(matched===deck.length){ setTimeout(()=>alert('¡Memorama completo! Comparte qué significa cada símbolo.'),200); }
      } else {
        lock=true;
        setTimeout(()=>{ first.textContent='?'; card.textContent='?'; first=null; lock=false; }, 600);
      }
    }
  });
  mem.appendChild(card);
});

// Drag & Drop "viste al danzante"
const avatar = document.getElementById('avatar');
['cabeza','pechera','faldon','brazaletes'].forEach(slot=>{
  const span = document.createElement('span'); span.className='drop-slot'; span.dataset.slot=slot;
  span.textContent = `Zona: ${slot}`; avatar.appendChild(document.createElement('br')); avatar.appendChild(span);
});
document.querySelectorAll('.item').forEach(it=>{
  it.addEventListener('dragstart', e=> e.dataTransfer.setData('text/plain', it.dataset.slot));
});
avatar.addEventListener('dragover', e=> e.preventDefault());
avatar.addEventListener('drop', e=>{
  e.preventDefault();
  const slot = e.dataTransfer.getData('text/plain');
  const target = Array.from(avatar.querySelectorAll('.drop-slot')).find(s=>s.dataset.slot===slot);
  if(target){ target.textContent = `✓ ${slot} colocado`; target.style.borderColor='#10b981'; }
});

// Print button
document.getElementById('printTemplates').addEventListener('click', ()=>{
  window.open('assets/templates/plantillas-mascaras-CC0.pdf', '_blank');
});

// Relatos & Comentarios (localStorage)
const RELATOS_KEY='corpus_relatos_v1';
const lista=document.getElementById('relatosLista');
const form=document.getElementById('relatoForm');
const imgInput=document.getElementById('relatoImg');
const exportBtn=document.getElementById('exportRelatos');
const importInput=document.getElementById('importRelatos');
function getRelatos(){return JSON.parse(localStorage.getItem(RELATOS_KEY)||'[]');}
function saveRelatos(arr){localStorage.setItem(RELATOS_KEY,JSON.stringify(arr));}
function renderRelatos(items){lista.innerHTML='';items.forEach((it,idx)=>{const tile=document.createElement('div');tile.className='tile';if(it.img){const im=new Image();im.src=it.img;im.alt='Relato';im.style.width='100%';im.style.objectFit='cover';tile.appendChild(im);}const wrap=document.createElement('div');wrap.className='relato';wrap.innerHTML=`<h4>${it.titulo||'Relato'}</h4><small>por ${it.nombre||'Anónimo'} – ${it.comunidad||''}</small><p>${it.texto||''}</p>`;const rm=document.createElement('button');rm.className='tab-button';rm.textContent='Eliminar';rm.addEventListener('click',()=>{const arr=getRelatos();arr.splice(idx,1);saveRelatos(arr);loadRelatos();});wrap.appendChild(rm);tile.appendChild(wrap);lista.appendChild(tile);});}
function loadRelatos(){renderRelatos(getRelatos());}
form.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(form);let img64=null;if(imgInput.files&&imgInput.files[0]){img64=await new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(imgInput.files[0]);});}const item=Object.fromEntries(fd.entries());item.img=img64;const arr=getRelatos();arr.unshift(item);saveRelatos(arr);form.reset();imgInput.value='';loadRelatos();});
exportBtn.addEventListener('click',()=>{const blob=new Blob([localStorage.getItem(RELATOS_KEY)||'[]'],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='relatos-corpus.json';a.click();});
importInput.addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;const txt=await f.text();let arr=[];try{arr=JSON.parse(txt);}catch{alert('Archivo no válido');return;}saveRelatos(arr);loadRelatos();e.target.value='';});
document.addEventListener('DOMContentLoaded',loadRelatos);

['assets/img/alangasi-20.jpg','assets/img/alangasi-21.jpg','assets/img/alangasi-22.jpg','assets/img/alangasi-23.jpg','assets/img/alangasi-24.jpg','assets/img/alangasi-25.jpg','assets/img/alangasi-26.jpg','assets/img/alangasi-27.jpg','assets/img/alangasi-28.jpg'].forEach(s=>images.push(s));



// Optional videos
const videos = ['assets/video/video-1.mp4','assets/video/video-2.mp4','assets/video/video-3.mp4','assets/video/video-4.mp4'].filter(Boolean);
videos.forEach(src=>{
  const tile = document.createElement('div');
  tile.className = 'tile';
  const v = document.createElement('video');
  v.src = src; v.controls = true; v.playsInline = true;
  const cap = document.createElement('div');
  cap.style.padding='8px';
  cap.innerHTML='<b>Video</b><br><small>Comparsas y música en la plaza</small>';
  tile.appendChild(v); tile.appendChild(cap);
  gallery.appendChild(tile);
});

