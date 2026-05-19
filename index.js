const VS = ["home", "programs", "about", "events", "contact", "games"];
function go(id, el) {
  VS.forEach((v) => {
    document.getElementById("v-" + v).classList.remove("on");
  });
  const view = document.getElementById("v-" + id);
  view.classList.add("on");
  document.querySelectorAll(".nb").forEach((b) => b.classList.remove("on"));
  const sb = document.querySelector(`.nb[onclick*="'${id}'"]`);
  if (sb) sb.classList.add("on");
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("on"));
  const mt = document.getElementById("t-" + id);
  if (mt) mt.classList.add("on");
  hydrateLazy(view);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
const lazyObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadLazy(entry.target);
              lazyObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "420px 0px" }
      )
    : null;
function loadLazy(el) {
  if (!el) return;
  if (el.dataset.src) {
    el.onload = () => el.classList.add("is-loaded");
    el.src = el.dataset.src;
    el.removeAttribute("data-src");
    if (el.complete) el.classList.add("is-loaded");
  }
  if (el.dataset.bg) {
    el.style.backgroundImage = `url("${el.dataset.bg}")`;
    el.classList.add("is-loaded");
    el.removeAttribute("data-bg");
  }
}
function hydrateLazy(scope = document) {
  scope.querySelectorAll("img[data-src], [data-bg]").forEach((el) => {
    if (lazyObserver) {
      lazyObserver.observe(el);
    } else {
      loadLazy(el);
    }
  });
}
function warmViewFromControl(control) {
  const match = control.getAttribute("onclick")?.match(/go\('([^']+)'/);
  if (!match) return;
  const view = document.getElementById("v-" + match[1]);
  if (view) hydrateLazy(view);
}
function filt(btn, age) {
  document.querySelectorAll(".fp").forEach((p) => p.classList.remove("on"));
  btn.classList.add("on");
  document.querySelectorAll(".pf").forEach((c) => {
    c.style.display = age === "all" || c.dataset.age === age ? "block" : "none";
  });
  hydrateLazy(document.getElementById("v-programs"));
}
function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function validatePhone(phone) {
  // very small, permissive check
  return phone && phone.replace(/[^0-9+]/g, '').length >= 7;
}

function showFormError(msg) {
  const el = document.getElementById('form-error');
  if (!el) return alert(msg);
  el.textContent = msg;
  el.style.display = 'block';
}

function clearFormError() {
  const el = document.getElementById('form-error');
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

async function submitForm() {
  clearFormError();
  const btn = document.getElementById('submitBtn');
  if (btn) btn.disabled = true;

  const name = document.getElementById('parentName')?.value?.trim() || '';
  const phone = document.getElementById('parentPhone')?.value?.trim() || '';
  const email = document.getElementById('parentEmail')?.value?.trim() || '';
  const age = document.getElementById('childAge')?.value || '';
  const numChildren = document.getElementById('numChildren')?.value || '';
  const context = document.getElementById('additionalContext')?.value || '';
  const interests = Array.from(document.querySelectorAll('.chips .chip.on')).map(c => c.textContent.trim());

  if (!name) {
    showFormError('Please enter your name.');
    if (btn) btn.disabled = false;
    return;
  }
  if (!validatePhone(phone)) {
    showFormError('Please enter a valid phone number.');
    if (btn) btn.disabled = false;
    return;
  }
  if (email && !validateEmail(email)) {
    showFormError('Please enter a valid email address.');
    if (btn) btn.disabled = false;
    return;
  }

  const payload = {
    id: 'msg_' + Date.now(),
    name,
    phone,
    email,
    age,
    numChildren,
    interests,
    context,
    createdAt: new Date().toISOString(),
  };

  try {
    // Try to POST to an API endpoint if available. This will fail gracefully in static hosts.
    const resp = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      handleSubmissionSuccess();
      // broadcast to other tabs for demo/admin visibility
      tryBroadcast(payload);
      return;
    }
  } catch (e) {
    // network or endpoint not present — fall back
  }

  // If API not available, persist locally / broadcast so other tabs can see it (demo mode)
  try {
    tryBroadcast(payload);
    saveLocalSubmission(payload);
    handleSubmissionSuccess();
  } catch (err) {
    showFormError('Submission failed. Please try again later.');
    console.error(err);
    if (btn) btn.disabled = false;
  }
}

function handleSubmissionSuccess(){
  document.getElementById('fw').style.display = 'none';
  const ok = document.getElementById('f-ok');
  if (ok) ok.classList.add('show');
}

function tryBroadcast(payload){
  try {
    if ('BroadcastChannel' in window) {
      const ch = new BroadcastChannel('cbda-contact');
      ch.postMessage(payload);
      ch.close();
      return;
    }
    // fallback: localStorage event
    localStorage.setItem('cbda-contact-last', JSON.stringify(payload));
  } catch (e) {
    console.warn('broadcast failed', e);
  }
}

function saveLocalSubmission(payload){
  try{
    const key = 'cbda-submissions';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(payload);
    localStorage.setItem(key, JSON.stringify(existing.slice(0,100)));
  }catch(e){
    console.warn('saveLocalSubmission failed', e);
  }
}
window.GAMEPLAY_VIDEOS = {
  gb1: "",
  gb2: "",
  gb3: "",
};
function viewGameplay(gameId, event) {
  if (event) event.stopPropagation();
  const videoUrl = window.GAMEPLAY_VIDEOS[gameId];
  if (typeof window.onViewGameplay === "function") {
    window.onViewGameplay(gameId, videoUrl);
    return;
  }
  if (videoUrl) {
    window.open(videoUrl, "_blank", "noopener");
    return;
  }
  alert("Gameplay walkthrough coming soon.");
}
function openGameModal(gameId) {
  alert("Game preview coming soon.");
}
function openLbox(src, title, text) {
  document.getElementById("li").src = src;
  document.getElementById("lt").textContent = title;
  document.getElementById("ls").textContent = text;
  document.getElementById("lbox").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLbox(e) {
  if (
    !e ||
    e.target === document.getElementById("lbox") ||
    e.target.closest(".lbox-close")
  ) {
    document.getElementById("lbox").classList.remove("open");
    document.body.style.overflow = "";
  }
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLbox(null);
});
document.addEventListener("DOMContentLoaded", () => {
  hydrateLazy(document.querySelector(".view.on") || document);
  document.querySelectorAll(".nb, .tab").forEach((control) => {
    control.addEventListener("pointerenter", () => warmViewFromControl(control), {
      passive: true,
    });
    control.addEventListener("touchstart", () => warmViewFromControl(control), {
      passive: true,
    });
  });
  // Setup message receiving so other tabs (or admin) can see submissions
  setupMessageChannel();
});

function displayInboxMessage(msg){
  try{
    const list = document.getElementById('inbox-list');
    if(!list) return;
    const li = document.createElement('li');
    li.style.padding = '8px 6px';
    li.style.borderBottom = '1px solid #f3f3f3';
    li.innerHTML = `<div style="font-weight:600">${escapeHtml(msg.name || 'Unknown')}</div><div style="font-size:12px;color:#444">${escapeHtml(msg.phone||'')} ${msg.email? ' • ' + escapeHtml(msg.email):''}</div><div style="margin-top:6px;font-size:13px;color:#222">${escapeHtml(msg.context||'')}</div><div style="margin-top:6px;font-size:11px;color:#777">${new Date(msg.createdAt||Date.now()).toLocaleString()}</div>`;
    list.insertBefore(li, list.firstChild);
  }catch(e){console.warn(e)}
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]});
}

function setupMessageChannel(){
  const showAdmin = new URLSearchParams(location.search).get('admin') === '1';
  const inbox = document.getElementById('inbox');
  if(showAdmin && inbox) inbox.style.display = 'block';

  try{
    if('BroadcastChannel' in window){
      const ch = new BroadcastChannel('cbda-contact');
      ch.onmessage = (ev)=>{ if (showAdmin) displayInboxMessage(ev.data); else console.info('cbda-contact msg', ev.data); };
    }
  }catch(e){console.warn('BroadcastChannel not available', e)}

  // fallback: listen for storage events (other tabs writing last item)
  window.addEventListener('storage', (e)=>{
    if(e.key === 'cbda-contact-last'){
      try{ const msg = JSON.parse(e.newValue); if(showAdmin) displayInboxMessage(msg); }
      catch(err){}
    }
  });

  // On load, populate existing submissions (if any) into inbox for admins
  if(showAdmin){
    try{
      const items = JSON.parse(localStorage.getItem('cbda-submissions')||'[]');
      items.slice(0,50).forEach(displayInboxMessage);
    }catch(e){/* ignore */}
  }
}
