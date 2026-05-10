function getUserSafe() {
  try {
    return typeof getUser === "function"
      ? getUser()
      : JSON.parse(localStorage.getItem("user") || "null");
  } catch { return null; }
}

function renderTopnav(activePill) {
  const u = getUserSafe();
  const isAdmin = u?.role === "admin";
  const isHost = u?.role === "host";
  const avatar = u?.name
    ? u.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const homeLink = isAdmin ? "admin-dashboard.html" : isHost ? "host-dashboard.html" : "dashboard.html";

  return `
  <nav class="topnav">
    <a class="brand" href="${homeLink}">
    <div class="brand-logo">
      <img src="../assets/mmcoe-logo.png" alt="MMCOE Logo" style="width: 100%; height: 100%; object-fit: contain;">
    </div>
    <div class="brand-text">
      <div class="name" style="font-size: 0.72rem; line-height: 1.1; max-width: 220px; white-space: normal;">
        Marathwada Mitra Mandal's College of Engineering
      </div>
      <div class="sub">Event Portal</div>
    </div>
  </a>

    <div class="nav-center">
     ${!isAdmin && !isHost ? `<a class="nav-pill ${activePill === "events" ? "active" : ""}" href="events.html">Events</a>` : ""}
      <a class="nav-pill ${activePill === "dashboard" ? "active" : ""}" href="${homeLink}">
        ${isAdmin ? "Admin Panel" : isHost ? "Host Panel" : "Dashboard"}
      </a>
    </div>

    <div class="nav-right">
      <button class="nav-bell" id="bellBtn" onclick="toggleNotifDrawer()" title="Notifications">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="bell-badge" id="bellBadge" style="display:none">0</span>
      </button>
      <div class="nav-avatar" id="navAvatar">${avatar}</div>
      <button class="nav-logout" onclick="logout()">Logout</button>
    </div>
  </nav>`;
}

function renderStudentSidebar(active) {
  const links = [
    { id: "dashboard", label: "Dashboard", href: "dashboard.html" },
    { id: "myevents", label: "My Events", href: "my-registrations.html" },
    { id: "certs", label: "Certificates", href: "certificates.html" },
    { id: "profile", label: "Profile", href: "profile.html" }
  ];
  return `
  <aside class="sidebar">
    <nav class="sidebar-nav">
      ${links.map(l => `<a class="s-link ${active === l.id ? "active" : ""}" href="${l.href}">${l.label}</a>`).join("")}
    </nav>
  </aside>`;
}

function renderAdminSidebar(active) {
  const links = [
    { id: "dashboard", label: "Dashboard" },
    { id: "approvals", label: "Approvals" },
    { id: "create", label: "Create Event" },
    { id: "manage", label: "Manage Events" },
    { id: "participants", label: "Participants" },
    { id: "analytics", label: "Analytics" }
  ];
  return `
  <aside class="sidebar">
    <nav class="sidebar-nav">
      ${links.map(l => `<a class="s-link ${active === l.id ? "active" : ""}" onclick="showSec('${l.id}',this)" style="cursor:pointer">${l.label}</a>`).join("")}
    </nav>
  </aside>`;
}

function renderHostSidebar(active) {
  const links = [
    { id: "dashboard", label: "Dashboard" },
    { id: "create", label: "Create Event" },
    { id: "myevents", label: "My Events" },
    { id: "participants", label: "Participants" },
    { id: "analytics", label: "Analytics" },
    { id: "profile", label: "Profile", href: "profile.html" }
    
  ];
  return `
  <aside class="sidebar">
    <nav class="sidebar-nav">
     ${links.map(l => l.href
  ? `<a class="s-link" href="${l.href}">${l.label}</a>`
  : `<a class="s-link ${active === l.id ? "active" : ""}" onclick="showSec('${l.id}',this)" style="cursor:pointer">${l.label}</a>`
).join("")}
    </nav>
  </aside>`;
}

function renderNotifDrawer() {
  return `
  <div class="notif-overlay" id="notifOverlay" onclick="closeNotifDrawer()"></div>
  <div class="notif-drawer" id="notifDrawer">
    <div class="notif-hd">
      <h3>Notifications</h3>
      <div style="display:flex;gap:0.5rem;align-items:center">
        <button class="btn btn-ghost btn-sm" onclick="markAllRead()">Mark all read</button>
        <button onclick="closeNotifDrawer()" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:1.1rem;padding:2px 6px"></button>
      </div>
    </div>
    <div class="notif-list" id="notifListEl">
      <div class="empty" style="padding:2rem"><p>Loading…</p></div>
    </div>
    <div style="padding:0.75rem 1.1rem;border-top:1px solid var(--border);display:flex;justify-content:center">
      <button class="btn btn-ghost btn-sm" id="notifLoadMore" onclick="loadMoreNotifs()" style="display:none">Load more</button>
    </div>
  </div>`;
}

let _notifPage = 1;
const _notifPageSize = 5;
let _allNotifs = [];

function toggleNotifDrawer() {
  const overlay = document.getElementById("notifOverlay");
  const drawer = document.getElementById("notifDrawer");
  if (!overlay || !drawer) return;
  const isOpen = drawer.classList.contains("open");
  if (isOpen) { closeNotifDrawer(); return; }
  overlay.classList.add("open");
  drawer.classList.add("open");
  _notifPage = 1;
  fetchAndRenderNotifs();
}

function closeNotifDrawer() {
  document.getElementById("notifOverlay")?.classList.remove("open");
  document.getElementById("notifDrawer")?.classList.remove("open");
}

async function fetchAndRenderNotifs() {
  try {
    const r = await fetch(API + "/notifications", { headers: authHeaders() });
    _allNotifs = await r.json();
    if (!Array.isArray(_allNotifs)) _allNotifs = [];
    const unread = _allNotifs.filter(n => !n.is_read).length;
    const badge = document.getElementById("bellBadge");
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? "flex" : "none";
    }
    renderNotifPage();
  } catch (e) {
    const el = document.getElementById("notifListEl");
    if (el) el.innerHTML = '<div class="empty"><p>Could not load notifications.</p></div>';
  }
}

function renderNotifPage() {
  const el = document.getElementById("notifListEl");
  const moreBtn = document.getElementById("notifLoadMore");
  if (!el) return;
  const slice = _allNotifs.slice(0, _notifPage * _notifPageSize);
  if (!slice.length) {
    el.innerHTML = '<div class="empty"><p>No notifications yet.</p></div>';
    if (moreBtn) moreBtn.style.display = "none";
    return;
  }
  el.innerHTML = slice.map(n => `
    <div class="notif-item ${n.is_read ? "" : "unread"}" onclick="readNotif(${n.id}, this)">
      <div class="notif-dot ${n.is_read ? "grey" : "blue"}"></div>
      <div style="flex:1;min-width:0">
        <div class="notif-text" style="font-weight:${n.is_read ? 400 : 600}">${n.title || "Notification"}</div>
        ${n.description ? `<div class="notif-desc">${n.description}</div>` : ""}
        <div class="notif-time">${fmtDate(n.created_at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
      </div>
    </div>`).join("");
  if (moreBtn) moreBtn.style.display = _allNotifs.length > _notifPage * _notifPageSize ? "block" : "none";
}

function loadMoreNotifs() {
  _notifPage++;
  renderNotifPage();
}

async function readNotif(id, el) {
  try {
    await fetch(API + "/notifications/read/" + id, { method: "PUT", headers: authHeaders() });
    el?.classList.remove("unread");
    el?.querySelector(".notif-dot")?.classList.replace("blue", "grey");
    const n = _allNotifs.find(n => n.id === id);
    if (n) n.is_read = 1;
    const unread = _allNotifs.filter(n => !n.is_read).length;
    const badge = document.getElementById("bellBadge");
    if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? "flex" : "none"; }
  } catch (e) {}
}

async function markAllRead() {
  try {
    await fetch(API + "/notifications/read-all", { method: "PUT", headers: authHeaders() });
    _allNotifs.forEach(n => n.is_read = 1);
    const badge = document.getElementById("bellBadge");
    if (badge) badge.style.display = "none";
    renderNotifPage();
  } catch (e) {}
}

function toast(msg, type = "ok") {
  let t = document.getElementById("_toast");
  if (!t) { t = document.createElement("div"); t.id = "_toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.className = `toast ${type} show`;
  clearTimeout(t._to); t._to = setTimeout(() => t.classList.remove("show"), 3200);
}

const IMGS = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&q=80",
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400&q=80",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&q=80"
];

function getImg(e, i) { return e?.poster || IMGS[i % IMGS.length]; }

const CAT_CLASS = {
  Technical: "chip-technical", Coding: "chip-technical",
  Cultural: "chip-cultural", Sports: "chip-sports",
  Workshop: "chip-workshop", Workshops: "chip-workshop",
  Quiz: "chip-technical", Competitions: "chip-competitions", Other: "chip-other"
};

function catChip(cat) {
  return `<span class="chip ${CAT_CLASS[cat] || "chip-other"}">${cat || "Event"}</span>`;
}

function fmtDate(d, opts) {
  return new Date(d).toLocaleDateString("en-IN", opts || { month: "short", day: "numeric", year: "numeric" });
}