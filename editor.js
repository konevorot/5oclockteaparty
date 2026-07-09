/* ============================================================
   КОНСТРУКТОР (скрытый)
   Вход: добавьте #edit к адресу сайта, либо нажмите Ctrl+Shift+E.
   Дальше — пароль. Кнопки на странице нет, гости её не увидят.

   ВАЖНО про пароль: он лежит в этом файле, а файл открыт всем
   в публичном репозитории. Это не защита от того, кто полезет
   в исходный код, — это замок от случайных гостей. Реальную
   защиту даёт то, что чужие правки живут только в браузере
   того, кто их сделал, и на сайт не попадают.
   ============================================================ */
(function(){
  var PASS="060288";
  var LS_TEXT="foc_text", LS_PHOTO="foc_photo", LS_THEME="foc_theme", LS_HREF="foc_href";
  var LS_WISH="foc_wish";
  var ICONS=["i-cup","i-pot","i-tray","i-leaf","i-brick","i-book","i-bottle","i-ring","i-vase","i-print","i-moon","i-watch"];
  var SS_UNLOCK="foc_unlock";
  var THEMES=[
    {id:"willow",  name:"Willow"},
    {id:"celadon", name:"Селадон"},
    {id:"ink",     name:"Тушь"},
    {id:"paper",   name:"Бумага"},
    {id:"oolong",  name:"Улун"}
  ];
  var editing=false, built=false;

  function load(k){ try{ return JSON.parse(localStorage.getItem(k)||"{}"); }catch(e){ return {}; } }
  function save(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }
    catch(e){ alert("Не хватило места в браузере. Попробуйте фото поменьше или удалите лишние."); } }
  var texts=load(LS_TEXT), photos=load(LS_PHOTO), hrefs=load(LS_HREF);
  var wish=load(LS_WISH);
  if(!wish.added) wish.added=[];
  if(!wish.edits) wish.edits={};
  if(!wish.deleted) wish.deleted=[];
  if(!wish.groups) wish.groups=[];

  /* ---------- применяем сохранённое ---------- */
  function applyTheme(id){
    document.documentElement.setAttribute("data-theme",id);
    document.querySelectorAll(".theme-dots button").forEach(function(b){
      b.setAttribute("aria-pressed", String(b.dataset.t===id));
    });
  }
  function applyPhoto(key,url){
    var host=document.querySelector('[data-photo="'+key+'"]');
    if(host) host.innerHTML='<img src="'+url+'" alt="">';
  }
  function applyAll(){
    applyTheme(localStorage.getItem(LS_THEME)||document.documentElement.getAttribute("data-theme")||"willow");
    Object.keys(texts).forEach(function(k){
      var el=document.querySelector('[data-edit="'+k+'"]'); if(el) el.innerHTML=texts[k];
    });
    Object.keys(hrefs).forEach(function(k){
      var el=document.querySelector('[data-edit-href="'+k+'"]'); if(el) el.setAttribute("href",hrefs[k]);
    });
    Object.keys(photos).forEach(function(k){ applyPhoto(k,photos[k]); });
    document.dispatchEvent(new Event("foc:photo"));
    applyWishlist();
  }

  /* ---------- вишлист: применяем сохранённые правки ---------- */
  function tagGroups(){
    var n=0;
    document.querySelectorAll(".wl-group").forEach(function(g){
      if(!g.dataset.group) g.dataset.group="g"+(++n);
    });
  }
  function giftHTML(o){
    return '<div class="ico"><svg><use href="#'+o.icon+'"></use></svg></div>'+
      '<h4>'+esc(o.title)+'</h4>'+
      '<p class="desc">'+esc(o.desc||"")+'</p>'+
      '<div class="seal"><span>ЗАНЯТО</span></div>'+
      '<div class="foot">'+
        (o.href ? '<a class="view" href="'+esc(o.href)+'" target="_blank" rel="noopener">Посмотреть</a>' : '')+
        '<button class="btn book">Я дарю</button>'+
        '<p class="who"></p><button class="cancel">передумал(а)</button>'+
      '</div>';
  }
  function esc(x){ return String(x||"").replace(/[&<>"]/g,function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

  function applyWishlist(){
    tagGroups();

    // новые разделы
    wish.groups.forEach(function(g){
      if(document.querySelector('.wl-group[data-group="'+g.id+'"]')) return;
      var host=document.querySelector("#wishlist .wrap"); if(!host) return;
      var d=document.createElement("div");
      d.className="wl-group"; d.dataset.group=g.id;
      d.innerHTML='<h3 data-edit="wl.'+g.id+'.h">'+esc(g.title)+'</h3>'+
                  '<p class="gnote" data-edit="wl.'+g.id+'.p">'+esc(g.note||"")+'</p>'+
                  '<div class="grid"></div>';
      var addGroupWrap=host.querySelector(".wl-addgroup-wrap");
      host.insertBefore(d, addGroupWrap || null);
    });

    // новые карточки
    wish.added.forEach(function(o){
      if(document.querySelector('.gift[data-id="'+o.id+'"]')) return;
      var grid=document.querySelector('.wl-group[data-group="'+o.group+'"] .grid');
      if(!grid) grid=document.querySelector("#wishlist .grid");
      if(!grid) return;
      var a=document.createElement("article");
      a.className="gift"; a.dataset.id=o.id; a.dataset.title=o.title;
      a.innerHTML=giftHTML(o);
      grid.appendChild(a);
    });

    // правки существующих
    Object.keys(wish.edits).forEach(function(id){
      var o=wish.edits[id];
      var card=document.querySelector('.gift[data-id="'+id+'"]'); if(!card) return;
      card.dataset.title=o.title;
      card.querySelector("h4").textContent=o.title;
      card.querySelector(".desc").textContent=o.desc||"";
      var link=card.querySelector("a.view");
      if(o.href){
        if(!link){ link=document.createElement("a"); link.className="view"; link.target="_blank"; link.rel="noopener";
          link.textContent="Посмотреть"; card.querySelector(".foot").prepend(link); }
        link.href=o.href;
      } else if(link) link.remove();
      if(o.icon) card.querySelector(".ico svg use").setAttribute("href","#"+o.icon);
    });

    // удалённые
    wish.deleted.forEach(function(id){
      var c=document.querySelector('.gift[data-id="'+id+'"]'); if(c) c.remove();
    });

    if(window.focRefreshGifts) window.focRefreshGifts();
  }
  applyAll();

  /* ---------- вход по паролю ---------- */
  function unlocked(){ try{ return sessionStorage.getItem(SS_UNLOCK)==="1"; }catch(e){ return false; } }
  function askPass(){
    if(unlocked()) return true;
    var v=prompt("Пароль для редактирования");
    if(v===null) return false;
    if(v===PASS){ try{ sessionStorage.setItem(SS_UNLOCK,"1"); }catch(e){} return true; }
    alert("Неверный пароль");
    return false;
  }
  function tryOpen(){ if(askPass()){ build(); setEditing(true); } }

  document.addEventListener("keydown",function(e){
    if(e.ctrlKey && e.shiftKey && (e.key==="E"||e.key==="e"||e.code==="KeyE")){ e.preventDefault(); tryOpen(); }
  });
  function checkHash(){
    if(location.hash==="#edit" || new URLSearchParams(location.search).get("edit")==="1"){
      history.replaceState(null,"",location.pathname);
      tryOpen();
    }
  }
  window.addEventListener("hashchange",checkHash);
  checkHash();

  /* ---------- панель строится только после пароля ---------- */
  var bar, hint, fileInput;
  function build(){
    if(built) return; built=true;

    bar=document.createElement("div");
    bar.id="editor-bar"; bar.className="hidden";
    bar.innerHTML =
      '<span class="lbl">Стиль</span>'+
      '<div class="theme-dots">'+THEMES.map(function(t){
        return '<button data-t="'+t.id+'" title="'+t.name+'" aria-pressed="false"></button>';
      }).join("")+'</div>'+
      '<span class="sep"></span>'+
      '<button class="ebtn" id="e-link">Ссылки</button>'+
      '<button class="ebtn" id="e-wish">+ Желание</button>'+
      '<button class="ebtn" id="e-reset">Сбросить</button>'+
      '<span class="sep"></span>'+
      '<button class="ebtn primary" id="e-export">Скачать сайт</button>'+
      '<button class="ebtn" id="e-close">Готово</button>';
    document.body.appendChild(bar);

    hint=document.createElement("div");
    hint.className="edit-hint hidden";
    hint.textContent="Кликайте по текстам. Кликните по любому фото, чтобы заменить его.";
    document.body.appendChild(hint);

    fileInput=document.createElement("input");
    fileInput.type="file"; fileInput.accept="image/*"; fileInput.style.display="none";
    document.body.appendChild(fileInput);

    bar.querySelectorAll(".theme-dots button").forEach(function(b){
      b.addEventListener("click",function(){ applyTheme(b.dataset.t); localStorage.setItem(LS_THEME,b.dataset.t); });
    });
    applyTheme(localStorage.getItem(LS_THEME)||"willow");

    document.querySelectorAll("[data-edit]").forEach(function(el){
      el.addEventListener("blur",function(){ texts[el.dataset.edit]=el.innerHTML.trim(); save(LS_TEXT,texts); });
      el.addEventListener("paste",function(e){
        e.preventDefault();
        var t=(e.clipboardData||window.clipboardData).getData("text");
        document.execCommand("insertText",false,t);
      });
    });

    var pendingKey=null;
    document.querySelectorAll("[data-photo]").forEach(function(el){
      el.addEventListener("click",function(e){
        if(!editing) return;
        e.stopPropagation();
        pendingKey=el.dataset.photo; fileInput.value=""; fileInput.click();
      });
    });
    fileInput.addEventListener("change",function(){
      var f=fileInput.files[0]; if(!f||!pendingKey) return;
      var key=pendingKey; pendingKey=null;
      shrink(f,1400,function(url){
        photos[key]=url; save(LS_PHOTO,photos);
        applyPhoto(key,url);
        document.dispatchEvent(new Event("foc:photo"));
      });
    });

    document.getElementById("e-link").addEventListener("click",function(){
      editHref("pl.link","Ссылка на карту (Яндекс.Карты, 2ГИС)");
      editHref("tg.link","Ссылка на ваш телеграм");
    });
    function editHref(key,label){
      var els=document.querySelectorAll('[data-edit-href="'+key+'"]'); if(!els.length) return;
      var v=prompt(label+":", els[0].getAttribute("href")||"");
      if(v===null) return;
      els.forEach(function(el){ el.setAttribute("href",v); });
      hrefs[key]=v; save(LS_HREF,hrefs);
    }

    document.getElementById("e-reset").addEventListener("click",function(){
      if(!confirm("Вернуть исходные тексты, фото и стиль? Ваши правки пропадут.")) return;
      [LS_TEXT,LS_PHOTO,LS_THEME,LS_HREF,LS_WISH].forEach(function(k){ localStorage.removeItem(k); });
      location.reload();
    });

    document.getElementById("e-export").addEventListener("click",function(){
      setEditing(false);
      var clone=document.documentElement.cloneNode(true);
      clone.querySelectorAll("#editor-bar,.edit-hint,#editor-open,input[type=file],.ed-ctl,.wl-add,.wl-addgroup-wrap,.wl-form,.overlay.open .wl-form").forEach(function(n){ n.remove(); });
      clone.querySelectorAll(".wl-group").forEach(function(g){ g.removeAttribute("data-group"); });
      clone.querySelectorAll("[contenteditable]").forEach(function(n){
        n.removeAttribute("contenteditable"); n.removeAttribute("spellcheck");
      });
      clone.querySelectorAll(".slide.active").forEach(function(n){ n.classList.remove("active"); });
      clone.setAttribute("data-theme", localStorage.getItem(LS_THEME)||"willow");
      var blob=new Blob(["<!DOCTYPE html>\n"+clone.outerHTML],{type:"text/html;charset=utf-8"});
      var a=document.createElement("a");
      a.href=URL.createObjectURL(blob); a.download="index.html"; a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); },1000);
      alert("Файл index.html скачан.\n\nЗагрузите его в репозиторий вместо старого — и гости увидят вашу версию.\nТексты, фото и стиль уже внутри файла.");
    });

    document.getElementById("e-close").addEventListener("click",function(){ setEditing(false); });

    buildWishControls();
    document.getElementById("e-wish").addEventListener("click",function(){
      var g=document.querySelector(".wl-group");
      openGiftForm(null, g ? g.dataset.group : "g1");
      document.getElementById("wishlist").scrollIntoView({behavior:"smooth"});
    });
  }

  /* ============================================================
     РЕДАКТОР ВИШЛИСТА
     ============================================================ */
  function buildWishControls(){
    tagGroups();

    document.querySelectorAll(".wl-group").forEach(function(g){ decorateGroup(g); });

    var host=document.querySelector("#wishlist .wrap");
    if(host && !host.querySelector(".wl-addgroup-wrap")){
      var wrap=document.createElement("div");
      wrap.className="wl-addgroup-wrap";
      var b=document.createElement("button");
      b.className="wl-add wl-add-group"; b.type="button"; b.textContent="+ Новый раздел";
      b.addEventListener("click",addGroup);
      wrap.appendChild(b);
      host.appendChild(wrap);
    }
  }

  function decorateGroup(g){
    g.querySelectorAll(".gift").forEach(decorateGift);
    if(!g.querySelector(".wl-add")){
      var add=document.createElement("button");
      add.className="wl-add"; add.type="button"; add.textContent="+ Добавить желание";
      add.addEventListener("click",function(){ openGiftForm(null,g.dataset.group); });
      g.appendChild(add);
    }
  }

  function decorateGift(card){
    if(card.querySelector(".ed-ctl")) return;
    var ctl=document.createElement("div");
    ctl.className="ed-ctl";
    var ed=document.createElement("button"); ed.type="button"; ed.textContent="Править";
    ed.addEventListener("click",function(e){ e.stopPropagation(); openGiftForm(card); });
    var del=document.createElement("button"); del.type="button"; del.className="del"; del.textContent="Удалить";
    del.addEventListener("click",function(e){
      e.stopPropagation();
      if(!confirm("Убрать «"+card.dataset.title+"» из вишлиста?")) return;
      var id=card.dataset.id;
      if(wish.deleted.indexOf(id)<0) wish.deleted.push(id);
      wish.added=wish.added.filter(function(o){ return o.id!==id; });
      delete wish.edits[id];
      save(LS_WISH,wish);
      card.remove();
    });
    ctl.appendChild(ed); ctl.appendChild(del);
    card.prepend(ctl);
  }

  function addGroup(){
    var title=prompt("Название раздела:","Новый раздел");
    if(!title) return;
    var note=prompt("Подзаголовок (можно пусто):","")||"";
    var id="c"+Date.now().toString(36);
    wish.groups.push({id:id,title:title,note:note});
    save(LS_WISH,wish);
    applyWishlist();
    var g=document.querySelector('.wl-group[data-group="'+id+'"]');
    if(g){
      g.querySelectorAll("[data-edit]").forEach(function(el){
        el.contentEditable="true"; el.spellcheck=false;
        el.addEventListener("blur",function(){ texts[el.dataset.edit]=el.innerHTML.trim(); save(LS_TEXT,texts); });
      });
      decorateGroup(g);
      g.scrollIntoView({behavior:"smooth",block:"center"});
    }
  }

  /* ---------- форма карточки ---------- */
  var formOverlay=null;
  function openGiftForm(card, groupId){
    var isNew=!card;
    var cur = isNew ? {icon:"i-cup",title:"",desc:"",href:""} : {
      icon:(card.querySelector(".ico svg use").getAttribute("href")||"#i-cup").slice(1),
      title:card.dataset.title||"",
      desc:(card.querySelector(".desc")||{}).textContent||"",
      href:(card.querySelector("a.view")||{}).href||""
    };
    var groups=Array.prototype.map.call(document.querySelectorAll(".wl-group"),function(g){
      return {id:g.dataset.group, name:(g.querySelector("h3")||{}).textContent||g.dataset.group};
    });
    var inGroup = isNew ? (groupId||groups[0].id) : card.closest(".wl-group").dataset.group;

    if(formOverlay) formOverlay.remove();
    formOverlay=document.createElement("div");
    formOverlay.className="overlay open";
    formOverlay.innerHTML='<div class="wl-form">'+
      '<h4 class="display">'+(isNew?"Новое желание":"Правка желания")+'</h4>'+
      '<label>Название</label><input id="wf-title" maxlength="80" value="'+esc(cur.title)+'">'+
      '<label>Описание</label><textarea id="wf-desc" maxlength="220">'+esc(cur.desc)+'</textarea>'+
      '<label>Ссылка (можно пусто)</label><input id="wf-href" placeholder="https://..." value="'+esc(cur.href)+'">'+
      '<label>Раздел</label><select id="wf-group">'+groups.map(function(g){
        return '<option value="'+g.id+'"'+(g.id===inGroup?" selected":"")+'>'+esc(g.name)+'</option>'; }).join("")+'</select>'+
      '<label>Значок</label><div class="icons">'+ICONS.map(function(ic){
        return '<button type="button" data-ic="'+ic+'" aria-pressed="'+(ic===cur.icon)+'"><svg><use href="#'+ic+'"></use></svg></button>'; }).join("")+'</div>'+
      '<div class="actions"><button class="btn ghost" id="wf-cancel">Отмена</button>'+
      '<button class="btn" id="wf-save">Сохранить</button></div></div>';
    document.body.appendChild(formOverlay);

    var pickedIcon=cur.icon;
    formOverlay.querySelectorAll(".icons button").forEach(function(b){
      b.addEventListener("click",function(){
        pickedIcon=b.dataset.ic;
        formOverlay.querySelectorAll(".icons button").forEach(function(x){
          x.setAttribute("aria-pressed", String(x.dataset.ic===pickedIcon)); });
      });
    });
    function closeForm(){ formOverlay.remove(); formOverlay=null; }
    formOverlay.addEventListener("click",function(e){ if(e.target===formOverlay) closeForm(); });
    formOverlay.querySelector("#wf-cancel").addEventListener("click",closeForm);
    formOverlay.querySelector("#wf-title").focus();

    formOverlay.querySelector("#wf-save").addEventListener("click",function(){
      var o={
        title: formOverlay.querySelector("#wf-title").value.trim(),
        desc:  formOverlay.querySelector("#wf-desc").value.trim(),
        href:  formOverlay.querySelector("#wf-href").value.trim(),
        group: formOverlay.querySelector("#wf-group").value,
        icon:  pickedIcon
      };
      if(!o.title){ alert("Впишите название."); return; }

      if(isNew){
        o.id = "w" + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
        wish.added.push(o);
        save(LS_WISH,wish);
        applyWishlist();
        var fresh=document.querySelector('.gift[data-id="'+o.id+'"]');
        if(fresh){ decorateGift(fresh); fresh.scrollIntoView({behavior:"smooth",block:"center"}); }
      } else {
        var id=card.dataset.id;
        // смена раздела
        if(o.group !== card.closest(".wl-group").dataset.group){
          var grid=document.querySelector('.wl-group[data-group="'+o.group+'"] .grid');
          if(grid) grid.appendChild(card);
          var moved=wish.added.filter(function(x){ return x.id===id; })[0];
          if(moved) moved.group=o.group;
        }
        var existing=wish.added.filter(function(x){ return x.id===id; })[0];
        if(existing){ existing.title=o.title; existing.desc=o.desc; existing.href=o.href; existing.icon=o.icon; }
        else { wish.edits[id]={title:o.title,desc:o.desc,href:o.href,icon:o.icon}; }
        save(LS_WISH,wish);
        applyWishlist();
      }
      closeForm();
    });
  }

  /* ---------- режим ---------- */
  function setEditing(on){
    editing=on;
    document.body.classList.toggle("editing",on);
    if(bar)  bar.classList.toggle("hidden",!on);
    if(hint) hint.classList.toggle("hidden",!on);
    document.querySelectorAll("[data-edit]").forEach(function(el){
      el.contentEditable = on ? "true" : "false";
      if(on) el.spellcheck=false;
    });
    document.dispatchEvent(new Event("foc:editing"));
    if(on && hint) setTimeout(function(){ hint.classList.add("hidden"); },6000);
  }

  /* ---------- уменьшаем фото ---------- */
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
})();
