/* ============================================================
   ВИШЛИСТ — кто какой подарок берёт.
   Если в config.js указан Supabase, отметки видны всем гостям.
   Если нет — работает в демо-режиме (только в вашем браузере).
   ============================================================ */
const cfg = window.WISHLIST_CONFIG || {};
const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
  !/ВАШ|YOUR/i.test(cfg.SUPABASE_URL) && !/ВАШ|YOUR/i.test(cfg.SUPABASE_ANON_KEY);

let sb = null;
if (configured) {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
}

const LOCAL = "foc_gifts_local";
const localGet = () => { try { return JSON.parse(localStorage.getItem(LOCAL) || "{}"); } catch { return {}; } };
const localSet = v => localStorage.setItem(LOCAL, JSON.stringify(v));

const toast = document.getElementById("toast");
function say(m){ toast.textContent=m; toast.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(()=>toast.classList.remove("show"),2400); }

/* ---------- модальное окно ---------- */
const overlay=document.getElementById("overlay");
const mItem=document.getElementById("m-item");
const mName=document.getElementById("m-name");
let target=null;

function open(card){
  target=card;
  mItem.textContent=card.dataset.title;
  mName.value="";
  overlay.classList.add("open");
  setTimeout(()=>mName.focus(),50);
}
function close(){ overlay.classList.remove("open"); target=null; }
document.getElementById("m-cancel").addEventListener("click",close);
overlay.addEventListener("click",e=>{ if(e.target===overlay) close(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape") close(); });
mName.addEventListener("keydown",e=>{ if(e.key==="Enter") take(); });
document.getElementById("m-ok").addEventListener("click",take);

/* ---------- отрисовка ---------- */
function render(map){
  document.querySelectorAll(".gift").forEach(card=>{
    const id=card.dataset.id;
    if(id in map){
      card.classList.add("taken");
      card.querySelector(".who").textContent = map[id] ? ("Дарит: "+map[id]) : "Кто-то уже дарит";
    } else {
      card.classList.remove("taken");
    }
  });
}

async function loadAll(){
  if(!sb){ render(localGet()); return; }
  const { data, error } = await sb.from("gift_reservations").select("gift_id,name");
  if(error){ console.warn(error); return; }
  const map={}; (data||[]).forEach(r=>map[r.gift_id]=r.name);
  render(map);
}

/* ---------- действия ---------- */
async function take(){
  if(!target) return;
  const id=target.dataset.id, name=mName.value.trim();
  if(!sb){
    const m=localGet(); m[id]=name; localSet(m); render(m); close();
    say("Отмечено (пока только у вас — см. README)"); return;
  }
  const { error } = await sb.from("gift_reservations").insert({ gift_id:id, name:name||null });
  close();
  if(error){ say(error.code==="23505" ? "Кто-то уже успел" : "Не получилось, попробуйте ещё раз"); }
  else { say("Спасибо ✓"); }
  loadAll();
}

document.querySelectorAll(".gift .book").forEach(b=>{
  b.addEventListener("click",()=>{
    if(document.body.classList.contains("editing")) return;
    open(b.closest(".gift"));
  });
});

document.querySelectorAll(".gift .cancel").forEach(c=>{
  c.addEventListener("click",async()=>{
    const card=c.closest(".gift");
    if(!confirm("Снять отметку с «"+card.dataset.title+"»?")) return;
    if(!sb){ const m=localGet(); delete m[card.dataset.id]; localSet(m); render(m); say("Снято"); return; }
    const { error }=await sb.from("gift_reservations").delete().eq("gift_id",card.dataset.id);
    say(error ? "Не получилось" : "Снято");
    loadAll();
  });
});

loadAll();
if(sb) setInterval(loadAll, 20000);
