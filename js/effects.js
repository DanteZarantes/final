(function ($) {
  "use strict";

  if (typeof $ === "undefined") {
    console.warn("jQuery not loaded — effects disabled.");
    return;
  }

  $(function () {

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var $stars = $("#bgStars");
    if ($stars.length && !reduceMotion) {
      var count = 26;
      for (var s = 0; s < count; s++) {
        var size = 3 + Math.random() * 7;
        var dur = 10 + Math.random() * 16;
        $('<span></span>').css({
          left: (Math.random() * 100) + "vw",
          width: size + "px",
          height: size + "px",
          animationDuration: dur + "s",
          animationDelay: (-Math.random() * dur) + "s",
          opacity: 0.25 + Math.random() * 0.5
        }).appendTo($stars);
      }
    }

    var $toastStack = $('<div class="toast-stack" aria-live="polite" aria-atomic="true"></div>').appendTo("body");

    function toast(msg, kind) {
      var $t = $('<div class="toast-note"></div>')
        .addClass(kind === "success" ? "toast-success" : "")
        .text(msg)
        .hide()
        .appendTo($toastStack)
        .slideDown(180);
      window.setTimeout(function () {
        $t.fadeOut(220, function () { $(this).remove(); });
      }, 2600);
    }

    $(document).on("click", 'a[href^="#"]', function (e) {
      var hash = $(this).attr("href");
      if (hash === "#" || hash.length < 2) return;
      var $target = $(hash);
      if (!$target.length) return;
      e.preventDefault();
      var offset = $(".site-nav").outerHeight() || 0;
      $("html, body").stop(true).animate(
        { scrollTop: $target.offset().top - offset + 2 },
        450
      );
      $target.attr("tabindex", "-1").focus();
    });

    function revealNow() {
      var trigger = $(window).scrollTop() + $(window).height() - 70;
      $(".reveal:not(.is-visible)").each(function () {
        if ($(this).offset().top < trigger) {
          $(this).addClass("is-visible");
        }
      });
    }

    var mo = new MutationObserver(function () {
      revealNow();
      $("#trailsGrid .trail-card").each(function (i) {
        var $c = $(this);
        if ($c.data("stagger")) return;
        $c.data("stagger", true).css("opacity", 0).delay(60 * i).animate({ opacity: 1 }, 320);
      });
    });
    var gridNode = document.getElementById("trailsGrid");
    if (gridNode) mo.observe(gridNode, { childList: true });

    $(".hero-anim").each(function (i) {
      $(this).css({ opacity: 0, transform: "translateY(24px)" })
        .delay(120 * i)
        .animate({ opacity: 1 }, 600, function () {
          $(this).css("transform", "translateY(0)");
        });
    });

    var $heroBg = $(".expedition-hero, .trips-hero");
    if ($heroBg.length) {
      $(window).on("scroll", function () {
        var y = $(window).scrollTop();
        $heroBg.css("background-position-y", (y * 0.3) + "px");
      });
    }

    var $toTop = $('<button class="back-to-top" aria-label="Back to top" title="Back to top">↑</button>').appendTo("body");
    $toTop.on("click", function () {
      $("html, body").stop(true).animate({ scrollTop: 0 }, 400);
    });

    var $navLinks = $('.site-nav .nav-link[href*="#"]');
    var sections = [];
    $navLinks.each(function () {
      var href = $(this).attr("href");
      var id = href.substring(href.indexOf("#"));
      if (id.length > 1 && $(id).length) sections.push({ id: id, link: this });
    });

    function onScroll() {
      var y = $(window).scrollTop();
      $(".site-nav").toggleClass("nav-scrolled", y > 20);
      if (y > 400) { $toTop.fadeIn(180); } else { $toTop.fadeOut(180); }

      if (sections.length) {
        var current = null;
        for (var i = 0; i < sections.length; i++) {
          var top = $(sections[i].id).offset().top - 90;
          if (y >= top) current = sections[i];
        }
        if (current) {
          $navLinks.removeClass("active");
          $(current.link).addClass("active");
        }
      }
      revealNow();
    }
    $(window).on("scroll resize", onScroll);
    onScroll();

    var countersDone = false;
    function runCounters() {
      if (countersDone) return;
      var $strip = $(".stat-strip");
      if (!$strip.length) return;
      if ($strip.offset().top < $(window).scrollTop() + $(window).height() - 40) {
        countersDone = true;
        $(".stat-num").each(function () {
          var $el = $(this);
          var target = parseInt($el.data("target"), 10) || 0;
          $({ v: 0 }).animate({ v: target }, {
            duration: 1200,
            step: function () { $el.text(Math.floor(this.v).toLocaleString("en-US")); },
            complete: function () { $el.text(target.toLocaleString("en-US") + ($el.data("suffix") || "")); }
          });
        });
      }
    }
    $(window).on("scroll resize", runCounters);
    runCounters();

    $(document).on("mousemove", ".trail-card", function (e) {
      var $card = $(this);
      var o = $card.offset();
      var w = $card.width(), h = $card.height();
      var dx = (e.pageX - o.left) / w - 0.5;
      var dy = (e.pageY - o.top) / h - 0.5;
      $card.css("transform", "translateY(-6px) rotateX(" + (-dy * 5) + "deg) rotateY(" + (dx * 5) + "deg)");
    }).on("mouseleave", ".trail-card", function () {
      $(this).css("transform", "");
    });

    $(document).on("click", ".btn-clay, .btn-ghost, .qty-btn", function (e) {
      var $btn = $(this);
      if ($btn.css("position") === "static") $btn.css("position", "relative");
      $btn.css("overflow", "hidden");
      var o = $btn.offset();
      var size = Math.max($btn.outerWidth(), $btn.outerHeight());
      var $ink = $('<span class="ripple"></span>').css({
        width: size, height: size,
        left: e.pageX - o.left - size / 2,
        top: e.pageY - o.top - size / 2
      }).appendTo($btn);
      window.setTimeout(function () { $ink.remove(); }, 600);
    });

    $(".accordion-button").on("click", function () {
      var $icon = $(this).find(".acc-icon");
      $(".accordion-button .acc-icon").not($icon).removeClass("open");
      $icon.toggleClass("open");
    });

    var cartTimer = null, lastCount = null;
    document.addEventListener("cart:change", function (e) {
      var count = e.detail.count;
      $("[data-cart-count]").closest("a, span").stop(true, true);
      $(".cart-total .ct-value").addClass("pulse");
      window.setTimeout(function () { $(".cart-total .ct-value").removeClass("pulse"); }, 420);
      if (lastCount === null) { lastCount = count; return; }
      if (count > lastCount) {
        clearTimeout(cartTimer);
        cartTimer = setTimeout(function () {
          toast("Added to your selection · " + count + " trip" + (count === 1 ? "" : "s") + " · $" + e.detail.total.toLocaleString("en-US"), "success");
        }, 120);
      }
      lastCount = count;
    });

    document.addEventListener("form:success", function () {
      toast("Message sent — thanks for reaching out!", "success");
    });

    $(document).on("mouseenter", ".include-card", function () {
      $(this).stop(true, true);
    });

    var $tQuote = $("#tQuote");
    if ($tQuote.length) {
      var reviews = [
        { quote: "The guide read the mountain like a book. I've travelled a lot, and this was the first trip that felt like it was actually ours.", who: "Maya R.", trip: "Himalayan Summit · 14 days" },
        { quote: "Booking was the easy part. By the time we reached the trailhead everything just worked, and we could focus on the walking.", who: "Daniel K.", trip: "Dolomites Traverse · 8 days" },
        { quote: "Ten of us, one extraordinary guide, and dunes to the horizon. I still dream about those desert nights.", who: "Priya S.", trip: "Sahara Crossing · 6 days" },
        { quote: "Small group, zero fuss, real places. Nomad Trails handled every detail so we never had to think twice.", who: "Luca F.", trip: "Patagonia Ridge · 9 days" }
      ];
      var $tWho = $("#tWho");
      var $tTrip = $("#tTrip");
      var $tDots = $("#tDots");
      var idx = 0;
      var timer = null;

      reviews.forEach(function (r, i) {
        var $dot = $('<button type="button" class="t-dot" role="tab"></button>')
          .attr("aria-label", "Testimonial " + (i + 1))
          .on("click", function () { go(i, true); });
        $tDots.append($dot);
      });

      function go(next, manual) {
        idx = (next + reviews.length) % reviews.length;
        var r = reviews[idx];
        $tQuote.stop(true, true).fadeOut(180, function () {
          $tQuote.text(r.quote).fadeIn(220);
        });
        $tWho.text(r.who);
        $tTrip.text(r.trip);
        $tDots.children().removeClass("active").attr("aria-selected", "false");
        $tDots.children().eq(idx).addClass("active").attr("aria-selected", "true");
        if (manual) restart();
      }

      function restart() {
        clearInterval(timer);
        timer = setInterval(function () { go(idx + 1); }, 6000);
      }

      go(0);
      restart();
    }

  });
})(window.jQuery);
