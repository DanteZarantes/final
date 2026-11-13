(function () {
  "use strict";

  var KEY = "nomadTheme";

  function current() {
    return document.documentElement.getAttribute("data-theme") || "dark";
  }

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    updateButtons(theme);
  }

  function updateButtons(theme) {
    var isLight = theme === "light";
    var buttons = document.querySelectorAll(".theme-toggle");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      btn.setAttribute("aria-pressed", String(isLight));
      var next = isLight ? "dark" : "light";
      btn.setAttribute("aria-label", "Switch to " + next + " mode");
      btn.title = "Switch to " + next + " mode";
      var icon = btn.querySelector(".ti");
      var label = btn.querySelector(".tl");
      if (icon) icon.className = "ti bi " + (isLight ? "bi-sun-fill" : "bi-moon-stars-fill");
      if (label) label.textContent = isLight ? "Light" : "Dark";
    }
  }

  function toggle() {
    apply(current() === "light" ? "dark" : "light");
  }

  window.NomadTheme = { toggle: toggle, apply: apply, current: current };

  document.addEventListener("DOMContentLoaded", function () {
    updateButtons(current());
    var buttons = document.querySelectorAll(".theme-toggle");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", toggle);
    }
  });
})();
