(function () {
  "use strict";

  var USERS_KEY = "nomadUsers";
  var SESSION_KEY = "nomadSession";

  function loadUsers() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }
  function saveUsers(users) {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch (e) {}
  }
  function getSession() {
    try { return localStorage.getItem(SESSION_KEY) || null; } catch (e) { return null; }
  }
  function setSession(email) {
    try {
      if (email) localStorage.setItem(SESSION_KEY, email);
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  function currentUser() {
    var email = getSession();
    if (!email) return null;
    var users = loadUsers();
    return users[email] || null;
  }

  function initials(name) {
    if (!name) return "?";
    var parts = name.trim().split(/\s+/);
    var out = parts[0].charAt(0);
    if (parts.length > 1) out += parts[parts.length - 1].charAt(0);
    return out.toUpperCase();
  }

  function store() { return window.NomadTrails || null; }

  function activeTripIds() {
    return store() && store().getCartIds ? store().getCartIds() : [];
  }

  function saveSelectionToUser() {
    var email = getSession();
    if (!email || !store()) return;
    var users = loadUsers();
    if (!users[email]) return;
    users[email].trips = activeTripIds();
    saveUsers(users);
  }

  function union(a, b) {
    var out = a.slice();
    for (var i = 0; i < b.length; i++) {
      if (out.indexOf(b[i]) === -1) out.push(b[i]);
    }
    return out;
  }

  function signUp(name, email, password) {
    email = email.toLowerCase();
    var users = loadUsers();
    if (users[email]) {
      return { ok: false, error: "An account with that email already exists." };
    }
    users[email] = {
      name: name,
      email: email,
      password: password,
      joined: new Date().toISOString(),
      trips: activeTripIds()
    };
    saveUsers(users);
    setSession(email);
    emit();
    return { ok: true };
  }

  function logIn(email, password) {
    email = email.toLowerCase();
    var users = loadUsers();
    var user = users[email];
    if (!user || user.password !== password) {
      return { ok: false, error: "Email or password is incorrect." };
    }
    setSession(email);
    var merged = union(user.trips || [], activeTripIds());
    user.trips = merged;
    saveUsers(users);
    if (store() && store().setCartIds) store().setCartIds(merged);
    emit();
    return { ok: true };
  }

  function logOut() {
    saveSelectionToUser();
    setSession(null);
    if (store() && store().clearCart) store().clearCart();
    emit();
  }

  function emit() {
    document.dispatchEvent(new CustomEvent("auth:change", {
      detail: { user: currentUser() }
    }));
  }

  window.NomadAuth = {
    currentUser: currentUser,
    initials: initials,
    signUp: signUp,
    logIn: logIn,
    logOut: logOut
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function money(n) {
    return "$" + n.toLocaleString("en-US");
  }

  function buildModal() {
    if (document.getElementById("authModal")) return;
    var wrap = document.createElement("div");
    wrap.innerHTML = [
      '<div class="modal fade" id="authModal" tabindex="-1" aria-labelledby="authModalTitle" aria-hidden="true">',
      '  <div class="modal-dialog modal-dialog-centered">',
      '    <div class="modal-content">',
      '      <div class="modal-header">',
      '        <h2 class="modal-title h5" id="authModalTitle">Log in</h2>',
      '        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>',
      '      </div>',
      '      <div class="modal-body">',
      '        <p class="auth-note" role="note">Demo only. Accounts and saved trips are stored in this browser. Do not use a real password.</p>',
      '        <form id="loginForm" data-validate novalidate data-success="Welcome back! You are logged in.">',
      '          <div class="form-success mb-3" role="status" aria-live="polite"></div>',
      '          <div class="mb-3">',
      '            <label for="loginEmail" class="form-label">Email</label>',
      '            <input type="email" class="form-control" id="loginEmail" data-rule="email" data-required data-label="Email" placeholder="you@email.com" autocomplete="username">',
      '          </div>',
      '          <div class="mb-3">',
      '            <label for="loginPassword" class="form-label">Password</label>',
      '            <input type="password" class="form-control" id="loginPassword" data-required data-label="Password" placeholder="Your password" autocomplete="current-password">',
      '          </div>',
      '          <button type="submit" class="btn btn-clay w-100">Log in</button>',
      '          <p class="auth-switch text-center mt-3 mb-0">No account yet? <button type="button" id="toSignup">Create one</button></p>',
      '        </form>',
      '        <form id="signupForm" data-validate novalidate class="d-none" data-success="Account created. You are now logged in.">',
      '          <div class="form-success mb-3" role="status" aria-live="polite"></div>',
      '          <div class="mb-3">',
      '            <label for="signupName" class="form-label">Full name</label>',
      '            <input type="text" class="form-control" id="signupName" data-rule="name" data-required data-label="Full name" placeholder="Jane Wanderer" autocomplete="name">',
      '          </div>',
      '          <div class="mb-3">',
      '            <label for="signupEmail" class="form-label">Email</label>',
      '            <input type="email" class="form-control" id="signupEmail" data-rule="email" data-required data-label="Email" placeholder="you@email.com" autocomplete="username">',
      '          </div>',
      '          <div class="mb-3">',
      '            <label for="signupPassword" class="form-label">Password</label>',
      '            <input type="password" class="form-control" id="signupPassword" data-rule="password" data-required data-label="Password" placeholder="At least 8 characters, 1 number" autocomplete="new-password">',
      '          </div>',
      '          <button type="submit" class="btn btn-clay w-100">Create account</button>',
      '          <p class="auth-switch text-center mt-3 mb-0">Already a member? <button type="button" id="toLogin">Log in</button></p>',
      '        </form>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join("");
    document.body.appendChild(wrap.firstChild);
    registerForms();
  }

  function registerForms() {
    if (!window.NomadForms) return;
    window.NomadForms.handle("loginForm", function (v) {
      var r = logIn((v.loginEmail || "").trim(), v.loginPassword || "");
      if (!r.ok) return { ok: false, field: "loginPassword", error: r.error };
      closeModal();
      return { ok: true };
    });
    window.NomadForms.handle("signupForm", function (v) {
      var r = signUp((v.signupName || "").trim().replace(/\s+/g, " "), (v.signupEmail || "").trim(), v.signupPassword || "");
      if (!r.ok) return { ok: false, field: "signupEmail", error: r.error };
      closeModal();
      return { ok: true };
    });
    window.NomadForms.wire(document.getElementById("loginForm"));
    window.NomadForms.wire(document.getElementById("signupForm"));
  }

  function showView(which) {
    var login = document.getElementById("loginForm");
    var signup = document.getElementById("signupForm");
    var title = document.getElementById("authModalTitle");
    if (!login || !signup) return;
    if (which === "signup") {
      login.classList.add("d-none");
      signup.classList.remove("d-none");
      if (title) title.textContent = "Create account";
    } else {
      signup.classList.add("d-none");
      login.classList.remove("d-none");
      if (title) title.textContent = "Log in";
    }
  }

  function openModal(which) {
    buildModal();
    showView(which || "login");
    var banners = document.querySelectorAll("#authModal .form-success");
    for (var i = 0; i < banners.length; i++) banners[i].classList.remove("show");
    var el = document.getElementById("authModal");
    if (window.bootstrap && el) {
      window.bootstrap.Modal.getOrCreateInstance(el).show();
    }
  }
  function closeModal() {
    var el = document.getElementById("authModal");
    if (window.bootstrap && el) {
      var m = window.bootstrap.Modal.getInstance(el);
      if (m) m.hide();
    }
  }

  function renderNav() {
    var user = currentUser();
    var slots = document.querySelectorAll("[data-auth-slot]");
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      slot.innerHTML = "";
      if (user) {
        var who = document.createElement("span");
        who.className = "nav-user";
        who.innerHTML = '<span class="nav-avatar" aria-hidden="true">' + escapeHtml(initials(user.name)) + "</span>" +
          '<span class="d-none d-lg-inline">' + escapeHtml(user.name.split(" ")[0]) + "</span>";
        var profileLink = document.createElement("a");
        profileLink.href = document.getElementById("profile") ? "#profile" : "index.html#profile";
        profileLink.className = "nav-link";
        profileLink.setAttribute("aria-label", "Open profile of " + user.name);
        profileLink.appendChild(who);

        var out = document.createElement("button");
        out.type = "button";
        out.className = "btn btn-ghost btn-sm ms-lg-2";
        out.textContent = "Log out";
        out.addEventListener("click", logOut);

        slot.appendChild(profileLink);
        slot.appendChild(out);
      } else {
        var login = document.createElement("button");
        login.type = "button";
        login.className = "btn btn-ghost btn-sm";
        login.textContent = "Log in";
        login.addEventListener("click", function () { openModal("login"); });

        var join = document.createElement("button");
        join.type = "button";
        join.className = "btn btn-clay btn-sm ms-lg-2";
        join.textContent = "Sign up";
        join.addEventListener("click", function () { openModal("signup"); });

        slot.appendChild(login);
        slot.appendChild(join);
      }
    }
  }

  function savedTripsHtml() {
    var items = store() && store().getCart ? store().getCart() : [];
    if (!items.length) {
      return '<p class="pf-empty mb-0">No saved trips yet. Add expeditions from the Trails section.</p>';
    }
    var total = 0;
    var rows = items.map(function (it) {
      total += it.price * it.qty;
      return '<li><span>' + escapeHtml(it.name) + '</span><strong>' + money(it.price * it.qty) + '</strong></li>';
    }).join("");
    return '<ul class="profile-trips">' + rows + '</ul>' +
      '<div class="profile-trips-total"><span>Estimated total</span><strong>' + money(total) + '</strong></div>';
  }

  function renderProfile() {
    var body = document.getElementById("profileBody");
    if (!body) return;
    var user = currentUser();

    if (!user) {
      body.innerHTML = '<div class="profile-card text-center">' +
        '<p class="mb-3">You are not logged in. Log in or create an account to see your profile and keep your selected trips.</p>' +
        '<button type="button" class="btn btn-clay" id="profileLogin">Log in or sign up</button>' +
        "</div>";
      var btn = document.getElementById("profileLogin");
      if (btn) btn.addEventListener("click", function () { openModal("login"); });
      return;
    }

    var joined = new Date(user.joined);
    var joinedText = isNaN(joined.getTime()) ? "-" :
      joined.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    body.innerHTML = [
      '<div class="profile-card">',
      '  <div class="profile-head">',
      '    <span class="profile-avatar" aria-hidden="true">' + escapeHtml(initials(user.name)) + "</span>",
      "    <div>",
      '      <h3 class="mb-0">' + escapeHtml(user.name) + "</h3>",
      '      <span class="g-role" style="color:var(--amber);font-size:0.85rem;">Member</span>',
      "    </div>",
      "  </div>",
      '  <div class="profile-field"><span class="pf-label">Name</span><span class="pf-value">' + escapeHtml(user.name) + "</span></div>",
      '  <div class="profile-field"><span class="pf-label">Email</span><span class="pf-value">' + escapeHtml(user.email) + "</span></div>",
      '  <div class="profile-field"><span class="pf-label">Member since</span><span class="pf-value">' + joinedText + "</span></div>",
      '  <h4 class="profile-subtitle">Saved trips</h4>',
      savedTripsHtml(),
      '  <div class="d-flex flex-wrap gap-2 mt-3">',
      '    <a class="btn btn-clay" href="trips.html#reserve">Reserve saved trips</a>',
      '    <button type="button" class="btn btn-ghost" id="profileLogout">Log out</button>',
      "  </div>",
      "</div>"
    ].join("");
    var out = document.getElementById("profileLogout");
    if (out) out.addEventListener("click", logOut);
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildModal();

    var user = currentUser();
    if (user && store() && store().setCartIds && activeTripIds().length === 0 && user.trips && user.trips.length) {
      store().setCartIds(user.trips);
    }

    renderNav();
    renderProfile();

    document.addEventListener("cart:change", function () {
      saveSelectionToUser();
      renderProfile();
    });

    document.addEventListener("click", function (e) {
      if (e.target && e.target.id === "toSignup") showView("signup");
      if (e.target && e.target.id === "toLogin") showView("login");
    });
  });

  document.addEventListener("auth:change", function () {
    renderNav();
    renderProfile();
  });

  window.addEventListener("storage", function (e) {
    if (e.key === SESSION_KEY || e.key === USERS_KEY) {
      renderNav();
      renderProfile();
    }
  });
})();
