

const API = "http://localhost:5000/api";

const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) window.location.href = "login.html";

const initials = user.name
  ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
  : "?";
document.getElementById("navAvatar").textContent = initials;

const STATUS_MAP = {
  registration_open:   { label: "Registration Open",   cls: "chip-open" },
  registration_closed: { label: "Registration Closed", cls: "chip-closed" },
  ongoing:             { label: "Event Ongoing",        cls: "chip-ongoing" },
  completed:           { label: "Event Completed",      cls: "chip-done" }
};

function formatCountdown(dateStr) {
  const ms = new Date(dateStr) - Date.now();
  if (ms <= 0) return { text: "Happening now!", cls: "urgent" };

  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);

  if (days > 0) {
    return {
      text: `${days}d ${hours}h left`,
      cls: days <= 3 ? "urgent" : days <= 7 ? "soon" : ""
    };
  }

  const mins = Math.floor((ms % 3600000) / 60000);
  return { text: `${hours}h ${mins}m left`, cls: "urgent" };
}

let _all = [];
let _active = "all";
let _search = "";
let _sort = "upcoming";
let _statusF = "";

async function loadEvents() {
  showSkeletons();

  try {
    const res = await fetch(`${API}/events`, {
      headers: authHeaders()
    });

    if (!res.ok) throw new Error("Failed to fetch events");

    const events = await res.json();

    _all = Array.isArray(events) ? events : [];
    buildCategoryTabs(_all);
    applyFilter();

  } catch (err) {
    console.error(err);

    document.getElementById("eventsGrid").innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">️</div>
        <p>Could not load events.<br>Make sure the server is running.</p>
      </div>`;
  }
}

function buildCategoryTabs(events) {
  const cats = ["all", ...new Set(events.map(e => e.category).filter(Boolean))];

  const wrap = document.getElementById("categoryTabs");

  wrap.innerHTML = cats.map(c => `
    <button class="cat-tab ${c === _active ? "active" : ""}"
      onclick="setCategory('${c}')">
      ${c === "all" ? "All Events" : c}
    </button>
  `).join("");
}

function setCategory(cat) {
  _active = cat;

  document.querySelectorAll(".cat-tab").forEach(b => {
    b.classList.toggle(
      "active",
      b.textContent === (cat === "all" ? "All Events" : cat)
    );
  });

  applyFilter();
}

function applyFilter() {
  const q = _search.toLowerCase().trim();

  let filtered = _all.filter(e => {
    const matchQ =
      !q ||
      (e.title || "").toLowerCase().includes(q) ||
      (e.category || "").toLowerCase().includes(q) ||
      (e.venue || "").toLowerCase().includes(q) ||
      (e.description || "").toLowerCase().includes(q);

    const matchCat = _active === "all" || e.category === _active;
    const matchS = !_statusF || e.status === _statusF;

    return matchQ && matchCat && matchS;
  });

  if (_sort === "upcoming")
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (_sort === "newest")
    filtered.sort((a, b) =>
      new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
    );

  if (_sort === "name")
    filtered.sort((a, b) => a.title.localeCompare(b.title));

  if (_sort === "popular")
    filtered.sort((a, b) =>
      (b.registered_count || 0) - (a.registered_count || 0)
    );

  renderCards(filtered);

  const total = document.getElementById("resultCount");
  if (total)
    total.textContent =
      filtered.length === _all.length
        ? `${_all.length} events`
        : `${filtered.length} of ${_all.length} events`;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

loadEvents();