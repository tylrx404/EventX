

const API = "http://localhost:5000/api";

const user = JSON.parse(localStorage.getItem("user") || "null");

if (!user) {
  window.location.href = "login.html";
}

function initUserUI() {
  const initials = user.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const firstName = user.name ? user.name.split(" ")[0] : "Student";

  document.getElementById("navAvatar").textContent = initials;
  document.getElementById("greetingName").textContent = firstName;
}

function msUntil(dateStr) {
  return new Date(dateStr) - Date.now();
}

function formatCountdown(ms) {
  if (ms <= 0) return { text: "Happening now!", cls: "urgent" };

  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);

  if (days > 0)
    return {
      text: `${days}d ${hours}h remaining`,
      cls: days <= 3 ? "urgent" : days <= 7 ? "soon" : ""
    };

  if (hours > 0)
    return { text: `${hours}h ${minutes}m remaining`, cls: "urgent" };

  return { text: `${minutes}m ${secs}s`, cls: "urgent" };
}

function urgencyClass(dateStr) {
  const days = msUntil(dateStr) / 86400000;

  if (days <= 3) return "urgent";
  if (days <= 7) return "soon";

  return "normal";
}

const STATUS_MAP = {
  registration_open: { label: "Registration Open", cls: "chip-open" },
  registration_closed: { label: "Registration Closed", cls: "chip-closed" },
  ongoing: { label: "Event Ongoing", cls: "chip-ongoing" },
  completed: { label: "Event Completed", cls: "chip-done" }
};

function renderEvents(events) {
  const container = document.getElementById("eventsList");
  const pill = document.getElementById("eventsCountPill");
  const statEl = document.getElementById("statUpcoming");

  const upcoming = events.filter(e => msUntil(e.date) > -86400000);

  pill.textContent = `${upcoming.length} upcoming`;
  statEl.textContent = upcoming.length;

  if (upcoming.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"></div>
        <p>No upcoming events right now.</p>
      </div>`;
    return;
  }

  container.innerHTML = upcoming.map(ev => {

    const d = new Date(ev.date);
    const month = d.toLocaleString("en", { month: "short" }).toUpperCase();
    const day = d.getDate();
    const year = d.getFullYear();
    const time = d.toLocaleString("en", { hour: "2-digit", minute: "2-digit" });

    const urg = urgencyClass(ev.date);
    const st = STATUS_MAP[ev.status] || STATUS_MAP.registration_open;
    const cd = formatCountdown(msUntil(ev.date));

    return `
      <div class="event-card ${urg}">
        <div class="event-date-badge">
          <span class="month">${month}</span>
          <span class="day">${day}</span>
          <span class="year">${year}</span>
        </div>

        <div class="event-info">
          <div class="event-name">${ev.title}</div>

          <div class="event-meta">
            <span> ${ev.venue || "TBA"}</span>
            <span>️ ${ev.category || "General"}</span>
            <span> ${time}</span>
          </div>

          <div style="display:flex;gap:.5rem;">
            <span class="status-chip ${st.cls}">${st.label}</span>
            <span class="countdown ${cd.cls}">
              ⏱ ${cd.text}
            </span>
          </div>
        </div>

        <div class="event-action">
          <a class="btn-view" href="event-details.html?id=${ev.id}">View →</a>
        </div>
      </div>
    `;

  }).join("");
}

async function loadEvents() {
  try {
    const res = await fetch(`${API}/events/upcoming`, {
      headers: authHeaders()
    });
    const events = await res.json();
    renderEvents(Array.isArray(events) ? events : []);
  } catch (err) {
    console.error(err);
  }
}

async function loadNotifications() {
  try {
    const res = await fetch(`${API}/notifications`, {
      headers: authHeaders()
    });
    const notifs = await res.json();
    renderNotifications(Array.isArray(notifs) ? notifs : []);
  } catch (err) {
    console.error(err);
  }
}

async function readNotif(id) {
  try {
    await fetch(`${API}/notifications/read/${id}`, {
      method: "PUT",
      headers: authHeaders()
    });
    loadNotifications();
  } catch {}
}

async function markAllRead() {
  try {
    await fetch(`${API}/notifications/read-all`, {
      method: "PUT",
      headers: authHeaders()
    });
    loadNotifications();
  } catch {}
}

async function loadStats() {
  try {
    // Make sure this matches your route for myRegistrations
    const res = await fetch(`${API}/my-registrations`, {
      headers: authHeaders()
    });
    const data = await res.json();
    document.getElementById("statRegistered").textContent = Array.isArray(data) ? data.length : 0;
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {

  initUserUI();

  loadEvents();
  loadNotifications();
  loadStats();

});