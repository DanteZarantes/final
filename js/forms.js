(function () {
  "use strict";

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;

  var NAME_WORD_RE = /^\p{L}+(?:['\u2019.-]\p{L}+)*\.?$/u;
  var FAKE_NAMES = ["test", "tester", "asdf", "qwerty", "admin", "user", "name", "fullname", "firstname", "lastname", "abc", "xyz", "none", "null", "unknown", "anonymous"];

  function checkRealName(val) {
    var clean = val.replace(/\s+/g, " ").trim();
    if (/[0-9_@#$%^&*()+=<>\/\\|{}\[\]~`!?,;:"]/.test(clean)) {
      return "Names can only contain letters, spaces, hyphens and apostrophes.";
    }
    var words = clean.split(" ");
    if (words.length < 2) {
      return "Enter your first and last name.";
    }
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!NAME_WORD_RE.test(w)) {
        return "Enter a real name using letters only, like Jane Wanderer.";
      }
      var letters = w.replace(/[^\p{L}]/gu, "");
      var isInitial = letters.length === 1 && w.slice(-1) === ".";
      if (letters.length < 2 && !isInitial) {
        return "Each part of your name needs at least 2 letters.";
      }
      if (/(\p{L})\1\1/iu.test(letters)) {
        return "That doesn't look like a real name. Please check the spelling.";
      }
      if (FAKE_NAMES.indexOf(letters.toLowerCase()) !== -1) {
        return "Please enter your real name.";
      }
    }
    var realParts = 0;
    for (var j = 0; j < words.length; j++) {
      if (words[j].replace(/[^\p{L}]/gu, "").length >= 2) realParts++;
    }
    if (realParts < 2) {
      return "Enter your first and last name in full.";
    }
    return "";
  }

  function errorBox(field) {
    var holder = field.closest(".mb-3, .form-group, .field");
    if (!holder) holder = field.parentNode;
    var box = holder.querySelector(".field-error");
    if (!box) {
      box = document.createElement("span");
      box.className = "field-error";
      box.setAttribute("role", "alert");
      holder.appendChild(box);
    }
    if (!field.id) field.id = "f_" + Math.random().toString(36).slice(2);
    box.id = box.id || field.id + "_err";
    field.setAttribute("aria-describedby", box.id);
    return { holder: holder, box: box };
  }

  function showError(field, msg) {
    var parts = errorBox(field);
    parts.holder.classList.add("has-error");
    parts.holder.classList.remove("is-valid-field");
    parts.box.textContent = msg;
    parts.box.classList.add("show");
    field.setAttribute("aria-invalid", "true");
  }

  function clearError(field) {
    var parts = errorBox(field);
    parts.holder.classList.remove("has-error");
    parts.box.textContent = "";
    parts.box.classList.remove("show");
    field.removeAttribute("aria-invalid");
    if (field.value && field.value.trim() !== "") {
      parts.holder.classList.add("is-valid-field");
    }
  }

  function validateField(field) {
    var val = (field.value || "").trim();
    var label = field.getAttribute("data-label") || "This field";

    if (field.hasAttribute("data-required") && val === "") {
      showError(field, label + " is required.");
      return false;
    }
    if (val === "" && !field.hasAttribute("data-required")) {
      clearError(field);
      return true;
    }

    var type = field.getAttribute("data-rule");

    if (type === "email" && !EMAIL_RE.test(val)) {
      showError(field, "Enter a valid email, like jane@email.com.");
      return false;
    }
    if (type === "phone" && !PHONE_RE.test(val)) {
      showError(field, "Enter a valid phone number (7–20 digits).");
      return false;
    }
    if (type === "name") {
      var nameError = checkRealName(val);
      if (nameError) {
        showError(field, nameError);
        return false;
      }
    }
    if (type === "message" && val.length < 10) {
      showError(field, "Tell us a little more — at least 10 characters.");
      return false;
    }
    if (type === "password") {
      if (val.length < 8) {
        showError(field, "Use at least 8 characters.");
        return false;
      }
      if (!/[0-9]/.test(val)) {
        showError(field, "Include at least one number.");
        return false;
      }
    }
    if (type === "date") {
      var picked = new Date(val + "T00:00:00");
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(picked.getTime())) {
        showError(field, "Choose a valid date.");
        return false;
      }
      if (picked < today) {
        showError(field, "Pick a date in the future.");
        return false;
      }
    }
    if (type === "number") {
      var n = Number(val);
      var min = Number(field.getAttribute("min") || 1);
      var max = Number(field.getAttribute("max") || 999);
      if (isNaN(n) || n < min || n > max) {
        showError(field, "Enter a number between " + min + " and " + max + ".");
        return false;
      }
    }
    if (field.type === "checkbox" && field.hasAttribute("data-required") && !field.checked) {
      showError(field, "Please confirm to continue.");
      return false;
    }
    if (field.hasAttribute("data-ext-error")) {
      showError(field, field.getAttribute("data-ext-error"));
      return false;
    }

    clearError(field);
    return true;
  }

  var handlers = {};

  function wireForm(form) {
    if (!form || form.getAttribute("data-wired") === "1") return;
    form.setAttribute("data-wired", "1");
    var fields = form.querySelectorAll("[data-rule], [data-required]");
    var successEl = form.querySelector(".form-success");

    for (var i = 0; i < fields.length; i++) {
      (function (f) {
        var ev = (f.tagName === "SELECT" || f.type === "checkbox") ? "change" : "input";
        f.addEventListener(ev, function () {
          if (f.closest(".has-error")) validateField(f);
        });
        f.addEventListener("blur", function () { validateField(f); });
      })(fields[i]);
    }

    form.addEventListener("input", function () {
      var flagged = form.querySelectorAll("[data-ext-error]");
      for (var x = 0; x < flagged.length; x++) {
        flagged[x].removeAttribute("data-ext-error");
        validateField(flagged[x]);
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      var firstBad = null;
      for (var j = 0; j < fields.length; j++) {
        var valid = validateField(fields[j]);
        if (!valid && !firstBad) firstBad = fields[j];
        ok = ok && valid;
      }

      if (!ok) {
        if (successEl) successEl.classList.remove("show");
        if (firstBad) firstBad.focus();
        return;
      }

      var values = {};
      for (var v = 0; v < fields.length; v++) {
        if (fields[v].id) {
          values[fields[v].id] = fields[v].type === "checkbox" ? fields[v].checked : fields[v].value;
        }
      }

      var handler = handlers[form.id];
      if (handler) {
        var outcome = handler(values);
        if (outcome && outcome.ok === false) {
          var badField = document.getElementById(outcome.field);
          if (successEl) successEl.classList.remove("show");
          if (badField) {
            badField.setAttribute("data-ext-error", outcome.error);
            showError(badField, outcome.error);
            badField.focus();
          }
          return;
        }
      }

      if (successEl) {
        var custom = form.getAttribute("data-success");
        successEl.innerHTML = '<i class="bi bi-check-circle-fill" aria-hidden="true"></i> ' +
          (custom || "Thanks! We'll be in touch shortly.");
        successEl.classList.add("show");
      }
      form.reset();
      var holders = form.querySelectorAll(".is-valid-field, .has-error");
      for (var k = 0; k < holders.length; k++) {
        holders[k].classList.remove("is-valid-field", "has-error");
      }
      var boxes = form.querySelectorAll(".field-error");
      for (var m = 0; m < boxes.length; m++) {
        boxes[m].textContent = "";
        boxes[m].classList.remove("show");
      }

      document.dispatchEvent(new CustomEvent("form:success", {
        detail: { form: form.id || "", values: values }
      }));

      if (successEl) {
        window.setTimeout(function () { successEl.classList.remove("show"); }, 6000);
      }
    });
  }

  function populateTripSelect() {
    var sel = document.getElementById("resTrip");
    if (!sel || !window.NomadTrails || !window.NomadTrails.trips) return;
    var trips = window.NomadTrails.trips;
    trips.forEach(function (t) {
      var opt = document.createElement("option");
      opt.value = t.name;
      opt.textContent = t.name + " — $" + t.price.toLocaleString("en-US");
      sel.appendChild(opt);
    });
  }

  window.NomadForms = {
    wire: wireForm,
    handle: function (formId, fn) { handlers[formId] = fn; }
  };

  document.addEventListener("DOMContentLoaded", function () {
    populateTripSelect();
    var forms = document.querySelectorAll("form[data-validate]");
    for (var i = 0; i < forms.length; i++) wireForm(forms[i]);
  });
})();
