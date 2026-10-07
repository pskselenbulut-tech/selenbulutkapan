// Randevu defteri, WhatsApp yönlendirmeleri ve sabit hızlı erişim düğmeleri.
// Hiçbir bilgi sunucuya gönderilmez; her şey hazır bir WhatsApp mesajı açar.
(function () {
  var WHATSAPP_NUMBER = "905379261183";
  var INFO_MESSAGE = "Merhaba, bilgi almak istiyorum.";
  var MAX_MONTHS_AHEAD = 6;

  var MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  var DAY_HEADS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  function whatsappUrl(text) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
  }

  function openWhatsapp(text) {
    var url = whatsappUrl(text);
    if (!window.open(url, "_blank")) window.location.href = url;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  /* Randevu defteri */

  function bookingMessage(date) {
    return "Merhaba, " + date.getDate() + " " + MONTHS[date.getMonth()] + " " + date.getFullYear() +
      " " + DAYS[date.getDay()] + " tarihine ait müsait randevunuz var mı?";
  }

  function createCalendar(onPick) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var first = new Date(today.getFullYear(), today.getMonth(), 1);
    var last = new Date(today.getFullYear(), today.getMonth() + MAX_MONTHS_AHEAD, 1);
    var view = new Date(first);

    var root = el("div", "booking-calendar");
    var head = el("div", "bc-head");
    var prev = el("button", "bc-nav", "‹");
    var next = el("button", "bc-nav", "›");
    var title = el("div", "bc-title");
    var grid = el("div", "bc-grid");
    prev.type = next.type = "button";
    prev.setAttribute("aria-label", "Önceki ay");
    next.setAttribute("aria-label", "Sonraki ay");
    title.setAttribute("aria-live", "polite");
    head.appendChild(prev);
    head.appendChild(title);
    head.appendChild(next);
    root.appendChild(head);
    root.appendChild(grid);
    root.appendChild(el("p", "bc-note", "Bir güne dokunduğunuzda WhatsApp açılır."));

    function render() {
      var year = view.getFullYear();
      var month = view.getMonth();
      title.textContent = MONTHS[month] + " " + year;
      prev.disabled = view <= first;
      next.disabled = view >= last;
      grid.innerHTML = "";
      DAY_HEADS.forEach(function (name) { grid.appendChild(el("div", "bc-dow", name)); });

      var offset = (new Date(year, month, 1).getDay() + 6) % 7;
      for (var i = 0; i < offset; i++) grid.appendChild(el("div"));

      var count = new Date(year, month + 1, 0).getDate();
      for (var day = 1; day <= count; day++) {
        var date = new Date(year, month, day);
        var button = el("button", "bc-day", String(day));
        button.type = "button";
        button.setAttribute("aria-label", day + " " + MONTHS[month] + " " + year + " " + DAYS[date.getDay()]);
        if (date < today) button.disabled = true;
        if (date.getTime() === today.getTime()) button.classList.add("is-today");
        button.addEventListener("click", onPick.bind(null, date));
        grid.appendChild(button);
      }
    }

    prev.addEventListener("click", function () { view.setMonth(view.getMonth() - 1); render(); });
    next.addEventListener("click", function () { view.setMonth(view.getMonth() + 1); render(); });
    render();
    return root;
  }

  var modal = null;
  var lastFocus = null;

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    document.documentElement.classList.remove("booking-open");
    if (lastFocus) lastFocus.focus();
  }

  function openModal(trigger) {
    if (!modal) {
      modal = el("div", "booking-modal");
      var dialog = el("div", "booking-dialog");
      var close = el("button", "booking-close", "×");
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-label", "Randevu defteri");
      close.type = "button";
      close.setAttribute("aria-label", "Kapat");
      close.addEventListener("click", closeModal);
      dialog.appendChild(close);
      dialog.appendChild(el("h2", "booking-title", "Randevu Defteri"));
      dialog.appendChild(el("p", "booking-sub", "Size uygun günü seçin; müsaitliği WhatsApp'ta birlikte netleştirelim."));
      dialog.appendChild(createCalendar(function (date) {
        openWhatsapp(bookingMessage(date));
        closeModal();
      }));
      modal.appendChild(dialog);
      modal.addEventListener("click", function (event) {
        if (event.target === modal) closeModal();
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeModal();
      });
      document.body.appendChild(modal);
    }
    lastFocus = trigger || null;
    modal.classList.add("is-open");
    document.documentElement.classList.add("booking-open");
    modal.querySelector(".booking-close").focus();
  }

  // "Randevu Oluştur" bağlantılarının hepsi randevu defterini açar
  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest('a[href$="randevu.html"]');
    if (!link) return;
    event.preventDefault();
    openModal(link);
  });

  // Randevu sayfasındaki sabit takvim
  Array.prototype.forEach.call(document.querySelectorAll("[data-booking-calendar]"), function (holder) {
    holder.appendChild(createCalendar(function (date) { openWhatsapp(bookingMessage(date)); }));
  });

  /* İletişim formu */

  var contactForm = document.getElementById("wf-form-Contact-Form");
  if (contactForm) {
    var fields = [
      ["Ad Soyad", "#First-Name"],
      ["Telefon", "#Phone-number"],
      ["E-posta", "#Email"],
      ["İletişim nedeni", "#Reason-For-Contact"],
      ["Mesaj", "#Massage"]
    ];
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var lines = ["Merhaba, sizinle iletişime geçmek istiyorum.", ""];
      fields.forEach(function (field) {
        var input = contactForm.querySelector(field[1]);
        var value = input && input.value ? input.value.trim() : "";
        if (value) lines.push(field[0] + ": " + value);
      });
      openWhatsapp(lines.join("\n"));
    });
  }

  /* Sabit hızlı erişim düğmeleri: mobilde alt çubuk, masaüstünde sağ altta */

  var anyBooking = document.querySelector('a[href$="randevu.html"]');
  var bookingHref = anyBooking ? anyBooking.getAttribute("href") : "randevu.html";

  var bar = el("div", "quick-cta");
  // İkonlar site.css içinde arka plan SVG'si olarak gelir
  var primary = el("a", "quick-cta-btn quick-cta-booking", "Randevu Oluştur");
  primary.href = bookingHref;
  var chat = el("a", "quick-cta-btn quick-cta-whatsapp", "Bize Ulaşın");
  chat.href = whatsappUrl(INFO_MESSAGE);
  chat.target = "_blank";
  chat.rel = "noopener";
  chat.setAttribute("aria-label", "WhatsApp'tan bize ulaşın");
  bar.appendChild(primary);
  bar.appendChild(chat);
  document.body.appendChild(bar);

  /* Menü, sık sorulan sorular, kaydırıcı ve kaydırınca belirme */

  function each(selector, fn, root) {
    Array.prototype.forEach.call((root || document).querySelectorAll(selector), fn);
  }

  function asButton(node, label) {
    node.setAttribute("role", "button");
    node.setAttribute("tabindex", "0");
    if (label) node.setAttribute("aria-label", label);
    node.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        node.click();
      }
    });
  }

  // Mobil menü
  each(".w-nav", function (nav) {
    var button = nav.querySelector(".w-nav-button");
    var menu = nav.querySelector(".w-nav-menu");
    if (!button || !menu) return;
    asButton(button, "Menü");

    function setOpen(open) {
      button.classList.toggle("w--open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) menu.setAttribute("data-nav-menu-open", "");
      else menu.removeAttribute("data-nav-menu-open");
    }

    setOpen(false);
    button.addEventListener("click", function () { setOpen(!button.classList.contains("w--open")); });
    menu.addEventListener("click", function (event) {
      if (event.target.closest && event.target.closest("a")) setOpen(false);
    });
  });

  // Sık sorulan sorular: aynı anda tek cevap açık kalır
  each(".single-faq", function (item) {
    var toggle = item.querySelector(".w-dropdown-toggle");
    var answer = item.querySelector(".w-dropdown-list");
    if (!toggle || !answer) return;
    asButton(toggle);
    toggle.setAttribute("aria-expanded", "false");

    toggle.addEventListener("click", function () {
      var open = !answer.classList.contains("w--open");
      each(".w--open", function (node) { node.classList.remove("w--open"); }, item.parentNode);
      each(".w-dropdown-toggle", function (node) { node.setAttribute("aria-expanded", "false"); }, item.parentNode);
      if (open) {
        toggle.classList.add("w--open");
        answer.classList.add("w--open");
        toggle.setAttribute("aria-expanded", "true");
      }
    });
  });

  // Kaydırıcı
  each(".w-slider", function (slider) {
    var slides = slider.querySelectorAll(".w-slide");
    var prev = slider.querySelector(".w-slider-arrow-left");
    var next = slider.querySelector(".w-slider-arrow-right");
    var index = 0;
    if (slides.length < 2) return;

    function show(target) {
      index = (target + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (slide, i) {
        slide.style.transform = "translateX(" + (-100 * index) + "%)";
        slide.setAttribute("aria-hidden", i === index ? "false" : "true");
      });
    }

    if (prev) { asButton(prev, "Önceki"); prev.addEventListener("click", function () { show(index - 1); }); }
    if (next) { asButton(next, "Sonraki"); next.addEventListener("click", function () { show(index + 1); }); }
    show(0);
  });

  // Kaydırınca belirme
  var revealed = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    Array.prototype.forEach.call(revealed, function (node) { observer.observe(node); });
  } else {
    Array.prototype.forEach.call(revealed, function (node) { node.classList.add("is-in"); });
  }
})();
