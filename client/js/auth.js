const API = "http://localhost:5000/api";

function getUser() { return JSON.parse(localStorage.getItem("user") || "null"); }
function getToken() { return getUser()?.token || ""; }
function authHeaders() { return { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() }; }

function requireAuth(role) {
  const u = getUser();
  if (!u) { location.href = "login.html"; return null; }
  if (role && u.role !== role) { location.href = "login.html"; return null; }
  return u;
}

function requireAuthMulti(roles) {
  const u = getUser();
  if (!u) { location.href = "login.html"; return null; }
  if (roles && !roles.includes(u.role)) { location.href = "login.html"; return null; }
  return u;
}

function logout() { localStorage.removeItem("user"); location.href = "login.html"; }

function initAvatar(u, id) {
  const el = document.getElementById(id);
  if (!el || !u) return;
  el.textContent = u.name ? u.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";
}

async function login() {
  const email = document.getElementById("lEmail").value.trim();
  const pass = document.getElementById("lPass").value;
  const err = document.getElementById("lErr");
  const btn = document.getElementById("lBtn");

  err.style.display = "none";

  if (!email || !pass) {
    err.textContent = "Please fill in all fields.";
    err.style.display = "block";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Signing in…";

  try {
    const r = await fetch(API + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass })
    });

    const d = await r.json();
    if (!r.ok) throw new Error(d.message || "Invalid credentials.");

    localStorage.setItem("user", JSON.stringify({ ...d.user, token: d.token }));

    if (d.user.role === "admin") location.href = "/pages/admin-dashboard.html";
    else if (d.user.role === "host") location.href = "/pages/host-dashboard.html";
    else location.href = "/pages/dashboard.html";

  } catch (e) {
    err.textContent = e.message;
    err.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Login";
  }
}

async function register() {
  const name = document.getElementById("rName").value.trim();
  const email = document.getElementById("rEmail").value.trim();
  const pass = document.getElementById("rPass").value;
  const conf = document.getElementById("rConf").value;
  const dept = document.getElementById("rDept").value;
  const year = document.getElementById("rYear").value;
  const role = document.getElementById("rRole")?.value || "student";
  const err = document.getElementById("rErr");
  const ok = document.getElementById("rOk");
  const btn = document.getElementById("rBtn");
  err.style.display = "none"; ok.style.display = "none";
  if (!name || !email || !pass) return showErr("rErr", "Name, email and password required.");
  if (pass !== conf) return showErr("rErr", "Passwords do not match.");
  if (pass.length < 6) return showErr("rErr", "Password must be at least 6 characters.");
  if (!dept) return showErr("rErr", "Please select your department.");
  btn.disabled = true; btn.textContent = "Creating account…";
  try {
    const r = await fetch(API + "/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password: pass, department: dept, year, role }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || "Registration failed.");
    ok.textContent = " Account created! You can now sign in."; ok.style.display = "block";
    setTimeout(showLogin, 1800);
  } catch (e) { showErr("rErr", e.message); }
  finally { btn.disabled = false; btn.textContent = "Create Account"; }
}

function showErr(id, msg) { const el = document.getElementById(id); if (!el) return; el.textContent = msg; el.style.display = "block"; }
function showLogin() { document.getElementById("regSec").style.display = "none"; document.getElementById("loginSec").style.display = "block"; }
function showReg() { document.getElementById("loginSec").style.display = "none"; document.getElementById("regSec").style.display = "block"; }