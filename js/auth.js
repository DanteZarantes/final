(function () {
  "use strict";

  var USERS_KEY = "nomadUsers";
  var SESSION_KEY = "nomadSession";

  function loadUsers() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : {};
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
      joined: new Date().toISOString()
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
    emit();
    return { ok: true };
  }

  function logOut() {
    setSession(null);
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
      '        <p class="auth-note" role="note">Demo only — accounts are stored in your browser. Do not use a real password.</p>',
      '        <form id="loginForm" data-validate novalidate data-success="Welcome back! You are logged in.">',
      '          <div class="form-success mb-3" role="status" aria-live="polite"></div>',
      '          <div class="mb-3">',
      '            <label for="loginEmail" class="form-label">Email</label>',
      '            <input type="email" class="form-control" id="loginEmail" data-rule="email" data-required data-label="Email" placeholder="you@email.com">',
      '          </div>',
      '          <div class="mb-3">',
      '            <label for="loginPassword" class="form-label">Password</label>',
      '            <input type="password" class="form-control" id="loginPassword" data-rule="password" data-required data-label="Password" placeholder="Your password">',
      '          </div>',
      '          <button type="submit" class="btn btn-clay w-100">Log in</button>',
      '          <p class="auth-switch text-center mt-3 mb-0">No account yet? <button type="button" id="toSignup">Create one</button></p>',
      '        </form>',
      '        <form id="signupForm" data-validate novalidate class="d-none" data-success="Account created — you are now logged in.">',
      '          <div class="form-success mb-3" role="status" aria-live="polite"></div>',
      '          <div class="mb-3">',
      '            <label for="signupName" class="form-label">Full name</label>',
      '            <input type="text" class="form-control" id="signupName" data-rule="name" data-required data-label="Full name" placeholder="Jane Wanderer">',
      '          </div>',
      '          <div class="mb-3">',
      '            <label for="signupEmail" class="form-label">Email</label>',
      '            <input type="email" class="form-control" id="signupEmail" data-rule="email" data-required data-label="Email" placeholder="you@email.com">',
      '          </div>',
      '          <div class="mb-3">',
      '            <label for="signupPassword" class="form-label">Password</label>',
      '            <input type="password" class="form-control" id="signupPassword" data-rule="password" data-required data-label="Password" placeholder="At least 8 characters, 1 number">',
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
    var el = document.getElementById("authModal");
    if (window.bootstrap && el) {
      var m = window.bootstrap.Modal.getOrCreateInstance(el);
      m.show();
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
        who.innerHTML = '<span class="nav-avatar" aria-hidden="true">' + initials(user.name) + "</span>" +
          '<span class="d-none d-lg-inline">' + escapeHtml(user.name.split(" ")[0]) + "</span>";
        var profileLink = document.createElement("a");
        profileLink.href = document.getElementById("profile") ? "#profile" : "index.html#profile";
        profileLink.className = "nav-link";
        profileLink.appendChild(who);

        var out = document.createElement("button");
        out.type = "button";
        out.className = "btn btn-ghost btn-sm ms-lg-2";
        out.textContent = "Log out";
        out.addEventListener("click", function () { logOut(); });

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

  function renderProfile() {
    var section = document.getElementById("profile");
    if (!section) return;
    var user = currentUser();
    var body = document.getElementById("profileBody");
    if (!body) return;

    if (!user) {
      body.innerHTML = '<div class="profile-card text-center">' +
        "<p class=\"mb-3\">You are not logged in. Log in or create an account to see your profile.</p>" +
        '<button type="button" class="btn btn-clay" id="profileLogin">Log in or sign up</button>' +
        "</div>";
      var btn = document.getElementById("profileLogin");
      if (btn) btn.addEventListener("click", function () { openModal("login"); });
      return;
    }

    var joined = new Date(user.joined);
    var joinedText = isNaN(joined.getTime()) ? "—" :
      joined.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    body.innerHTML = [
      '<div class="profile-card">',
      '  <div class="profile-head">',
      '    <span class="profile-avatar" aria-hidden="true">' + initials(user.name) + "</span>",
      "    <div>",
      '      <h3 class="mb-0">' + escapeHtml(user.name) + "</h3>",
      '      <span class="g-role" style="color:var(--amber);font-size:0.85rem;">Member</span>',
      "    </div>",
      "  </div>",
      '  <div class="profile-field"><span class="pf-label">Name</span><span class="pf-value">' + escapeHtml(user.name) + "</span></div>",
      '  <div class="profile-field"><span class="pf-label">Email</span><span class="pf-value">' + escapeHtml(user.email) + "</span></div>",
      '  <div class="profile-field"><span class="pf-label">Member since</span><span class="pf-value">' + joinedText + "</span></div>",
      '  <button type="button" class="btn btn-ghost mt-3" id="profileLogout">Log out</button>',
      "</div>"
    ].join("");
    var out = document.getElementById("profileLogout");
    if (out) out.addEventListener("click", function () { logOut(); });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildModal();
    renderNav();
    renderProfile();

    document.addEventListener("click", function (e) {
      if (e.target && e.target.id === "toSignup") showView("signup");
      if (e.target && e.target.id === "toLogin") showView("login");
    });
  });

  document.addEventListener("auth:change", function () {
    renderNav();
    renderProfile();
  });

  document.addEventListener("form:success", function (e) {
    var id = e.detail && e.detail.form;
    var v = (e.detail && e.detail.values) || {};
    if (id === "signupForm") {
      var r = signUp((v.signupName || "").trim(), (v.signupEmail || "").trim(), v.signupPassword || "");
      if (!r.ok) {
        showFormError("signupForm", "signupEmail", r.error);
      } else {
        closeModal();
      }
    } else if (id === "loginForm") {
      var lr = logIn((v.loginEmail || "").trim(), v.loginPassword || "");
      if (!lr.ok) {
        showFormError("loginForm", "loginPassword", lr.error);
      } else {
        closeModal();
      }
    }
  });

  function showFormError(formId, fieldId, message) {
    var field = document.getElementById(fieldId);
    if (!field) return;
    var holder = field.closest(".mb-3") || field.parentNode;
    holder.classList.add("has-error");
    var box = holder.querySelector(".field-error");
    if (!box) {
      box = document.createElement("span");
      box.className = "field-error";
      box.setAttribute("role", "alert");
      holder.appendChild(box);
    }
    box.textContent = message;
    box.classList.add("show");
    field.focus();
  }
})();
