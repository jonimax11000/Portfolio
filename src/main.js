/**
 * main.js — bootstrap de la aplicación.
 * Instancia servicios, modelo, controladores y vistas; arranca el router.
 * MVC: modelos (estado + dominio puro) / vistas (renderizan) / controladores (eventos).
 */
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import './views/components/app-header.js';
import './views/components/app-footer.js';

import { AppState } from './models/AppState.js';
import { ProjectModel } from './models/ProjectModel.js';
import { DataService } from './services/DataService.js';
import { I18nService } from './services/I18nService.js';
import { StorageService } from './services/StorageService.js';
import { RouterService } from './services/RouterService.js';
import { AppController } from './controllers/AppController.js';
import { HeaderController } from './controllers/HeaderController.js';
import { ProjectsController } from './controllers/ProjectsController.js';
import { PortfolioView } from './views/PortfolioView.js';
import { AboutView } from './views/AboutView.js';
import { NowView } from './views/NowView.js';

// --- Servicios (infraestructura, sin estado de dominio) ---
const storage = new StorageService();
const i18n = new I18nService();
const dataService = new DataService('data/');

// --- Modelo (estado + dominio) ---
const state = new AppState();
let projectModel = new ProjectModel([]);
const data = { profile: {}, projects: [] }; // referencia compartida con AppController

// --- Vistas ---
const sections = {
  portfolio: document.querySelector('[data-view="portfolio"]'),
  'sobre-mi': document.querySelector('[data-view="sobre-mi"]'),
  ahora: document.querySelector('[data-view="ahora"]')
};
const header = document.querySelector('app-header');
const footer = document.querySelector('app-footer');

const portfolioView = new PortfolioView(sections.portfolio, i18n);
const aboutView = new AboutView(sections['sobre-mi'], i18n);
const nowView = new NowView(sections.ahora, i18n);

// --- Router (vistas SPA por hash: #/, #/sobre-mi, #/ahora) ---
const router = new RouterService((view) => state.set({ view }));

// --- Controladores ---
const appController = new AppController({
  state,
  i18n,
  storage,
  router,
  data,
  onDataReload: loadData
});
const headerController = new HeaderController(header);
const projectsController = new ProjectsController(state, sections.portfolio, i18n);

// --- Carga de datos (R24, R27, R33, R40) ---
async function loadData(lang) {
  try {
    const { profile, projects } = await dataService.load(lang);
    data.profile = profile;
    data.projects = projects;
    projectModel = new ProjectModel(projects);
    state.set({ status: 'ready' });
  } catch (error) {
    console.error(error);
    state.set({ status: 'error' }); // estado de error controlado (R27)
  }
}

// --- Render central: las vistas se suscriben al estado ---
function render() {
  const s = state.get();

  // Navegación SPA: muestra solo la vista activa (R35).
  for (const [view, section] of Object.entries(sections)) {
    section.hidden = view !== s.view;
  }

  header.props = { profile: data.profile, i18n, state: s };
  footer.props = { i18n, state: s };

  portfolioView.render({
    status: s.status,
    // R20: los destacados son los 3 primeros del JSON (sin filtros ni
    // paginación). R21: se presentan con el mismo orden por fecha que el
    // listado general; los sin fecha van al final también aquí (R45).
    featured: projectModel.sortByDate(projectModel.getFeatured(), s.order),
    featuredIds: projectModel.getFeaturedIds(),
    list: projectModel.query({ filters: s.filters, order: s.order, page: s.page }),
    filterOptions: projectModel.getFilterOptions(),
    projectsTotal: projectModel.projects.length,
    state: s,
    lang: s.lang
  });

  aboutView.render({ profile: data.profile, status: s.status });
  nowView.render({ profile: data.profile, status: s.status });
}

// --- Arranque ---
state.subscribe(render);
appController.init();
projectsController.start();
headerController.start();
router.start();
await loadData(state.get().lang);
