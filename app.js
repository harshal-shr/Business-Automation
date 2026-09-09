/* =========================================================
   botmart PRO — AI Agents Marketplace
   ========================================================= */
const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- helpers ---------- */
const esc = (str = '') => String(str).replace(/[&<>"']/g,
  c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const dice = (seed, style = 'bottts-neutral') =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

const store = {
  get(k, fb){ try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; } catch(e){ return fb; } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};

/* ---------- seed data ---------- */
const SEED_SYSTEMS = [
  { id:'t2', title:'WhatsApp Customer Support Agent', desc:'nsdd fd nd a — Auto-replies customer queries on WhatsApp using GPT-4, LangChain & a vector knowledge base.', by:'Testing Desktop', status:'BOOKED',
    tags:['OpenAI','Python'], avatar:dice('TestingDesktop') },
  { id:'t1', title:'Invoice Processing Agent', desc:'olhsd if iof diosd — Extracts, validates and posts invoice data from PDFs directly into your accounting database.', by:'Testing Desktop', status:'BOOKED',
    tags:['LangChain','Database'], avatar:dice('TestingDesktop2') },
  { id:'t3', title:'Slack Task Delegation Bot', desc:'Reads Slack channels, assigns tasks to team members automatically and posts daily standup summaries.', by:'DevNode AI', status:'OPEN TO ACQUIRE',
    tags:['Slack Bot','OpenAI'], avatar:dice('DevNode') },
  { id:'t4', title:'Lead Enrichment Pipeline', desc:'Takes raw lead lists, enriches them with firmographic data and scores them before pushing to your CRM.', by:'AgentForge', status:'OPEN TO ACQUIRE',
    tags:['Python','Database'], avatar:dice('AgentForge') },
];
const SEED_NEEDS = [
  { id:'b2', title:'WhatsApp Support Automation', desc:'jn msd id fddoj s — Need an AI agent that can automatically handle customer queries and replies on WhatsApp.', by:'bus', duration:'3 weeks', status:'BOOKED', avatar:dice('b2','shapes') },
  { id:'b1', title:'Inventory Sync Workflow', desc:'jndd df insd sdinds — Auto-sync inventory levels between our store, warehouse and marketplace listings.', by:'bus', duration:'2 weeks', status:'BOOKED', avatar:dice('b1','shapes') },
  { id:'b3', title:'Email Triage Agent', desc:'Classify incoming support emails by urgency and auto-draft replies for common questions.', by:'RetailCo', duration:'4 weeks', status:'OPEN TO BUILD', avatar:dice('b3','shapes') },
];

let systems = store.get('bm_systems', SEED_SYSTEMS);
let needs   = store.get('bm_needs', SEED_NEEDS);
let users   = store.get('bm_users', []);
let user    = store.get('bm_user', null);

let feedFilter = 'ALL';
let needFilter = 'ALL';
let feedQuery  = '';
let activeTag  = '';

/* ---------- toast ---------- */
function toast(msg){
  $('#bmToastMsg').textContent = msg;
  bootstrap.Toast.getOrCreateInstance($('#bmToast'), { delay: 2600 }).show();
}
function copySupport(){
  navigator.clipboard?.writeText('support@botmart.com');
  toast('Support email copied to clipboard.');
}

/* ---------- routing ---------- */
const PAGES = ['landing','auth','feed','needs','creator','inbox','profile'];

function go(page){
  if(user && (page === 'landing' || page === 'auth')) page = 'feed';
  if(!user && !['landing','auth'].includes(page)) page = 'landing';

  PAGES.forEach(p => $('#page-' + p).classList.toggle('d-none', p !== page));

  $('#navPublic').classList.toggle('d-none', !!user);
  $('#mainNav').classList.toggle('d-none', !user);
  $('#siteFooter').classList.toggle('d-none', !user);

  $$('.nav-link[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === page));

  if(page === 'feed')    { renderSystems(); renderFeedStats(); }
  if(page === 'needs')   renderNeeds();
  if(page === 'creator') renderCreator();
  if(page === 'profile') renderProfile();

  const c = $('#navMenu');
  if(c && c.classList.contains('show')) bootstrap.Collapse.getInstance(c)?.hide();
  window.scrollTo(0, 0);
}

/* ---------- landing CTAs ---------- */
function startAs(role){
  go('auth');
  showAuth('register');
  const r = document.querySelector(`input[name="regRole"][value="${role}"]`);
  if(r){ r.checked = true; toggleCompany(role === 'business'); }
}

/* ---------- auth ---------- */
function showAuth(mode){
  $('#authRegister').classList.toggle('d-none', mode !== 'register');
  $('#authLogin').classList.toggle('d-none', mode !== 'login');
}
function toggleCompany(show){
  $('#companyWrap').classList.toggle('d-none', !show);
  $('#regCompany').required = show;
}

function handleRegister(e){
  e.preventDefault();
  const role    = document.querySelector('input[name="regRole"]:checked').value;
  const name    = $('#regName').value.trim();
  const company = $('#regCompany').value.trim();
  const email   = $('#regEmail').value.trim().toLowerCase();
  const pass    = $('#regPass').value;

  if(role === 'business' && !company){ toast('Company Name is required for Business Clients.'); return; }
  if(users.some(u => u.email === email)){ toast('Account already exists. Please sign in.'); showAuth('login'); return; }

  user = {
    name, company, email, pass, role,
    github:  $('#regGithub').value.trim(),
    linkedin:$('#regLinkedin').value.trim(),
    handle:'@set_handle', bio:'', avatarUrl:''
  };
  users.push(user);
  store.set('bm_users', users);
  store.set('bm_user', user);
  e.target.reset();
  toggleCompany(false);
  toast('Profile registered. Welcome to botmart!');
  go('feed');
}

function handleLogin(e){
  e.preventDefault();
  const email = $('#loginEmail').value.trim().toLowerCase();
  const found = users.find(u => u.email === email);
  if(!found){ toast('No account found for this email. Please register.'); showAuth('register'); return; }
  user = found;
  store.set('bm_user', user);
  e.target.reset();
  toast('Signed in as ' + user.name);
  go('feed');
}

function logout(){
  user = null;
  localStorage.removeItem('bm_user');
  showAuth('register');
  go('landing');
}

/* ---------- systems feed ---------- */
function renderFeedStats(){
  $('#fsTotal').textContent  = systems.length;
  $('#fsOpen').textContent   = systems.filter(s => s.status === 'OPEN TO ACQUIRE').length;
  $('#fsBooked').textContent = systems.filter(s => s.status === 'BOOKED').length;
  $('#fsNeeds').textContent  = needs.length;
}

function setFeedFilter(f, btn){
  feedFilter = f;
  $$('#page-feed .seg-tab').forEach(b => b.classList.toggle('active', b === btn));
  renderSystems();
}
function setFeedQuery(v){ feedQuery = v; renderSystems(); }
function toggleTag(tag, btn){
  activeTag = (activeTag === tag) ? '' : tag;
  $$('#page-feed .chip').forEach(c => c.classList.toggle('active', c === btn && activeTag === tag));
  renderSystems();
}

function systemCard(s){
  return `
  <div class="col-12 col-md-6 col-xl-3">
    <div class="card bm-card system-card h-100">
      <div class="card-body d-flex flex-column">
        <div class="d-flex align-items-center gap-2">
          <img src="${s.avatar}" class="bm-avatar" alt="" loading="lazy">
          <div class="min-w-0">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="fw-bold">${esc(s.title)}</span>
              <span class="badge-tag">${esc(s.status)}</span>
            </div>
            <div class="bm-by">By: ${esc(s.by)}</div>
          </div>
        </div>
        <p class="bm-desc">${esc(s.desc)}</p>
        ${s.tags && s.tags.length ? `<div class="mb-2">${s.tags.map(t=>`<span class="badge-tag me-1" style="background:#f3f4f6;color:#6b7078;">${esc(t)}</span>`).join('')}</div>` : ''}
        <div class="mt-auto d-flex justify-content-end">
          <span class="pill-locked">🔒 ${esc(s.status)}</span>
        </div>
      </div>
    </div>
  </div>`;
}

function renderSystems(){
  const q = (feedQuery + ' ' + activeTag).toLowerCase().trim();
  const words = q ? q.split(/\s+/) : [];
  let list = systems.filter(s => feedFilter === 'ALL' || s.status === feedFilter);
  if(words.length){
    list = list.filter(s => {
      const hay = (s.title + ' ' + s.desc + ' ' + s.by + ' ' + (s.tags || []).join(' ')).toLowerCase();
      return words.every(w => hay.includes(w));
    });
  }
  $('#systemsGrid').innerHTML = list.length
    ? list.map(systemCard).join('')
    : `<div class="col-12"><div class="empty-state"><i class="bi bi-search d-block mb-2" style="font-size:2rem;"></i>No systems match your search attributes.</div></div>`;
}

/* ---------- business needs ---------- */
function setNeedFilter(f, btn){
  needFilter = f;
  $$('#page-needs .seg-tab').forEach(b => b.classList.toggle('active', b === btn));
  renderNeeds();
}

function needCard(n){
  return `
  <div class="col-12 col-lg-6">
    <div class="card bm-card need-card h-100">
      <div class="card-body">
        <div class="d-flex align-items-center gap-2">
          <img src="${n.avatar}" class="bm-avatar" alt="" loading="lazy">
          <div class="min-w-0">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="fw-bold">${esc(n.title)}</span>
              <span class="badge-tag">${esc(n.status)}</span>
            </div>
            <div class="bm-by">Posted by: ${esc(n.by)}</div>
          </div>
        </div>
        <p class="bm-desc">${esc(n.desc)}</p>
        <div class="duration-row">🕐 Duration: <span class="pill-duration">${esc(n.duration)}</span></div>
        <div class="d-flex justify-content-end">
          <span class="pill-locked">🔒 ${esc(n.status)}</span>
        </div>
      </div>
    </div>
  </div>`;
}

function renderNeeds(){
  let list = needs.filter(n => needFilter === 'ALL' || n.status === needFilter);
  $('#needsGrid').innerHTML = list.length
    ? list.map(needCard).join('')
    : `<div class="col-12"><div class="empty-state"><i class="bi bi-briefcase d-block mb-2" style="font-size:2rem;"></i>No business pipelines indexed for this filter.</div></div>`;
}

function postRequirement(e){
  e.preventDefault();
  needs.unshift({
    id:'n' + Date.now(),
    title: $('#reqTitle').value.trim(),
    desc:  $('#reqDesc').value.trim(),
    duration: $('#reqDuration').value.trim(),
    by: user.company || user.name,
    status:'OPEN TO BUILD',
    avatar: dice(user.name || 'bus', 'shapes')
  });
  store.set('bm_needs', needs);
  bootstrap.Modal.getInstance($('#reqModal'))?.hide();
  e.target.reset();
  toast('Requirement published to Active Business Pipelines.');
  go('needs');
}

/* ---------- creator portal ---------- */
function renderCreator(){
  const isDev = user && user.role === 'developer';
  $('#creatorRestricted').classList.toggle('d-none', isDev);
  $('#creatorFormWrap').classList.toggle('d-none', !isDev);
}

function publishSystem(e){
  e.preventDefault();
  const stack = $('#sysStack').value.trim();
  systems.unshift({
    id:'s' + Date.now(),
    title: $('#sysTitle').value.trim(),
    desc:  $('#sysDesc').value.trim(),
    by: user.name,
    status:'OPEN TO ACQUIRE',
    tags: stack ? stack.split(',').map(t => t.trim()).filter(Boolean) : [],
    avatar: dice(user.name || 'bot')
  });
  store.set('bm_systems', systems);
  e.target.reset();
  toast('System listing published to the marketplace index.');
  setFeedFilter('ALL', $('#page-feed .seg-tab'));
  go('feed');
}

/* ---------- profile ---------- */
function renderProfile(){
  if(!user) return;
  $('#pfName').value     = user.name || '';
  $('#pfHandle').value   = (user.handle || '').replace(/^@/, '');
  $('#pfAvatarUrl').value= user.avatarUrl || '';
  $('#pfBio').value      = user.bio || '';
  $('#pfGithub').value   = user.github || '';
  $('#pfLinkedin').value = user.linkedin || '';
  paintProfileHead();
}

function paintProfileHead(){
  const initials = (user.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const av = $('#pfAvatar');
  av.innerHTML = user.avatarUrl ? `<img src="${esc(user.avatarUrl)}" alt="">` : esc(initials);
  $('#pfHeadName').textContent = user.name || '—';
  $('#pfHeadHandle').textContent = user.handle || '@set_handle';
  $('#pfRoleBadge').textContent = user.role === 'developer' ? 'AI DEVELOPER' : 'BUSINESS CLIENT';
}

function saveProfile(e){
  e.preventDefault();
  const handle = $('#pfHandle').value.trim();
  user.name      = $('#pfName').value.trim();
  user.handle    = handle ? (handle.startsWith('@') ? handle : '@' + handle) : '@set_handle';
  user.avatarUrl = $('#pfAvatarUrl').value.trim();
  user.bio       = $('#pfBio').value.trim();
  user.github    = $('#pfGithub').value.trim();
  user.linkedin  = $('#pfLinkedin').value.trim();
  const i = users.findIndex(u => u.email === user.email);
  if(i > -1) users[i] = user;
  store.set('bm_users', users);
  store.set('bm_user', user);
  paintProfileHead();
  toast('Profile saved successfully.');
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  if(!user) showAuth('register');
  go(user ? 'feed' : 'landing');
});

