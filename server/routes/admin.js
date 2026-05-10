const user = requireAuth("admin");
if (!user) throw "";

document.getElementById("_nav").innerHTML = renderTopnav("dashboard");
document.getElementById("_side").innerHTML = renderAdminSidebar("dashboard");

let events = [];
let parts = [];
let delId = null;
let barChart = null;
let pieChart = null;

window.showSec = function(name, el) {
document.querySelectorAll(".sec").forEach(s => s.classList.remove("on"));
document.querySelectorAll(".s-link").forEach(l => l.classList.remove("active"));

document.getElementById("sec-" + name).classList.add("on");
el?.classList.add("active");

if (name === "dashboard") loadDashboard();
if (name === "manage") loadManage();
if (name === "participants") loadParticipants();
if (name === "analytics") loadAnalytics();
};

async function loadDashboard() {
try {
const r = await fetch(API + "/admin/stats", { headers: authHeaders() });
const d = await r.json();

document.getElementById("dTotal").textContent = d.total_events || 0;
document.getElementById("dRegs").textContent = d.total_registrations || 0;
document.getElementById("dActive").textContent = d.active_events || 0;
document.getElementById("dUp").textContent = d.upcoming_events || 0;
} catch {}

try {
const r = await fetch(API + "/admin/events", { headers: authHeaders() });
events = await r.json();

const tb = document.getElementById("sumBody");

if (!events.length) {
tb.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem">No events</td></tr>`;
return;
}

tb.innerHTML = events.map(e => {
const pct = e.max_participants > 0
? Math.min(Math.round((e.registered_count / e.max_participants) * 100), 100)
: 0;

return `
<tr>
<td>${e.title}</td>
<td>${e.category || "—"}</td>
<td>${fmtDate(e.date)}</td>
<td>${pct}%</td>
</tr>`;
}).join("");
} catch {}
}

async function loadManage() {
try {
const r = await fetch(API + "/admin/events", { headers: authHeaders() });
events = await r.json();

const tb = document.getElementById("manBody");

if (!events.length) {
tb.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem">No events</td></tr>`;
return;
}

tb.innerHTML = events.map(e => `
<tr>
<td>${e.title}</td>
<td>${fmtDate(e.date)}</td>
<td>${e.registered_count || 0}</td>
<td>${e.max_participants || "∞"}</td>
<td>
<button onclick="openEdit(${e.id})">Edit</button>
<button onclick="openDel(${e.id},'${e.title.replace(/'/g,"")}')">Delete</button>
</td>
</tr>
`).join("");

} catch {}
}

async function loadParticipants() {
try {
const r = await fetch(API + "/admin/participants", { headers: authHeaders() });
parts = await r.json();

const tb = document.getElementById("partBody");

if (!parts.length) {
tb.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem">No participants</td></tr>`;
return;
}

tb.innerHTML = parts.map(p => `
<tr>
<td>${p.name}</td>
<td>${p.email}</td>
<td>${p.department || "—"}</td>
<td>${p.event_title || "—"}</td>
<td>${p.status}</td>
</tr>
`).join("");

} catch {}
}

async function loadAnalytics() {
let data = null;

try {
const r = await fetch(API + "/admin/analytics", { headers: authHeaders() });
data = await r.json();
} catch {}

const labels = data?.events?.map(e => e.title) || [];
const regs = data?.events?.map(e => e.registered_count) || [];

const catLbls = data?.categories?.map(c => c.name) || [];
const catData = data?.categories?.map(c => c.count) || [];

if (barChart) barChart.destroy();

barChart = new Chart(document.getElementById("chartBar"), {
type: "bar",
data: {
labels,
datasets: [{
label: "Registrations",
data: regs
}]
},
options: {
responsive: true,
maintainAspectRatio: false
}
});

if (pieChart) pieChart.destroy();

pieChart = new Chart(document.getElementById("chartPie"), {
type: "pie",
data: {
labels: catLbls,
datasets: [{
data: catData
}]
},
options: {
responsive: true,
maintainAspectRatio: false
}
});
}

async function createEvent() {
const title = document.getElementById("cTitle").value.trim();
const date = document.getElementById("cDate").value;
const venue = document.getElementById("cVenue").value.trim();

if (!title || !date || !venue) return;

await fetch(API + "/admin/events", {
method: "POST",
headers: authHeaders(),
body: JSON.stringify({
title,
date,
venue,
description: document.getElementById("cDesc").value,
category: document.getElementById("cCat").value,
registration_deadline: document.getElementById("cDeadline").value || null,
max_participants: parseInt(document.getElementById("cMax").value) || 0,
poster: document.getElementById("cPoster").value || null
})
});

loadManage();
}

function openEdit(id) {
const e = events.find(ev => ev.id === id);
if (!e) return;

document.getElementById("eId").value = e.id;
document.getElementById("eTitle").value = e.title;
document.getElementById("eVenue").value = e.venue || "";
document.getElementById("eMax").value = e.max_participants || "";
document.getElementById("eDate").value = new Date(e.date).toISOString().slice(0,16);

document.getElementById("editOverlay").classList.add("open");
}

async function saveEdit() {
const id = document.getElementById("eId").value;

await fetch(API + "/admin/events/" + id, {
method: "PUT",
headers: authHeaders(),
body: JSON.stringify({
title: document.getElementById("eTitle").value,
date: document.getElementById("eDate").value,
venue: document.getElementById("eVenue").value,
max_participants: parseInt(document.getElementById("eMax").value) || 0
})
});

document.getElementById("editOverlay").classList.remove("open");
loadManage();
}

function openDel(id, name) {
delId = id;
document.getElementById("delName").textContent = name;
document.getElementById("delOverlay").classList.add("open");
}

async function confirmDel() {
if (!delId) return;

await fetch(API + "/admin/events/" + delId, {
method: "DELETE",
headers: authHeaders()
});

document.getElementById("delOverlay").classList.remove("open");
delId = null;

loadManage();
}

loadDashboard();