(function () {
  "use strict";

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;

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
    if (type === "name" && val.length < 2) {
      showError(field, "Please enter at least 2 characters.");
      return false;
    }
    if (type === "message" && val.length < 10) {
      showError(field, "Tell us a little more — at least 10 characters.");
      return false;
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

    clearError(field);
    return true;
  }

  function wireForm(form) {
    if (!form) return;
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

      if (successEl) {
        var custom = form.getAttribute("data-success");
        successEl.innerHTML = '<span aria-hidden="true">✓</span> ' +
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
        detail: { form: form.id || "" }
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

  document.addEventListener("DOMContentLoaded", function () {
    populateTripSelect();
    var forms = document.querySelectorAll("form[data-validate]");
    for (var i = 0; i < forms.length; i++) wireForm(forms[i]);
  });
})();
