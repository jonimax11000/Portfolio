(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function e(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(r){if(r.ep)return;r.ep=!0;const a=e(r);fetch(r.href,a)}})();class I extends HTMLElement{#t=null;#e=null;#o={lang:"es",theme:"light",hc:!1,view:"portfolio",collapsed:!1};static get observedAttributes(){return["collapsed"]}connectedCallback(){this.#a()}attributeChangedCallback(t,e,o){t==="collapsed"&&(this.#o.collapsed=o!==null,this.#a())}set props({profile:t,i18n:e,state:o}){this.#t=t,this.#e=e,this.#o={...this.#o,...o},this.isConnected&&this.#a()}#r(t,e={}){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:!0,composed:!0}))}#a(){const t=this.#e?.t?.bind(this.#e)??(l=>l),e=this.#t??{},{collapsed:o,view:r,theme:a,hc:i}=this.#o,n=(l,d)=>`
      <button type="button" class="nav-btn" data-nav="${l}" ${r===l?'aria-current="page"':""}>
        ${d}
      </button>`;this.innerHTML=`
      <header class="site-header ${o?"is-collapsed":""}">
        <div class="header-inner">
          <div class="header-identity">
            ${e.foto?`<img class="header-photo" src="${e.foto}" alt="${e.nombre??""}" width="48" height="48" fetchpriority="high" decoding="async" />`:""}
            ${e.nombre?`<span class="header-name">${e.nombre}</span>`:""}
          </div>

          <div class="header-full">
            ${e.titular?`<p class="header-titular">${e.titular}</p>`:""}
            ${e.claim?`<p class="header-claim">${e.claim}</p>`:""}
            <ul class="header-meta">
              ${e.ubicacion?`<li>${e.ubicacion}</li>`:""}
              ${e.disponibilidad?`<li><span class="pill"><span class="pill-dot" aria-hidden="true"></span>${e.disponibilidad}</span></li>`:""}
            </ul>
            ${this.#s(e.stack)}
            <ul class="header-links">
              ${e.correo?`<li><a href="mailto:${e.correo}">${e.correo}</a></li>`:""}
              ${e.github?`<li><a href="${e.github}" target="_blank" rel="noopener noreferrer">GitHub</a></li>`:""}
              ${e.linkedin?`<li><a href="${e.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>`:""}
            </ul>
          </div>

          <nav class="header-nav" aria-label="${t("footer.navegacion")}">
            ${n("portfolio",t("nav.portfolio"))}
            ${n("sobre-mi",t("nav.sobreMi"))}
            ${n("ahora",t("nav.ahora"))}
          </nav>

          <div class="header-actions">
            <button type="button" class="btn-secondary" data-action="toggle-lang">${t("header.cambiarIdioma")}</button>
            <button type="button" class="btn-secondary" data-action="toggle-theme" aria-pressed="${a==="dark"}">
              ${t(a==="dark"?"header.temaClaro":"header.temaOscuro")}
            </button>
            <button type="button" class="btn-secondary" data-action="toggle-hc" aria-pressed="${i}">
              ${t("header.altoContraste")}
            </button>
            ${e.correo?`<button type="button" class="btn-primary" data-action="contact">${t("header.contactar")}</button>`:""}
          </div>
        </div>
      </header>
    `,this.querySelectorAll("[data-nav]").forEach(l=>l.addEventListener("click",()=>this.#r("navigate",{view:l.dataset.nav}))),this.querySelector('[data-action="toggle-lang"]')?.addEventListener("click",()=>this.#r("toggle-lang")),this.querySelector('[data-action="toggle-theme"]')?.addEventListener("click",()=>this.#r("toggle-theme")),this.querySelector('[data-action="toggle-hc"]')?.addEventListener("click",()=>this.#r("toggle-hc")),this.querySelector('[data-action="contact"]')?.addEventListener("click",()=>this.#r("contact"))}#s(t){if(!t||typeof t!="object")return"";const e=Object.entries(t).filter(([,o])=>Array.isArray(o)&&o.length>0);return e.length===0?"":`
      <ul class="header-stack">
        ${e.map(([o,r])=>`
          <li>
            <span class="stack-category">${o}</span>
            ${r.map(a=>`<span class="chip">${a}</span>`).join(" ")}
          </li>`).join("")}
      </ul>`}}customElements.define("app-header",I);class O extends HTMLElement{#t=null;#e="portfolio";connectedCallback(){this.#o()}set props({i18n:t,state:e}){this.#t=t,this.#e=e?.view??this.#e,this.isConnected&&this.#o()}#o(){const t=this.#t?.t?.bind(this.#t)??(o=>o),e=(o,r)=>`<a href="#${o==="portfolio"?"/":`/${o}`}" data-nav="${o}" ${this.#e===o?'aria-current="page"':""}>${r}</a>`;this.innerHTML=`
      <footer class="site-footer">
        <nav aria-label="${t("footer.navegacion")}">
          <ul class="footer-nav">
            <li>${e("portfolio",t("nav.portfolio"))}</li>
            <li>${e("sobre-mi",t("nav.sobreMi"))}</li>
            <li>${e("ahora",t("nav.ahora"))}</li>
          </ul>
        </nav>
      </footer>
    `,this.querySelectorAll("[data-nav]").forEach(o=>o.addEventListener("click",r=>{r.preventDefault(),this.dispatchEvent(new CustomEvent("navigate",{detail:{view:o.dataset.nav},bubbles:!0,composed:!0}))}))}}customElements.define("app-footer",O);class N{#t;#e=new Set;constructor(t={}){this.#t={lang:"es",theme:"light",hc:!1,view:"portfolio",filters:{tecnologia:null,anio:null},page:1,order:"desc",expandedProjectId:null,status:"loading",...t}}get(){return{...this.#t,filters:{...this.#t.filters}}}set(t){const e=this.#t;this.#t={...e,...t},this.#o(this.#t,e)}setFilters(t){this.set({filters:{...this.#t.filters,...t},page:1})}subscribe(t){return this.#e.add(t),()=>this.#e.delete(t)}#o(t,e){for(const o of this.#e)o(t,e)}}const E={es:["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],en:["January","February","March","April","May","June","July","August","September","October","November","December"]};function S(s){return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}function q(s,t="es"){if(!s||!/^\d{4}-\d{2}$/.test(s))return null;const[e,o]=s.split("-").map(Number),a=(E[t]??E.es)[o-1];return a?`${a} ${e}`:null}const w=5,H=3;class L{constructor(t=[]){this.projects=Array.isArray(t)?t:[]}getFeatured(){return this.projects.slice(0,H)}getFeaturedIds(){return new Set(this.getFeatured().map(t=>t.id))}sortByDate(t,e="desc"){const o=t.filter(a=>a.fecha),r=t.filter(a=>!a.fecha);return o.sort((a,i)=>e==="asc"?a.fecha.localeCompare(i.fecha):i.fecha.localeCompare(a.fecha)),[...o,...r]}filter(t,{tecnologia:e=null,anio:o=null}={}){const r=e?S(e):null;return t.filter(a=>!(r&&S(a.tecnologia??"")!==r||o&&!(a.fecha??"").startsWith(String(o))))}query({filters:t={},order:e="desc",page:o=1}={}){const r=this.filter(this.projects,t),a=this.sortByDate(r,e),i=a.length,n=Math.max(1,Math.ceil(i/w)),l=Math.min(Math.max(1,o),n);return{items:a.slice((l-1)*w,l*w),total:i,totalPages:n,page:l}}getFilterOptions(){const t=[...new Set(this.projects.map(o=>o.tecnologia).filter(Boolean))],e=[...new Set(this.projects.map(o=>o.fecha?o.fecha.slice(0,4):null).filter(Boolean))].sort((o,r)=>r.localeCompare(o));return{tecnologias:t,anios:e}}}class R{#t;constructor(t="data/"){this.#t=t}async load(t="es"){const e=t==="en"?".en.json":".json",[o,r]=await Promise.all([this.#e(`${this.#t}profile${e}`),this.#e(`${this.#t}projects${e}`)]);return{profile:this.#o(o),projects:this.#r(r)}}async#e(t){const e=await fetch(t);if(!e.ok)throw new Error(`DataService: ${t} → HTTP ${e.status}`);try{return await e.json()}catch{throw new Error(`DataService: ${t} → JSON malformado`)}}#o(t){if(!t||typeof t!="object"||t.perfil===null||typeof t.perfil!="object")throw new Error('DataService: profile → falta el objeto "perfil"');const e=t.perfil;return{...e,sobreMi:Array.isArray(e.sobreMi)?e.sobreMi:[],ahora:Array.isArray(e.ahora)?e.ahora:[],stack:e.stack&&typeof e.stack=="object"&&!Array.isArray(e.stack)?e.stack:{}}}#r(t){if(!t||typeof t!="object"||!Array.isArray(t.proyectos))throw new Error('DataService: projects → falta el array "proyectos"');return t.proyectos.filter(e=>e&&typeof e=="object"&&!Array.isArray(e))}}const B={portfolio:"Portfolio",sobreMi:"Sobre mí",ahora:"Ahora"},V={contactar:"Contactar",cambiarIdioma:"English",temaClaro:"Modo claro",temaOscuro:"Modo oscuro",altoContraste:"Alto contraste"},_={destacados:"Destacados",proyectos:"Proyectos",filtros:"Filtros",tecnologia:"Tecnología",anio:"Año",todas:"Todas",todos:"Todos",orden:"Orden",ordenDesc:"Más recientes primero",ordenAsc:"Más antiguos primero",contador:"{n} proyectos",contadorSingular:"{n} proyecto",limpiarFiltros:"Limpiar filtros",vacioGlobalTitulo:"Sin proyectos todavía",vacioGlobal:"Todavía no hay proyectos que mostrar.",vacioFiltrosTitulo:"Sin resultados",vacioFiltros:"Ningún proyecto coincide con los filtros seleccionados.",errorTitulo:"Error al cargar",error:"No se han podido cargar los datos. Inténtalo de nuevo más tarde."},z={destacado:"Destacado",noDisponible:"No disponible",verRepositorio:"Ver repositorio",expandir:"Expandir tarjeta",colapsar:"Colapsar tarjeta",expandida:"Tarjeta {nombre} expandida",colapsada:"Tarjeta {nombre} colapsada"},G={asunto:"Contacto desde el portfolio"},U={navegacion:"Navegación"},J={anterior:"Anterior",siguiente:"Siguiente",pagina:"Página {n} de {total}"},Y={nav:B,header:V,portfolio:_,tarjeta:z,contacto:G,footer:U,paginacion:J},K={portfolio:"Portfolio",sobreMi:"About me",ahora:"Now"},W={contactar:"Contact",cambiarIdioma:"Español",temaClaro:"Light mode",temaOscuro:"Dark mode",altoContraste:"High contrast"},X={destacados:"Featured",proyectos:"Projects",filtros:"Filters",tecnologia:"Technology",anio:"Year",todas:"All",todos:"All",orden:"Sort",ordenDesc:"Newest first",ordenAsc:"Oldest first",contador:"{n} projects",contadorSingular:"{n} project",limpiarFiltros:"Clear filters",vacioGlobalTitulo:"No projects yet",vacioGlobal:"There are no projects to show yet.",vacioFiltrosTitulo:"No results",vacioFiltros:"No projects match the selected filters.",errorTitulo:"Failed to load",error:"Data could not be loaded. Please try again later."},Q={destacado:"Featured",noDisponible:"Not available",verRepositorio:"View repository",expandir:"Expand card",colapsar:"Collapse card",expandida:"{nombre} card expanded",colapsada:"{nombre} card collapsed"},Z={asunto:"Contact from the portfolio"},tt={navegacion:"Navigation"},et={anterior:"Previous",siguiente:"Next",pagina:"Page {n} of {total}"},ot={nav:K,header:W,portfolio:X,tarjeta:Q,contacto:Z,footer:tt,paginacion:et},x={es:Y,en:ot},T=Object.keys(x),j="es";class rt{#t=j;get lang(){return this.#t}setLang(t){T.includes(t)&&(this.#t=t,document.documentElement.setAttribute("lang",t))}t(t,e={}){const o=this.#e(x[this.#t],t)??this.#e(x[j],t)??t;return Object.entries(e).reduce((r,[a,i])=>r.replaceAll(`{${a}}`,String(i)),o)}#e(t,e){return e.split(".").reduce((o,r)=>o?.[r],t)}}const $="portfolio:",u={lang:`${$}lang`,theme:`${$}theme`,hc:`${$}hc`};class at{get(t){try{return localStorage.getItem(t)}catch{return null}}set(t,e){try{localStorage.setItem(t,e)}catch{}}}const M={"/":"portfolio","/sobre-mi":"sobre-mi","/ahora":"ahora"},st=Object.fromEntries(Object.entries(M).map(([s,t])=>[t,s]));class it{#t;#e;constructor(t){this.#t=t,this.#e=()=>this.#t(this.currentView())}currentView(){const t=location.hash.replace(/^#/,"")||"/";return M[t]??"portfolio"}navigate(t){const e=st[t]??"/";location.hash===`#${e}`?this.#t(this.currentView()):location.hash=`#${e}`}start(){window.addEventListener("hashchange",this.#e),this.#t(this.currentView())}stop(){window.removeEventListener("hashchange",this.#e)}}class nt{#t;#e;#o;#r;#a;#s;constructor({state:t,i18n:e,storage:o,router:r,data:a,onDataReload:i}){this.#t=t,this.#e=e,this.#o=o,this.#r=r,this.#a=a,this.#s=i}init(){const t=this.#o.get(u.lang),e=this.#o.get(u.theme),o=this.#o.get(u.hc),r={};T.includes(t)&&(r.lang=t),(e==="dark"||e==="light")&&(r.theme=e),(o==="true"||o==="false")&&(r.hc=o==="true"),this.#t.set(r),this.#e.setLang(this.#t.get().lang??j),this.#i(),document.addEventListener("navigate",a=>{const i=this.#t.get().view;this.#r.navigate(a.detail.view),a.detail.view!==i&&window.scrollTo(0,0)}),document.addEventListener("toggle-lang",()=>this.toggleLang()),document.addEventListener("toggle-theme",()=>this.toggleTheme()),document.addEventListener("toggle-hc",()=>this.toggleHc()),document.addEventListener("contact",()=>this.contact())}async toggleLang(){const t=this.#t.get().lang==="es"?"en":"es";this.#e.setLang(t),this.#o.set(u.lang,t),this.#t.set({lang:t}),await this.#s(t)}toggleTheme(){const t=this.#t.get().theme==="dark"?"light":"dark";this.#o.set(u.theme,t),this.#t.set({theme:t}),this.#i()}toggleHc(){const t=!this.#t.get().hc;this.#o.set(u.hc,String(t)),this.#t.set({hc:t}),this.#i()}contact(){const t=this.#a.profile?.correo;if(!t)return;const e=encodeURIComponent(this.#e.t("contacto.asunto"));window.location.href=`mailto:${t}?subject=${e}`}#i(){const{theme:t,hc:e}=this.#t.get();document.documentElement.setAttribute("data-theme",t),document.documentElement.setAttribute("data-hc",String(e))}}class lt{#t;#e=200;#o;#r=!1;#a=null;constructor(t){this.#t=t,this.#o=()=>this.#i()}start(){window.addEventListener("scroll",this.#o,{passive:!0}),this.#s(),this.#i()}stop(){window.removeEventListener("scroll",this.#o),this.#a?.disconnect()}#s(){const t=document.querySelector("main");t&&(this.#a=new MutationObserver(()=>this.#i()),this.#a.observe(t,{childList:!0,subtree:!0}))}#i(){const t=document.querySelector("project-card"),e=t?t.getBoundingClientRect().top+window.scrollY-56:this.#e,o=window.scrollY>=e;o!==this.#r&&(this.#r=o,o?this.#t.setAttribute("collapsed",""):this.#t.removeAttribute("collapsed"))}}const C=400,A=300;class ct{#t;#e;#o;#r=0;#a=null;#s=null;constructor(t,e,o){this.#t=t,this.#e=e,this.#o=o}start(){this.#a=document.createElement("div"),this.#a.className="visually-hidden",this.#a.setAttribute("aria-live","polite"),document.body.appendChild(this.#a),this.#e.addEventListener("card-toggle",t=>this.#i(t.detail.id,t.detail.nombre)),this.#e.addEventListener("page-change",t=>this.#l(t.detail.page)),this.#e.addEventListener("change",t=>this.#c(t)),this.#e.addEventListener("click",t=>{t.target.closest("[data-clear-filters]")&&this.clearFilters()})}#i(t,e){if(this.#d()||!t)return;const{expandedProjectId:o}=this.#t.get(),r=o!==t;this.#h(),this.#t.set({expandedProjectId:r?t:null}),this.#n(r?"tarjeta.expandida":"tarjeta.colapsada",e)}#n(t,e){!this.#a||!this.#o||(this.#a.textContent="",requestAnimationFrame(()=>{this.#a.textContent=this.#o.t(t,{nombre:e??""})}))}#l(t){this.#t.set({page:t})}#c(t){const e=t.target?.dataset?.filter;if(e){this.#t.setFilters({[e]:t.target.value||null});return}t.target?.hasAttribute?.("data-order")&&this.#t.set({order:t.target.value==="asc"?"asc":"desc",page:1})}clearFilters(){this.#t.setFilters({tecnologia:null,anio:null})}#d(){return Date.now()<this.#r}#h(){this.#r=Date.now()+C+A,this.#p(!0),clearTimeout(this.#s),this.#s=setTimeout(()=>this.#p(!1),C+A)}#p(t){this.#e.querySelectorAll("project-card").forEach(e=>{e.props={disabled:t}})}}function f(s){return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function dt(s){try{const t=new URL(String(s),"https://placeholder.invalid");return t.protocol==="http:"||t.protocol==="https:"?f(String(s)):null}catch{return null}}const ht=`
  :host {
    display: block;
    height: 100%;
  }

  .card {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid var(--border, #e5e5e5);
    border-radius: var(--radius-md, 12px);
    overflow: hidden;
    background: var(--bg, #fff);
    color: var(--ink, #0a0a0a);
    transition: border-color var(--dur-color, 150ms) var(--ease, ease);
  }

  .card-toggle:hover .card,
  .card-toggle:focus-visible .card {
    border-color: var(--border-strong, #d4d4d4);
  }

  /* El botón envuelve la tarjeta: toda ella es activable (click/teclado/lector). */
  .card-toggle {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .card-toggle:disabled {
    cursor: default;
  }

  /* Marco de proyecto (DESIGN §4): 12px en accent-soft, imagen 16:10 */
  .card-frame {
    display: block;
    padding: 12px;
    background: var(--accent-soft, #ede9fe);
  }

  .card-frame img,
  .card-placeholder {
    display: block;
    width: 100%;
    /* Los atributos width/height del <img> reservan la caja 16:10 antes de
       que llegue la imagen (sin CLS); height:auto la deja fluir con el ancho. */
    height: auto;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    border-radius: var(--radius-sm, 8px);
    transition: transform var(--dur-color, 150ms) var(--ease, ease);
  }

  .card-toggle:hover .card-frame img {
    transform: scale(1.02);
  }

  /* Placeholder (R10): bloque neutro con el mismo 16:10; el nombre va en aria-label */
  .card-placeholder {
    background: var(--surface-2, #ededed);
  }

  .card-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 16px;
  }

  .card-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  /* R11: título truncado a 1 línea en colapsado → altura de cabecera uniforme */
  .card-title {
    min-width: 0;
    font-size: 18px;
    line-height: 1.3;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :host([expanded]) .card-title {
    overflow: visible;
    text-overflow: unset;
    white-space: normal;
    overflow-wrap: break-word;
  }

  .badge {
    flex-shrink: 0;
    font-family: var(--font-mono, monospace);
    font-size: 12px;
    padding: 2px 8px;
    border-radius: var(--radius-full, 999px);
    border: 1px solid var(--border-strong, #d4d4d4);
    color: var(--muted, #525252);
  }

  /* R11: descripción truncada a 3 líneas con puntos suspensivos en colapsado */
  .card-desc {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 15px;
    line-height: 24px;
    color: var(--ink-2, #404040);
    margin-top: 8px;
    overflow-wrap: break-word;
  }

  :host([expanded]) .card-desc {
    -webkit-line-clamp: unset;
    overflow: visible;
  }

  /* R11: la fila de meta existe siempre (altura reservada) aunque falten datos */
  .card-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 32px;
    margin-top: auto;
    padding-top: 12px;
    font-family: var(--font-mono, monospace);
    font-size: 13px;
    color: var(--muted, #525252);
  }

  .chip {
    font-family: var(--font-mono, monospace);
    font-size: 13px;
    line-height: 20px;
    background: var(--surface, #f5f5f5);
    border-radius: var(--radius-sm, 8px);
    padding: 2px 8px;
  }

  /* Enlace: solo en expandido (R11: colapsado = contenido truncado) */
  .card-link {
    display: none;
    margin-top: 12px;
    font-size: 15px;
  }

  :host([expanded]) .card-link {
    display: block;
  }

  .card-link a {
    color: inherit;
    text-underline-offset: 3px;
    overflow-wrap: break-word;
  }

  .card-link a:hover {
    text-decoration-color: var(--accent, #6d28d9);
  }

  .not-available {
    color: var(--muted, #525252);
  }

  /* R34: con prefers-reduced-motion no se ejecuta ninguna animación */
  @media (prefers-reduced-motion: reduce) {
    .card,
    .card-frame img {
      transition: none;
    }
    .card-toggle:hover .card-frame img {
      transform: none;
    }
  }
`;class pt extends HTMLElement{#t={project:{},i18n:null,lang:"es",expanded:!1,featured:!1,disabled:!1};#e;constructor(){super(),this.#e=this.attachShadow({mode:"open"})}static get observedAttributes(){return["expanded"]}connectedCallback(){this.#o()}attributeChangedCallback(t,e,o){t==="expanded"&&(this.#t.expanded=o!==null,this.isConnected&&this.#o())}set props(t){this.#t={...this.#t,...t},this.toggleAttribute("expanded",!!this.#t.expanded),this.isConnected&&this.#o()}get projectId(){return this.#t.project?.id}#o(){const{project:t,i18n:e,lang:o,expanded:r,featured:a,disabled:i}=this.#t,n=e?.t?.bind(e)??(y=>y),l=q(t.fecha,o),d=dt(t.enlace),v=f(t.nombre);this.#e.innerHTML=`
      <style>${ht}</style>
      <article class="card">
        <button
          type="button"
          class="card-toggle"
          aria-expanded="${r}"
          aria-label="${n(r?"tarjeta.colapsar":"tarjeta.expandir")}: ${v}"
          ${i?"disabled":""}
        >
          <span class="card-frame">
            ${t.imagen?`<img src="${f(t.imagen)}" alt="${v}" width="480" height="300" loading="lazy" decoding="async" data-card-image />`:`<span class="card-placeholder" role="img" aria-label="${v}" data-card-placeholder></span>`}
          </span>
          <span class="card-body">
            <span class="card-title-row">
              <span class="card-title">${v}</span>
              ${a?`<span class="badge">${n("tarjeta.destacado")}</span>`:""}
            </span>
            ${t.descripcion?`<span class="card-desc">${f(t.descripcion)}</span>`:""}
            <span class="card-meta">
              ${t.tecnologia?`<span class="chip">${f(t.tecnologia)}</span>`:""}
              ${l?`<time datetime="${f(t.fecha)}">${l}</time>`:""}
            </span>
            <span class="card-link">
              ${d?`<a href="${d}" target="_blank" rel="noopener noreferrer">${n("tarjeta.verRepositorio")}</a>`:`<span class="not-available">${n("tarjeta.noDisponible")}</span>`}
            </span>
          </span>
        </button>
      </article>
    `,this.#e.querySelector("[data-card-image]")?.addEventListener("error",y=>{const k=y.target,b=document.createElement("span");b.className="card-placeholder",b.setAttribute("role","img"),b.setAttribute("aria-label",k.getAttribute("alt")??""),b.setAttribute("data-card-placeholder",""),k.replaceWith(b)},{once:!0}),this.#e.querySelector(".card-toggle")?.addEventListener("click",()=>{this.#t.disabled||this.dispatchEvent(new CustomEvent("card-toggle",{detail:{id:this.projectId,nombre:this.#t.project?.nombre},bubbles:!0,composed:!0}))})}}customElements.define("project-card",pt);class ut extends HTMLElement{#t={page:1,totalPages:1,i18n:null};connectedCallback(){this.#e()}set props(t){this.#t={...this.#t,...t},this.isConnected&&this.#e()}#e(){const{page:t,totalPages:e,i18n:o}=this.#t,r=o?.t?.bind(o)??(a=>a);if(e<=1){this.innerHTML="";return}this.innerHTML=`
      <nav class="pagination" aria-label="${r("portfolio.proyectos")}">
        <button type="button" class="btn-secondary" data-page="${t-1}" ${t<=1?"disabled":""}>
          ${r("paginacion.anterior")}
        </button>
        <span class="pagination-status" aria-live="polite">
          ${r("paginacion.pagina",{n:t,total:e})}
        </span>
        <button type="button" class="btn-secondary" data-page="${t+1}" ${t>=e?"disabled":""}>
          ${r("paginacion.siguiente")}
        </button>
      </nav>
    `,this.querySelectorAll("[data-page]").forEach(a=>a.addEventListener("click",()=>{this.dispatchEvent(new CustomEvent("page-change",{detail:{page:Number(a.dataset.page)},bubbles:!0,composed:!0}))}))}}customElements.define("pagination-controls",ut);class ft{#t;#e;#o;#r=null;#a=!1;constructor(t,e){this.#t=t,this.#e=e,this.#o=window.matchMedia("(min-width: 900px)"),this.#o.addEventListener("change",()=>{this.#r&&this.render(this.#r)})}render(t){const e=this.#e.t.bind(this.#e),o=this.#r;if(this.#r=t,t.status==="error"){this.#t.innerHTML=`
        <div class="state state-error" role="alert">
          <p class="state-label">
            <svg class="state-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
              <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 4.5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="8" cy="11" r="0.9" fill="currentColor"/>
            </svg>
            ${e("portfolio.errorTitulo")}
          </p>
          <p class="state-text">${e("portfolio.error")}</p>
        </div>`;return}if(t.status==="loading"){this.#t.innerHTML="";return}if(o&&this.#c(o,t)){this.#d(t);return}this.#t.innerHTML=`
      ${this.#s(t,e)}
      <section class="projects-section" aria-labelledby="projects-heading">
        <h2 id="projects-heading">${e("portfolio.proyectos")}</h2>
        ${this.#i(t,e)}
        ${this.#n(t,e)}
      </section>
    `;const r=this.#t.querySelector("[data-filters]");r?.addEventListener("toggle",()=>{this.#a=r.open}),this.#l(t)}#s(t,e){return t.featured.length?`
      <section class="featured-section" aria-labelledby="featured-heading">
        <h2 id="featured-heading">${e("portfolio.destacados")}</h2>
        <div class="card-grid" data-featured-grid></div>
      </section>`:""}#i(t,e){const{filters:o}=t.state,{tecnologias:r,anios:a}=t.filterOptions,i=(n,l,d)=>`<option value="${n}" ${d===n?"selected":""}>${l}</option>`;return`
      <details class="filters" data-filters ${this.#h()||this.#a?"open":""}>
        <summary aria-label="${e("portfolio.filtros")}">${e("portfolio.filtros")}</summary>
        <div class="filters-body">
          <label>
            ${e("portfolio.tecnologia")}
            <select data-filter="tecnologia">
              ${i("",e("portfolio.todas"),o.tecnologia??"")}
              ${r.map(n=>i(n,n,o.tecnologia)).join("")}
            </select>
          </label>
          <label>
            ${e("portfolio.anio")}
            <select data-filter="anio">
              ${i("",e("portfolio.todos"),o.anio??"")}
              ${a.map(n=>i(n,n,o.anio)).join("")}
            </select>
          </label>
          <label>
            ${e("portfolio.orden")}
            <select data-order>
              ${i("desc",e("portfolio.ordenDesc"),t.state.order)}
              ${i("asc",e("portfolio.ordenAsc"),t.state.order)}
            </select>
          </label>
        </div>
      </details>`}#n(t,e){const{list:o}=t;if(o.total===0&&t.projectsTotal===0)return`
        <div class="state state-empty">
          <svg class="state-illustration" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
            <rect x="6" y="10" width="36" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <path d="M6 18h36" stroke="currentColor" stroke-width="1.5"/>
            <path d="M14 26h12M14 30h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <p class="state-title">${e("portfolio.vacioGlobalTitulo")}</p>
          <p class="state-text">${e("portfolio.vacioGlobal")}</p>
        </div>`;if(o.total===0)return`
        <div class="state state-empty state-empty-filters">
          <svg class="state-illustration" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
            <path d="M8 12h32l-12 14v10l-8 4V26L8 12z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M33 33l8 8M41 33l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <p class="state-title">${e("portfolio.vacioFiltrosTitulo")}</p>
          <p class="state-text">${e("portfolio.vacioFiltros")}</p>
          <button type="button" class="btn-secondary" data-clear-filters>${e("portfolio.limpiarFiltros")}</button>
        </div>`;const r=o.total===1?"portfolio.contadorSingular":"portfolio.contador";return`
      <p class="results-counter" aria-live="polite">${e(r,{n:o.total})}</p>
      <div class="card-grid" data-list-grid></div>
      <pagination-controls></pagination-controls>`}#l(t){const e=(r,a,i)=>{if(r){r.innerHTML="";for(const n of a){const l=document.createElement("project-card");l.props={project:n,i18n:this.#e,lang:t.lang,expanded:t.state.expandedProjectId===n.id,featured:i.has(n.id)},r.appendChild(l)}}};e(this.#t.querySelector("[data-featured-grid]"),t.featured,t.featuredIds),e(this.#t.querySelector("[data-list-grid]"),t.list.items,t.featuredIds);const o=this.#t.querySelector("pagination-controls");o&&(o.props={page:t.list.page,totalPages:t.list.totalPages,i18n:this.#e})}#c(t,e){if(t.lang!==e.lang||t.status!==e.status||t.state.expandedProjectId===e.state.expandedProjectId)return!1;const o=(r,a)=>r.length===a.length&&r.every((i,n)=>i.id===a[n]?.id);return o(t.featured,e.featured)&&o(t.list.items,e.list.items)&&t.list.page===e.list.page&&t.list.total===e.list.total&&t.state.order===e.state.order&&t.state.filters.tecnologia===e.state.filters.tecnologia&&t.state.filters.anio===e.state.filters.anio}#d(t){this.#t.querySelectorAll("project-card").forEach(e=>{e.props={expanded:t.state.expandedProjectId===e.projectId}})}#h(){return this.#o.matches}}class gt{#t;#e;constructor(t,e){this.#t=t,this.#e=e}render({profile:t,status:e}){const o=this.#e.t.bind(this.#e);if(e==="error"){this.#t.innerHTML=`
        <div class="state state-error" role="alert">
          <p class="state-label">
            <svg class="state-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
              <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 4.5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="8" cy="11" r="0.9" fill="currentColor"/>
            </svg>
            ${o("portfolio.errorTitulo")}
          </p>
          <p class="state-text">${o("portfolio.error")}</p>
        </div>`;return}if(e!=="ready"){this.#t.innerHTML="";return}const r=Array.isArray(t.sobreMi)?t.sobreMi.filter(Boolean):[];if(!t.presentacion&&r.length===0){this.#t.innerHTML="";return}this.#t.innerHTML=`
      <h1>${o("nav.sobreMi")}</h1>
      <div class="reading-width">
        ${t.presentacion?`<p class="lead">${t.presentacion}</p>`:""}
        ${r.map(a=>`<p>${a}</p>`).join("")}
      </div>
    `}}class bt{#t;#e;constructor(t,e){this.#t=t,this.#e=e}render({profile:t,status:e}){const o=this.#e.t.bind(this.#e);if(e==="error"){this.#t.innerHTML=`
        <div class="state state-error" role="alert">
          <p class="state-label">
            <svg class="state-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
              <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 4.5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="8" cy="11" r="0.9" fill="currentColor"/>
            </svg>
            ${o("portfolio.errorTitulo")}
          </p>
          <p class="state-text">${o("portfolio.error")}</p>
        </div>`;return}if(e!=="ready"){this.#t.innerHTML="";return}const r=Array.isArray(t.ahora)?t.ahora.filter(Boolean):[];if(r.length===0){this.#t.innerHTML="";return}this.#t.innerHTML=`
      <h1>${o("nav.ahora")}</h1>
      <div class="reading-width">
        <ul class="now-list">
          ${r.map(a=>`<li>${a}</li>`).join("")}
        </ul>
      </div>
    `}}const mt=new at,p=new rt,vt=new R("data/"),c=new N;let h=new L([]);const g={profile:{},projects:[]},m={portfolio:document.querySelector('[data-view="portfolio"]'),"sobre-mi":document.querySelector('[data-view="sobre-mi"]'),ahora:document.querySelector('[data-view="ahora"]')},P=document.querySelector("app-header"),yt=document.querySelector("app-footer"),wt=new ft(m.portfolio,p),$t=new gt(m["sobre-mi"],p),xt=new bt(m.ahora,p),D=new it(s=>c.set({view:s})),jt=new nt({state:c,i18n:p,storage:mt,router:D,data:g,onDataReload:F}),kt=new lt(P),Et=new ct(c,m.portfolio,p);async function F(s){try{const{profile:t,projects:e}=await vt.load(s);g.profile=t,g.projects=e,h=new L(e),c.set({status:"ready"})}catch(t){console.error(t),c.set({status:"error"})}}function St(){const s=c.get();for(const[t,e]of Object.entries(m))e.hidden=t!==s.view;P.props={profile:g.profile,i18n:p,state:s},yt.props={i18n:p,state:s},wt.render({status:s.status,featured:h.sortByDate(h.getFeatured(),s.order),featuredIds:h.getFeaturedIds(),list:h.query({filters:s.filters,order:s.order,page:s.page}),filterOptions:h.getFilterOptions(),projectsTotal:h.projects.length,state:s,lang:s.lang}),$t.render({profile:g.profile,status:s.status}),xt.render({profile:g.profile,status:s.status})}c.subscribe(St);jt.init();Et.start();kt.start();D.start();await F(c.get().lang);
