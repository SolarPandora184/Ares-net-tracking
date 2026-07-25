// js/components/navbar.js
// Renders the app shell (sidebar nav + top bar) into a <div id="app-shell"></div>
// placeholder that every authenticated page includes. Keeping this in one place
// means adding/removing a nav item only requires editing this file once.

import { logout, hasRole } from "../firebase/auth.js";

const NAV_ITEMS = [
  { href: "index.html", icon: "dashboard", label: "Dashboard" },
  { href: "new-net.html", icon: "add_circle", label: "New Net" },
  { href: "historical-nets.html", icon: "history", label: "Historical Nets" },
  { href: "reports.html", icon: "description", label: "Reports" },
  { href: "statistics.html", icon: "bar_chart", label: "Statistics" },
  { href: "admin.html", icon: "admin_panel_settings", label: "Admin", roles: ["admin"] },
  { href: "settings.html", icon: "settings", label: "Settings" },
  { href: "profile.html", icon: "person", label: "Profile" },
];

export function renderShell(activeHref, profile) {
  const mount = document.getElementById("app-shell");
  if (!mount) return;

  const items = NAV_ITEMS.filter((item) => !item.roles || hasRole(...item.roles));

  mount.innerHTML = `
    <nav class="sidebar" aria-label="Main navigation">
      <div class="sidebar__brand">
        <span class="material-icons" aria-hidden="true">radio</span>
        <span>WKCARES Console</span>
      </div>
      <ul class="sidebar__nav">
        ${items
          .map(
            (item) => `
          <li>
            <a href="${item.href}" class="sidebar__link ${item.href === activeHref ? "sidebar__link--active" : ""}">
              <span class="material-icons" aria-hidden="true">${item.icon}</span>
              <span>${item.label}</span>
            </a>
          </li>`
          )
          .join("")}
      </ul>
      <button class="sidebar__logout" id="logout-btn" type="button">
        <span class="material-icons" aria-hidden="true">logout</span>
        <span>Sign out</span>
      </button>
    </nav>
    <header class="topbar">
      <button class="topbar__menu-toggle" id="menu-toggle" type="button" aria-label="Toggle navigation">
        <span class="material-icons">menu</span>
      </button>
      <div class="topbar__user">
        <span class="topbar__name">${escapeHtml(profile?.name ?? "")}</span>
        <span class="topbar__role">${escapeHtml(profile?.role ?? "")}</span>
      </div>
    </header>
  `;

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await logout();
    window.location.href = "login.html";
  });
  document.getElementById("menu-toggle").addEventListener("click", () => {
    document.querySelector(".sidebar").classList.toggle("sidebar--open");
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
