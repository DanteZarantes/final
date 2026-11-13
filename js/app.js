(function () {
  "use strict";

  var TRIPS = [
    { id: "patagonia", name: "Patagonia Ridge", region: "South America", country: "Chile", days: 9,  difficulty: "Moderate", price: 2480, blurb: "Glacier valleys and granite towers on the edge of the world.", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&h=320&fit=crop", depart: "2026-10-14" },
    { id: "sahara",    name: "Sahara Crossing",  region: "Africa",        country: "Morocco", days: 6,  difficulty: "Easy",     price: 1690, blurb: "Camel caravans, dune camps and star-flooded desert nights.", img: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=500&h=320&fit=crop", depart: "2026-11-02" },
    { id: "himalaya",  name: "Himalayan Summit", region: "Asia",          country: "Nepal",   days: 14, difficulty: "Hard",     price: 3950, blurb: "High passes, prayer flags and thin air above the clouds.", img: "https://images.unsplash.com/photo-1533387520709-752d83de3630?w=500&h=320&fit=crop", depart: "2027-03-28" },
    { id: "iceland",   name: "Iceland Highlands", region: "Europe",       country: "Iceland", days: 7,  difficulty: "Moderate", price: 2240, blurb: "Black-sand plateaus, steaming vents and midnight sun.", img: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=500&h=320&fit=crop", depart: "2027-06-19" },
    { id: "dolomites", name: "Dolomites Traverse", region: "Europe",      country: "Italy",   days: 8,  difficulty: "Moderate", price: 2610, blurb: "Limestone spires, alpine huts and long ridge walks.", img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&h=320&fit=crop", depart: "2027-09-05" },
    { id: "kilimanjaro", name: "Kilimanjaro Climb", region: "Africa",     country: "Tanzania", days: 10, difficulty: "Hard",    price: 3380, blurb: "Rainforest to glacier in a single, patient ascent.", img: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=500&h=320&fit=crop", depart: "2027-01-22" },
    { id: "annapurna", name: "Annapurna Circuit", region: "Asia",         country: "Nepal",   days: 12, difficulty: "Hard",     price: 2990, blurb: "Terraced hills, high passes and tea-house evenings.", img: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=500&h=320&fit=crop", depart: "2027-04-11" },
    { id: "lofoten",   name: "Lofoten Peaks",     region: "Europe",       country: "Norway",  days: 6,  difficulty: "Moderate", price: 2150, blurb: "Sea-cliff summits, fishing villages and Arctic light.", img: "https://images.unsplash.com/photo-1601439678777-b2b3c56fa627?w=500&h=320&fit=crop", depart: "2027-07-02" },
    { id: "atlas",     name: "High Atlas Trek",   region: "Africa",       country: "Morocco", days: 7,  difficulty: "Moderate", price: 1890, blurb: "Berber villages, mule trails and the roof of North Africa.", img: "https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=500&h=320&fit=crop", depart: "2027-05-16" }
  ];

  window.NomadTrails = window.NomadTrails || {};
  window.NomadTrails.trips = TRIPS;

  function money(n) {
    return "$" + n.toLocaleString("en-US");
  }
  function diffClass(d) {
    if (d === "Easy") return "diff-easy";
    if (d === "Hard") return "diff-hard";
    return "diff-mod";
  }
  function formatDate(iso) {
    var parts = iso.split("-");
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return parts[2] + " " + months[parseInt(parts[1], 10) - 1] + " " + parts[0];
  }
  function tripById(id) {
    for (var i = 0; i < TRIPS.length; i++) {
      if (TRIPS[i].id === id) return TRIPS[i];
    }
    return null;
  }

  var CART_KEY = "nomadCart";
  var cart = loadCart();

  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      var capped = {};
      for (var key in parsed) {
        if (parsed.hasOwnProperty(key) && parsed[key] > 0) capped[key] = 1;
      }
      return capped;
    } catch (e) {
      return {};
    }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  }

  function addToCart(id) {
    var trip = tripById(id);
    if (!trip) return;
    if (cart[id]) {
      document.dispatchEvent(new CustomEvent("cart:duplicate", {
        detail: { id: id, name: trip.name }
      }));
      return;
    }
    cart[id] = 1;
    saveCart();
    renderCart();
    emitCartChange();
  }

  function refreshAddButtons() {
    var buttons = document.querySelectorAll("[data-add]");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var selected = !!cart[btn.getAttribute("data-add")];
      btn.classList.toggle("is-selected", selected);
      var label = btn.querySelector(".add-label");
      if (label) {
        label.textContent = selected ? "Selected" : btn.getAttribute("data-label") || "Add";
      }
      var icon = btn.querySelector("i");
      if (icon) icon.className = "bi " + (selected ? "bi-bag-check-fill" : "bi-bag-plus");
    }
  }
  function setQty(id, qty) {
    if (qty <= 0) { delete cart[id]; }
    else { cart[id] = qty; }
    saveCart();
    renderCart();
    emitCartChange();
  }
  function cartCount() {
    var c = 0;
    for (var id in cart) { if (cart.hasOwnProperty(id)) c += cart[id]; }
    return c;
  }
  function cartTotal() {
    var total = 0;
    for (var id in cart) {
      if (!cart.hasOwnProperty(id)) continue;
      var t = tripById(id);
      if (t) total += t.price * cart[id];
    }
    return total;
  }
  function emitCartChange(silent) {
    document.dispatchEvent(new CustomEvent("cart:change", {
      detail: { count: cartCount(), total: cartTotal(), silent: !!silent }
    }));
  }

  function cartIds() {
    var ids = [];
    for (var id in cart) {
      if (cart.hasOwnProperty(id) && tripById(id)) ids.push(id);
    }
    return ids;
  }

  function replaceCart(ids) {
    var next = {};
    for (var i = 0; i < ids.length; i++) {
      if (tripById(ids[i])) next[ids[i]] = 1;
    }
    cart = next;
    saveCart();
    renderCart();
    emitCartChange(true);
  }

  window.addEventListener("storage", function (e) {
    if (e.key !== CART_KEY) return;
    cart = loadCart();
    renderCart();
    emitCartChange(true);
  });

  window.NomadTrails.getCart = function () {
    var out = [];
    for (var id in cart) {
      if (!cart.hasOwnProperty(id)) continue;
      var t = tripById(id);
      if (t) out.push({ name: t.name, qty: cart[id], price: t.price });
    }
    return out;
  };
  window.NomadTrails.cartTotal = cartTotal;
  window.NomadTrails.getCartIds = cartIds;
  window.NomadTrails.setCartIds = replaceCart;
  window.NomadTrails.clearCart = function () {
    cart = {};
    saveCart();
    renderCart();
    emitCartChange();
  };

  function renderCart() {
    var list = document.getElementById("cartList");
    var totalEl = document.getElementById("cartTotal");
    var countEls = document.querySelectorAll("[data-cart-count]");
    if (totalEl) totalEl.textContent = money(cartTotal());
    for (var i = 0; i < countEls.length; i++) {
      countEls[i].textContent = String(cartCount());
    }
    refreshAddButtons();
    if (!list) return;

    list.innerHTML = "";
    var ids = Object.keys(cart);
    if (ids.length === 0) {
      var empty = document.createElement("li");
      empty.className = "cart-empty";
      empty.textContent = "No expeditions selected yet. Add one to see your total.";
      list.appendChild(empty);
      return;
    }

    ids.forEach(function (id) {
      var t = tripById(id);
      if (!t) return;
      var qty = cart[id];

      var li = document.createElement("li");
      li.className = "cart-item";

      var info = document.createElement("div");
      var name = document.createElement("div");
      name.className = "ci-name";
      name.textContent = t.name;
      var meta = document.createElement("div");
      meta.className = "ci-meta";
      meta.textContent = t.days + " days · " + money(t.price * qty);
      info.appendChild(name);
      info.appendChild(meta);

      var controls = document.createElement("div");
      controls.className = "ci-controls";

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ci-remove";
      remove.innerHTML = '<i class="bi bi-trash3" aria-hidden="true"></i>';
      remove.setAttribute("aria-label", "Remove " + t.name + " from selection");
      remove.addEventListener("click", function () { setQty(id, 0); });

      controls.appendChild(remove);

      li.appendChild(info);
      li.appendChild(controls);
      list.appendChild(li);
    });
  }

  function initGrid() {
    var grid = document.getElementById("trailsGrid");
    if (!grid) return;

    var searchEl = document.getElementById("tripSearch");
    var regionEl = document.getElementById("regionFilter");
    var sortEl = document.getElementById("sortSelect");
    var countEl = document.getElementById("resultCount");
    var diffButtons = document.querySelectorAll("[data-diff]");
    var activeDiff = "All";

    function currentList() {
      var q = (searchEl && searchEl.value ? searchEl.value : "").trim().toLowerCase();
      var region = regionEl ? regionEl.value : "All";

      var list = TRIPS.filter(function (t) {
        var matchText = !q ||
          t.name.toLowerCase().indexOf(q) !== -1 ||
          t.country.toLowerCase().indexOf(q) !== -1 ||
          t.region.toLowerCase().indexOf(q) !== -1;
        var matchRegion = region === "All" || t.region === region;
        var matchDiff = activeDiff === "All" || t.difficulty === activeDiff;
        return matchText && matchRegion && matchDiff;
      });

      var sort = sortEl ? sortEl.value : "featured";
      if (sort === "price-asc") list.sort(function (a, b) { return a.price - b.price; });
      else if (sort === "price-desc") list.sort(function (a, b) { return b.price - a.price; });
      else if (sort === "days-asc") list.sort(function (a, b) { return a.days - b.days; });
      else if (sort === "name") list.sort(function (a, b) { return a.name.localeCompare(b.name); });

      return list;
    }

    function render() {
      var list = currentList();
      grid.innerHTML = "";

      if (countEl) {
        countEl.textContent = list.length + " of " + TRIPS.length +
          (list.length === 1 ? " expedition" : " expeditions");
      }

      if (list.length === 0) {
        var empty = document.createElement("div");
        empty.className = "empty-state";
        empty.setAttribute("role", "status");
        empty.innerHTML = '<span class="emoji" aria-hidden="true"><i class="bi bi-compass"></i></span>' +
          "<p class=\"mb-2\">No expeditions match your search.</p>" +
          '<button type="button" class="btn btn-ghost" id="clearFilters">Clear filters</button>';
        grid.appendChild(empty);
        var clearBtn = document.getElementById("clearFilters");
        if (clearBtn) clearBtn.addEventListener("click", resetFilters);
        return;
      }

      list.forEach(function (t) {
        grid.appendChild(buildCard(t));
      });
      refreshAddButtons();
    }

    function buildCard(t) {
      var card = document.createElement("article");
      card.className = "trail-card reveal";

      var imgWrap = document.createElement("div");
      imgWrap.className = "img-wrap";
      var img = document.createElement("img");
      img.src = t.img;
      img.alt = t.name + " — " + t.country;
      img.loading = "lazy";
      var tag = document.createElement("span");
      tag.className = "region-tag";
      tag.textContent = t.region;
      imgWrap.appendChild(img);
      imgWrap.appendChild(tag);

      var body = document.createElement("div");
      body.className = "trail-body";

      var h3 = document.createElement("h3");
      h3.textContent = t.name;

      var p = document.createElement("p");
      p.textContent = t.blurb;

      var badge = document.createElement("span");
      badge.className = "badge-diff " + diffClass(t.difficulty);
      badge.textContent = t.difficulty;

      var dur = document.createElement("span");
      dur.className = "duration";
      dur.textContent = t.days + " DAYS";

      var meta = document.createElement("div");
      meta.className = "trail-meta mb-2";
      var left = document.createElement("div");
      left.appendChild(dur);
      left.appendChild(document.createTextNode(" "));
      left.appendChild(badge);
      var price = document.createElement("span");
      price.className = "price-tag";
      price.textContent = money(t.price);
      meta.appendChild(left);
      meta.appendChild(price);

      var addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "btn btn-clay w-100 add-btn";
      addBtn.innerHTML = '<i class="bi bi-bag-plus" aria-hidden="true"></i> <span class="add-label">Add to selection</span>';
      addBtn.setAttribute("data-label", "Add to selection");
      addBtn.setAttribute("data-add", t.id);
      addBtn.addEventListener("click", function () {
        addToCart(t.id);
      });

      body.appendChild(h3);
      body.appendChild(p);
      body.appendChild(meta);
      body.appendChild(addBtn);

      card.appendChild(imgWrap);
      card.appendChild(body);
      return card;
    }

    function resetFilters() {
      if (searchEl) searchEl.value = "";
      if (regionEl) regionEl.value = "All";
      if (sortEl) sortEl.value = "featured";
      activeDiff = "All";
      for (var i = 0; i < diffButtons.length; i++) {
        diffButtons[i].classList.toggle("is-active", diffButtons[i].getAttribute("data-diff") === "All");
      }
      render();
    }

    if (searchEl) {
      searchEl.addEventListener("input", render);
      searchEl.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { searchEl.value = ""; render(); }
      });
    }
    if (regionEl) regionEl.addEventListener("change", render);
    if (sortEl) sortEl.addEventListener("change", render);
    for (var i = 0; i < diffButtons.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          activeDiff = btn.getAttribute("data-diff");
          for (var j = 0; j < diffButtons.length; j++) {
            diffButtons[j].classList.toggle("is-active", diffButtons[j] === btn);
          }
          render();
        });
      })(diffButtons[i]);
    }

    render();
  }

  function initTable() {
    var tbody = document.getElementById("tripsBody");
    if (!tbody) return;

    var sortKey = "name";
    var sortDir = 1;

    function sortTrips() {
      var list = TRIPS.slice();
      list.sort(function (a, b) {
        var av = a[sortKey], bv = b[sortKey];
        if (typeof av === "string") return av.localeCompare(bv) * sortDir;
        return (av - bv) * sortDir;
      });
      return list;
    }

    function render() {
      var list = sortTrips();
      tbody.innerHTML = "";
      list.forEach(function (t) {
        var tr = document.createElement("tr");

        var th = document.createElement("th");
        th.setAttribute("scope", "row");
        th.textContent = t.name;

        var region = document.createElement("td");
        region.textContent = t.region + " · " + t.country;

        var dur = document.createElement("td");
        dur.textContent = t.days + " days";

        var diff = document.createElement("td");
        var badge = document.createElement("span");
        badge.className = "badge-diff " + diffClass(t.difficulty);
        badge.textContent = t.difficulty;
        diff.appendChild(badge);

        var dep = document.createElement("td");
        dep.textContent = formatDate(t.depart);

        var price = document.createElement("td");
        price.className = "text-end fw-bold";
        price.textContent = money(t.price);

        var action = document.createElement("td");
        action.className = "text-end";
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-ghost btn-sm add-btn";
        btn.innerHTML = '<i class="bi bi-bag-plus" aria-hidden="true"></i> <span class="add-label">Add</span>';
        btn.setAttribute("data-label", "Add");
        btn.setAttribute("data-add", t.id);
        btn.setAttribute("aria-label", "Add " + t.name + " to selection");
        btn.addEventListener("click", function () { addToCart(t.id); });
        action.appendChild(btn);

        tr.appendChild(th);
        tr.appendChild(region);
        tr.appendChild(dur);
        tr.appendChild(diff);
        tr.appendChild(dep);
        tr.appendChild(price);
        tr.appendChild(action);
        tbody.appendChild(tr);
      });
      refreshAddButtons();
    }

    var heads = document.querySelectorAll(".trips-table thead th.sortable");
    for (var i = 0; i < heads.length; i++) {
      (function (th) {
        th.setAttribute("tabindex", "0");
        th.setAttribute("role", "button");
        function toggle() {
          var key = th.getAttribute("data-key");
          if (sortKey === key) { sortDir *= -1; }
          else { sortKey = key; sortDir = 1; }
          for (var k = 0; k < heads.length; k++) {
            heads[k].classList.remove("sort-asc", "sort-desc");
          }
          th.classList.add(sortDir === 1 ? "sort-asc" : "sort-desc");
          render();
        }
        th.addEventListener("click", toggle);
        th.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
        });
      })(heads[i]);
    }

    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderCart();
    initGrid();
    initTable();
    emitCartChange();
  });
})();
