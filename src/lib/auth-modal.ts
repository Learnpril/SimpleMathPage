/**
 * Auth Modal + Profile Dropdown
 * - Logged out: "Log In" button opens auth modal
 * - Logged in: "Hi, username!" button opens profile dropdown with stats + logout
 */
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  resetPassword,
} from "./supabase/auth";
import { createSupabaseClient } from "./supabase/client";
import { syncLocalProgressToSupabase } from "./supabase/sync";

let modalEl: HTMLElement | null = null;
let dropdownEl: HTMLElement | null = null;
let dropdownOpen = false;

export function showAuthModal() {
  if (modalEl) {
    modalEl.classList.add("auth-active");
    return;
  }
  buildModal();
}

export async function checkAuthAndUpdateUI() {
  const user = await getCurrentUser().catch(() => null);
  updateHeaderButton(user);
  return user;
}

function updateHeaderButton(user: any) {
  const btn = document.getElementById("auth-header-btn");
  if (!btn) return;
  if (user) {
    const name =
      user.user_metadata?.display_name || user.email?.split("@")[0] || "User";
    btn.textContent = `Hi, ${name}!`;
    btn.setAttribute("data-logged-in", "true");
  } else {
    btn.textContent = "Log In";
    btn.removeAttribute("data-logged-in");
  }
}

/* ---- Profile Dropdown ---- */
async function toggleDropdown(anchorEl?: HTMLElement) {
  if (dropdownOpen) {
    closeDropdown();
    return;
  }
  if (!dropdownEl) buildDropdown(anchorEl);
  dropdownEl!.classList.add("prof-open");
  dropdownOpen = true;

  // Load stats from localStorage
  const statsEl = dropdownEl!.querySelector(".prof-stats") as HTMLElement;
  if (statsEl) {
    // Count all mbu-perfect-* keys = Lessons Completed (green checkmarks)
    let lessonsCompleted = 0;
    const perfectSlugs = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("mbu-perfect-")) {
        lessonsCompleted++;
        perfectSlugs.add(k.replace("mbu-perfect-", ""));
      }
    }

    // Count Subjects Completed: a subject is complete when ALL its lessons with quizzes have green checkmarks
    // We check the sidebar nav to find which lessons belong to each subject
    const subjectSlugs = [
      "arithmetic",
      "pre-algebra",
      "algebra-basics",
      "geometry",
      "algebra-2",
      "trigonometry",
      "pre-calculus",
      "calculus-1",
      "calculus-2",
      "calculus-3",
    ];
    let subjectsCompleted = 0;
    for (const subj of subjectSlugs) {
      // Find all sidebar links for this subject
      const links = document.querySelectorAll(`nav a[href*="/${subj}/"]`);
      if (links.length === 0) continue;
      // Filter to only lessons with quizzes (exclude "about-" pages)
      const lessonSlugs: string[] = [];
      links.forEach((a) => {
        const href = a.getAttribute("href") || "";
        const slug = href
          .replace(/^\//, "")
          .replace(/\/$/, "")
          .split("/")
          .pop();
        if (slug && !slug.startsWith("about-")) {
          lessonSlugs.push(slug);
        }
      });
      if (lessonSlugs.length === 0) continue;
      const allPerfect = lessonSlugs.every((s) => perfectSlugs.has(s));
      if (allPerfect) subjectsCompleted++;
    }

    statsEl.innerHTML = `<div class="prof-stat"><span class="prof-stat-num">${subjectsCompleted}</span><span class="prof-stat-label">Subjects Completed</span></div><div class="prof-stat"><span class="prof-stat-num">${lessonsCompleted}</span><span class="prof-stat-label">Lessons Completed</span></div>`;
  }

  // Close on outside click
  setTimeout(() => document.addEventListener("click", outsideClick), 0);
}

function outsideClick(e: MouseEvent) {
  const btn = document.getElementById("auth-header-btn");
  const mobileBtn = document.getElementById("mobile-auth-btn");
  if (
    dropdownEl &&
    !dropdownEl.contains(e.target as Node) &&
    e.target !== btn &&
    e.target !== mobileBtn &&
    !(mobileBtn && mobileBtn.contains(e.target as Node))
  )
    closeDropdown();
}

function closeDropdown() {
  dropdownEl?.classList.remove("prof-open");
  dropdownOpen = false;
  document.removeEventListener("click", outsideClick);
}

function buildDropdown(anchorEl?: HTMLElement) {
  const btn =
    anchorEl ||
    document.getElementById("auth-header-btn") ||
    document.getElementById("mobile-auth-btn");
  if (!btn) return;
  const dd = document.createElement("div");
  dd.className = "prof-dropdown";
  dd.innerHTML = `<div class="prof-stats"><div class="prof-stat"><span class="prof-stat-num">...</span><span class="prof-stat-label">Loading</span></div></div><button class="prof-logout">Log Out</button>`;
  dd.querySelector(".prof-logout")!.addEventListener("click", async () => {
    await signOut();
    window.location.reload();
  });

  // On mobile, use fixed positioning so we don't disturb the header layout
  const isMobile = window.innerWidth < 800;
  if (isMobile) {
    dd.style.position = "fixed";
    dd.style.top = "auto";
    dd.style.right = "0.75rem";
    // Position below the header
    const rect = btn.getBoundingClientRect();
    dd.style.top = rect.bottom + 8 + "px";
    document.body.appendChild(dd);
  } else {
    const wrapper = btn.parentElement || document.body;
    wrapper.style.position = "relative";
    wrapper.appendChild(dd);
  }
  dropdownEl = dd;
}

/* ---- Auth Modal ---- */
function buildModal() {
  const overlay = document.createElement("div");
  overlay.className = "auth-overlay";
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  const modal = document.createElement("div");
  modal.className = "auth-modal";

  const closeBtn = document.createElement("button");
  closeBtn.className = "auth-close";
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", closeModal);
  modal.appendChild(closeBtn);

  const tabs = document.createElement("div");
  tabs.className = "auth-tabs";
  const loginTab = document.createElement("button");
  loginTab.className = "auth-tab active";
  loginTab.textContent = "Log In";
  const signupTab = document.createElement("button");
  signupTab.className = "auth-tab";
  signupTab.textContent = "Sign Up";
  tabs.appendChild(loginTab);
  tabs.appendChild(signupTab);
  modal.appendChild(tabs);

  const form = document.createElement("form");
  form.className = "auth-form";
  form.addEventListener("submit", (e) => e.preventDefault());

  const usernameInput = document.createElement("input");
  usernameInput.type = "text";
  usernameInput.placeholder = "Choose a username (max 12 chars)";
  usernameInput.className = "auth-input";
  usernameInput.maxLength = 12;
  usernameInput.autocomplete = "username";
  usernameInput.style.display = "none";

  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.placeholder = "Email";
  emailInput.className = "auth-input";
  emailInput.required = true;
  emailInput.autocomplete = "email";

  const passInput = document.createElement("input");
  passInput.type = "password";
  passInput.placeholder = "Password";
  passInput.className = "auth-input";
  passInput.required = true;
  passInput.autocomplete = "current-password";

  const errorEl = document.createElement("p");
  errorEl.className = "auth-error";

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "auth-submit";
  submitBtn.textContent = "Log In";

  form.appendChild(usernameInput);
  form.appendChild(emailInput);
  form.appendChild(passInput);
  form.appendChild(errorEl);
  form.appendChild(submitBtn);

  const forgotLink = document.createElement("button");
  forgotLink.type = "button";
  forgotLink.className = "auth-forgot";
  forgotLink.textContent = "Forgot password?";
  forgotLink.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) {
      errorEl.textContent = "Enter your email above first.";
      return;
    }
    forgotLink.textContent = "Sending...";
    const { error } = await resetPassword(email);
    if (error) {
      errorEl.textContent = error.message;
    } else {
      errorEl.style.color = "var(--sl-color-text-accent)";
      errorEl.textContent = "Password reset email sent! Check your inbox.";
    }
    forgotLink.textContent = "Forgot password?";
  });
  form.appendChild(forgotLink);
  modal.appendChild(form);

  const note = document.createElement("p");
  note.className = "auth-note";
  note.textContent = "Log in to save your quiz progress across devices.";
  modal.appendChild(note);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  modalEl = overlay;

  let mode: "login" | "signup" = "login";

  loginTab.addEventListener("click", () => {
    mode = "login";
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    submitBtn.textContent = "Log In";
    usernameInput.style.display = "none";
    forgotLink.style.display = "";
    passInput.autocomplete = "current-password";
    errorEl.textContent = "";
    errorEl.style.color = "";
  });
  signupTab.addEventListener("click", () => {
    mode = "signup";
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    submitBtn.textContent = "Sign Up";
    usernameInput.style.display = "";
    forgotLink.style.display = "none";
    passInput.autocomplete = "new-password";
    errorEl.textContent = "";
    errorEl.style.color = "";
  });

  form.addEventListener("submit", async () => {
    const email = emailInput.value.trim();
    const pass = passInput.value;
    if (!email || !pass) {
      errorEl.textContent = "Please fill in both fields.";
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "Loading...";
    errorEl.textContent = "";

    if (mode === "login") {
      const { error } = await signIn(email, pass);
      if (error) {
        errorEl.textContent = error.message;
        submitBtn.disabled = false;
        submitBtn.textContent = "Log In";
      } else {
        // Fire-and-forget: sync localStorage progress to Supabase
        syncLocalProgressToSupabase();
        closeModal();
        window.location.reload();
      }
    } else {
      let username = usernameInput.value.trim().slice(0, 12);
      if (!username) username = email.split("@")[0].slice(0, 12);
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { display_name: username } },
      });
      if (error) {
        errorEl.textContent = error.message;
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign Up";
      } else {
        errorEl.style.color = "var(--sl-color-text-accent)";
        errorEl.textContent = "Check your email for a confirmation link!";
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign Up";
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl?.classList.contains("auth-active"))
      closeModal();
  });
  requestAnimationFrame(() => overlay.classList.add("auth-active"));
  emailInput.focus();
}

function closeModal() {
  modalEl?.classList.remove("auth-active");
}

/** Handle mobile auth icon tap: logged out = modal, logged in = dropdown */
export async function handleMobileAuthClick(anchorEl: HTMLElement) {
  try {
    const user = await getCurrentUser().catch(() => null);
    if (user) {
      toggleDropdown(anchorEl);
    } else {
      showAuthModal();
    }
  } catch {
    showAuthModal();
  }
}

/** Initialize the auth header button */
export function initAuthButton() {
  const header = document.querySelector("header");
  if (!header || document.getElementById("auth-header-btn")) return;

  const btn = document.createElement("button");
  btn.id = "auth-header-btn";
  btn.className = "auth-header-btn";
  btn.textContent = "Log In";

  btn.addEventListener("click", () => {
    if (btn.getAttribute("data-logged-in")) {
      toggleDropdown();
    } else {
      showAuthModal();
    }
  });

  const rightActions = header.querySelector(
    ".sl-flex.right-group, .right-group, [class*='right']",
  );
  const target =
    rightActions ||
    header.querySelectorAll(".sl-flex")[
      header.querySelectorAll(".sl-flex").length - 1
    ] ||
    header;
  target.appendChild(btn);

  checkAuthAndUpdateUI();
}
