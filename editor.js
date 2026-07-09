/* ============================================================
   КОНСТРУКТОР
   • переключение стилей
   • правка любых текстов прямо на странице
   • свои фото (галерея и место)
   • сохранение в браузере + экспорт готового index.html
   Правки видны только вам, пока вы не выгрузите файл на сайт.
   ============================================================ */
(function(){
  var LS_TEXT="foc_text", LS_PHOTO="foc_photo", LS_THEME="foc_theme", LS_HREF="foc_href";
  var THEMES=[
    {id:"celadon", name:"Селадон"},
    {id:"ink",     name:"Тушь"},
    {id:"paper",   name:"Бумага"},
    {id:"oolong",  name:"Улун"}
  ];
  var editing=false;

  function load(k){ try{ return JSON.parse(localStorage.getItem(k)||"{}"); }catch(e){ return {}; } }
  function save(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){ alert("Не хватило места в браузере — попробуйте фото поменьше."); } }
  var texts=load(LS_TEXT), photos=load(LS_PHOTO), hrefs=load(LS_HREF);

  /* ---------- применяем сохранённое ---------- */
  function applyTheme(id){ document.documentElement.setAttribute("data-theme",id);
    document.querySelectorAll(".theme-dots button").forEach(function(b){ b.setAttribute("aria-pressed", String(b.dataset.t===id)); }); }

  function applyPhoto(key,url){
    var host=document.querySelector('[data-photo="'+key+'"]');
    if(!host) return;
    host.innerHTML='<img src="'+url+'" alt="">';
  }

  function applyAll(){
    applyTheme(localStorage.getItem(LS_THEME)||"celadon");
    Object.keys(texts).forEach(function(k){
      var el=document.querySelector('[data-edit="'+k+'"]');
      if(el) el.innerHTML=texts[k];
    });
    Object.keys(hrefs).forEach(function(k){
      var el=document.querySelector('[data-edit-href="'+k+'"]');
      if(el) el.setAttribute("href",hrefs[k]);
    });
    Object.keys(photos).forEach(function(k){ applyPhoto(k,photos[k]); });
  }
  applyAll();

  /* ---------- панель ---------- */
  var bar=document.createElement("div");
  bar.id="editor-bar"; bar.className="hidden";
  bar.innerHTML =
    '<span class="lbl">Стиль</span>'+
    '<div class="theme-dots">'+THEMES.map(function(t){
      return '<button data-t="'+t.id+'" title="'+t.name+'" aria-pressed="false"></button>';
    }).join("")+'</div>'+
    '<span class="sep"></span>'+
    '<button class="ebtn" id="e-photo">Фото</button>'+
    '<button class="ebtn" id="e-link">Ссылка карты</button>'+
    '<button class="ebtn" id="e-reset">Сбросить</button>'+
    '<span class="sep"></span>'+
    '<button class="ebtn primary" id="e-export">Скачать сайт</button>'+
    '<button class="ebtn" id="e-close">Готово</button>';
  document.body.appendChild(bar);

  var hint=document.createElement("div");
  hint.className="edit-hint hidden";
  hint.textContent="Кликайте по текстам и правьте. Наведите на фото — «Сменить фото».";
  document.body.appendChild(hint);

  var fileInput=document.createElement("input");
  fileInput.type="file"; fileInput.accept="image/*"; fileInput.style.display="none";
  document.body.appendChild(fileInput);

  /* ---------- режим ---------- */
  function setEditing(on){
    editing=on;
    document.body.classList.toggle("editing",on);
    bar.classList.toggle("hidden",!on);
    hint.classList.toggle("hidden",!on);
    document.getElementById("editor-open").classList.toggle("hidden",on);
    document.querySelectorAll("[data-edit]").forEach(function(el){
      el.contentEditable = on ? "true" : "false";
      if(on) el.spellcheck=false;
    });
    if(on) setTimeout(function(){ hint.classList.add("hidden"); },5000);
  }
  document.getElementById("editor-open").addEventListener("click",function(){ setEditing(true); });
  document.getElementById("e-close").addEventListener("click",function(){ setEditing(false); });

  /* ---------- текст ---------- */
  document.querySelectorAll("[data-edit]").forEach(function(el){
    el.addEventListener("blur",function(){
      texts[el.dataset.edit]=el.innerHTML.trim();
      save(LS_TEXT,texts);
    });
    // перевод строки — enter, без вставки html
    el.addEventListener("paste",function(e){
      e.preventDefault();
      var t=(e.clipboardData||window.clipboardData).getData("text");
      document.execCommand("insertText",false,t);
    });
  });

  /* ---------- стили ---------- */
  bar.querySelectorAll(".theme-dots button").forEach(function(b){
    b.addEventListener("click",function(){
      applyTheme(b.dataset.t);
      localStorage.setItem(LS_THEME,b.dataset.t);
    });
  });

  /* ---------- фото ---------- */
  var pendingKey=null;
  function pickPhoto(key){ pendingKey=key; fileInput.value=""; fileInput.click(); }

  document.querySelectorAll("[data-photo]").forEach(function(el){
    el.addEventListener("click",function(){ if(editing) pickPhoto(el.dataset.photo); });
  });
  document.getElementById("e-photo").addEventListener("click",function(){
    var keys=Array.from(document.querySelectorAll("[data-photo]")).map(function(e){return e.dataset.photo;});
    var k=prompt("Какое фото менять?\nДоступно: "+keys.join(", "), keys[0]);
    if(k && keys.indexOf(k)>-1) pickPhoto(k);
  });

  fileInput.addEventListener("change",function(){
    var f=fileInput.files[0]; if(!f||!pendingKey) return;
    shrink(f, 1400, function(dataUrl){
      photos[pendingKey]=dataUrl;
      save(LS_PHOTO,photos);
      applyPhoto(pendingKey,dataUrl);
      pendingKey=null;
    });
  });

  // уменьшаем фото, чтобы страница не весила лишнего
  function shrink(file,maxW,cb){
    var img=new Image(), reader=new FileReader();
    reader.onload=function(){ img.src=reader.result; };
    img.onload=function(){
      var scale=Math.min(1,maxW/img.width);
      var c=document.createElement("canvas");
      c.width=Math.round(img.width*scale); c.height=Math.round(img.height*scale);
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      cb(c.toDataURL("image/jpeg",0.82));
    };
    reader.readAsDataURL(file);
  }

  /* ---------- ссылка на карту ---------- */
  document.getElementById("e-link").addEventListener("click",function(){
    var el=document.querySelector('[data-edit-href="pl.link"]'); if(!el) return;
    var v=prompt("Ссылка на карту (Яндекс.Карты, 2ГИС):", el.getAttribute("href")||"");
    if(v!==null){ el.setAttribute("href",v); hrefs["pl.link"]=v; save(LS_HREF,hrefs); }
  });

  /* ---------- сброс ---------- */
  document.getElementById("e-reset").addEventListener("click",function(){
    if(!confirm("Вернуть исходный текст, фото и стиль?")) return;
    [LS_TEXT,LS_PHOTO,LS_THEME,LS_HREF].forEach(function(k){ localStorage.removeItem(k); });
    location.reload();
  });

  /* ---------- экспорт готового сайта ---------- */
  document.getElementById("e-export").addEventListener("click",function(){
    setEditing(false);
    var clone=document.documentElement.cloneNode(true);
    // убираем всё, что от конструктора
    clone.querySelectorAll("#editor-bar,.edit-hint,#editor-open,input[type=file]").forEach(function(n){n.remove();});
    clone.querySelectorAll('script[src="editor.js"]').forEach(function(n){n.remove();});
    clone.querySelectorAll("[contenteditable]").forEach(function(n){ n.removeAttribute("contenteditable"); n.removeAttribute("spellcheck"); });
    clone.setAttribute("data-theme", localStorage.getItem(LS_THEME)||"celadon");
    var html="<!DOCTYPE html>\n"+clone.outerHTML;
    var blob=new Blob([html],{type:"text/html;charset=utf-8"});
    var a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download="index.html"; a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); },1000);
    alert("Файл index.html скачан.\n\nЗагрузите его в репозиторий вместо старого index.html — и гости увидят вашу версию.\n\nТексты, фото и стиль уже внутри файла.");
  });

  // быстрый вход: ?edit=1
  if(new URLSearchParams(location.search).get("edit")==="1") setEditing(true);
})();
