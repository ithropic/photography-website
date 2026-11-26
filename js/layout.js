// Renders the shared header and footer so the three pages stay in sync.
(function () {
  "use strict";

  var site = window.SITE;
  var currentPage = document.body.dataset.page;

  var NAV = [
    { id: "photos", label: "photos", href: "index.html" },
    { id: "about", label: "about", href: "about.html" },
  ];

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    if (text) node.textContent = text;
    return node;
  }

  function renderHeader(container) {
    var logo = el("a", { class: "site-logo", href: "index.html" }, site.name);

    var nav = el("nav", { class: "site-nav", "aria-label": "Main" });
    NAV.forEach(function (item) {
      var link = el("a", { href: item.href }, item.label);
      if (item.id === currentPage) link.setAttribute("aria-current", "page");
      nav.appendChild(link);
    });
    nav.appendChild(
      el("a", { href: site.instagram, target: "_blank", rel: "noopener noreferrer" }, "instagram")
    );

    container.appendChild(logo);
    container.appendChild(nav);
  }

  function renderFooter(container) {
    var year = new Date().getFullYear();
    container.appendChild(el("p", {}, "© " + year + " " + site.name));
  }

  var header = document.getElementById("site-header");
  var footer = document.getElementById("site-footer");
  if (header) renderHeader(header);
  if (footer) renderFooter(footer);

  // Contact page fills in its own links from the same config.
  var emailLink = document.getElementById("contact-email");
  if (emailLink) {
    emailLink.href = "mailto:" + site.email;
    emailLink.textContent = site.email;
  }
  var instagramLink = document.getElementById("contact-instagram");
  if (instagramLink) instagramLink.href = site.instagram;
})();
