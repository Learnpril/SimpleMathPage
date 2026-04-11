import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  integrations: [
    starlight({
      title: "Mom's Basement University",
      favicon: "/favicon.png",
      logo: {
        src: "./src/assets/logo.png",
      },
      sidebar: [
        {
          label: "Arithmetic",
          autogenerate: { directory: "arithmetic" },
        },
        {
          label: "Pre-Algebra",
          autogenerate: { directory: "pre-algebra" },
        },
        {
          label: "Algebra Basics",
          autogenerate: { directory: "algebra-basics" },
        },
        // Uncomment these sections as you add content:
        {
          label: "Geometry",
          autogenerate: { directory: "geometry" },
        },
        {
          label: "Algebra 2",
          autogenerate: { directory: "algebra-2" },
        },
        {
          label: "Trigonometry",
          autogenerate: { directory: "trigonometry" },
        },
        {
          label: "Pre-Calculus",
          autogenerate: { directory: "pre-calculus" },
        },
        {
          label: "Calculus 1",
          autogenerate: { directory: "calculus-1" },
        },
        {
          label: "Calculus 2",
          autogenerate: { directory: "calculus-2" },
        },
        {
          label: "Calculus 3",
          autogenerate: { directory: "calculus-3" },
        },
        // {
        //   label: "Linear Algebra",
        //   autogenerate: { directory: "linear-algebra" },
        // },
        // {
        //   label: "Discrete Mathematics",
        //   autogenerate: { directory: "discrete-mathematics" },
        // },
        // {
        //   label: "Statistics",
        //   autogenerate: { directory: "statistics" },
        // },
        // {
        //   label: "Differential Equations",
        //   autogenerate: { directory: "differential-equations" },
        // },
        // {
        //   label: "Abstract Algebra",
        //   autogenerate: { directory: "abstract-algebra" },
        // },
        // {
        //   label: "Real Analysis",
        //   autogenerate: { directory: "real-analysis" },
        // },
      ],
      customCss: ["./src/styles/custom.css", "katex/dist/katex.min.css"],
      head: [
        {
          tag: "script",
          attrs: { is: "inline" },
          content: `if (!localStorage.getItem('starlight-theme')) { localStorage.setItem('starlight-theme', '"dark"'); document.documentElement.dataset.theme = 'dark'; }`,
        },
        {
          tag: "script",
          content: `
            document.addEventListener('DOMContentLoaded', function() {
              if (window.innerWidth >= 800) return;
              var sunSvg = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-3a1 1 0 0 0 1-1V1a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1zm0 18a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1zM5.64 7.05 4.22 5.64a1 1 0 0 1 1.42-1.42l1.41 1.42a1 1 0 1 1-1.41 1.41zm12.73 9.9a1 1 0 1 0-1.42 1.42l1.42 1.41a1 1 0 0 0 1.41-1.41l-1.41-1.42zM4 12a1 1 0 0 0-1-1H1a1 1 0 0 0 0 2h2a1 1 0 0 0 1-1zm18-1h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2zM5.64 16.95a1 1 0 1 0-1.41 1.42l1.41 1.41a1 1 0 0 0 1.42-1.41l-1.42-1.42zm12.73-9.9a1 1 0 1 0 1.41-1.41l-1.41-1.42a1 1 0 0 0-1.42 1.42l1.42 1.41z"/></svg>';
              var moonSvg = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73A8.15 8.15 0 0 1 9.08 5.49a8.59 8.59 0 0 1 .25-2 1 1 0 0 0-.37-1 1 1 0 0 0-1-.17 10 10 0 1 0 13.69 11.65 1 1 0 0 0 0-.96z"/></svg>';
              var searchSvg = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';
              var header = document.querySelector('header .header') || document.querySelector('header');
              if (!header) return;

              /* Shorten site title to "MBU" on mobile */
              var titleSpan = header.querySelector('.site-title span');
              if (titleSpan) titleSpan.textContent = 'MBU';

              var group = document.createElement('div');
              group.className = 'mobile-header-icons';

              /* Search button - triggers Starlight's search modal */
              var searchBtn = document.createElement('button');
              searchBtn.className = 'mobile-header-icon';
              searchBtn.setAttribute('aria-label', 'Search');
              searchBtn.innerHTML = searchSvg;
              searchBtn.addEventListener('click', function() {
                var openModal = document.querySelector('button[data-open-modal]');
                if (openModal) openModal.click();
              });
              group.appendChild(searchBtn);

              /* Theme toggle */
              var themeBtn = document.createElement('button');
              themeBtn.className = 'mobile-header-icon';
              themeBtn.setAttribute('aria-label', 'Toggle theme');
              var isDark = document.documentElement.dataset.theme !== 'light';
              themeBtn.innerHTML = isDark ? sunSvg : moonSvg;
              themeBtn.addEventListener('click', function() {
                var sel = document.querySelector('starlight-theme-select select');
                if (sel) {
                  var next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
                  sel.value = next;
                  sel.dispatchEvent(new Event('change'));
                  themeBtn.innerHTML = next === 'dark' ? sunSvg : moonSvg;
                }
              });
              group.appendChild(themeBtn);

              /* Auth button (person icon) */
              var authBtn = document.createElement('button');
              authBtn.className = 'mobile-header-icon mobile-auth-icon';
              authBtn.id = 'mobile-auth-btn';
              authBtn.setAttribute('aria-label', 'Account');
              authBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
              authBtn.addEventListener('click', function() {
                import('/src/lib/auth-modal.ts').then(function(mod) {
                  if (mod && mod.handleMobileAuthClick) mod.handleMobileAuthClick(authBtn);
                  else if (mod && mod.showAuthModal) mod.showAuthModal();
                }).catch(function() {});
              });
              group.appendChild(authBtn);

              header.appendChild(group);
            });
          `,
        },
        {
          tag: "script",
          content: `
            document.addEventListener('DOMContentLoaded', function() {
              var path = window.location.pathname.replace(/^\\//, '').replace(/\\/$/, '');
              var parts = path.split('/');
              if (parts.length < 2) return;
              var section = parts[0];
              var map = {
                'arithmetic': 'Arithmetic',
                'pre-algebra': 'Pre-Algebra',
                'algebra-basics': 'Algebra Basics',
                'geometry': 'Geometry',
                'algebra-2': 'Algebra 2',
                'pre-calculus': 'Pre-Calculus',
                'trigonometry': 'Trigonometry',
                'calculus-1': 'Calculus 1',
                'calculus-2': 'Calculus 2',
                'calculus-3': 'Calculus 3',
                'linear-algebra': 'Linear Algebra',
                'discrete-mathematics': 'Discrete Mathematics',
                'statistics': 'Statistics',
                'differential-equations': 'Differential Equations'
              };
              var label = map[section];
              if (!label) return;
              var heading = document.querySelector('.sl-heading-wrapper h1, .content-panel h1, main h1');
              if (!heading) return;
              var badge = document.createElement('div');
              badge.className = 'section-badge';
              badge.textContent = label;
              heading.parentNode.insertBefore(badge, heading);

              // Also inject section labels into pagination links
              var pagLinks = document.querySelectorAll('.pagination-links a');
              pagLinks.forEach(function(link) {
                var href = link.getAttribute('href') || '';
                var hrefClean = href.replace(/^\\//, '').replace(/\\/$/, '');
                var hrefParts = hrefClean.split('/');
                if (hrefParts.length < 2) return;
                var linkSection = map[hrefParts[0]];
                if (!linkSection) return;
                var linkTitle = link.querySelector('.link-title');
                if (!linkTitle) return;
                var secSpan = document.createElement('span');
                secSpan.className = 'pagination-section';
                secSpan.textContent = linkSection;
                linkTitle.parentNode.insertBefore(secSpan, linkTitle);
              });
            });
          `,
        },
        {
          tag: "script",
          content: `
            document.addEventListener('DOMContentLoaded', function() {
              if (window.innerWidth >= 800) return;
              var subjects = [
                {slug:'arithmetic', label:'Arithmetic', about:'about-arithmetic'},
                {slug:'pre-algebra', label:'Pre-Algebra', about:'about-pre-algebra'},
                {slug:'algebra-basics', label:'Algebra Basics', about:'about-algebra-basics'},
                {slug:'geometry', label:'Geometry', about:'about-geometry'},
                {slug:'algebra-2', label:'Algebra 2', about:'about-algebra-2'},
                {slug:'trigonometry', label:'Trigonometry', about:'about-trigonometry'},
                {slug:'pre-calculus', label:'Pre-Calculus', about:'about-pre-calculus'},
                {slug:'calculus-1', label:'Calculus 1', about:'about-calculus-1'},
                {slug:'calculus-2', label:'Calculus 2', about:'about-calculus-2'},
                {slug:'calculus-3', label:'Calculus 3', about:'about-calculus-3'}
              ];
              var path = window.location.pathname.replace(/^\\//, '').replace(/\\/$/, '');
              var currentSection = path.split('/')[0] || '';

              /* Scrape lessons from Starlight's sidebar nav */
              function getLessons(slug) {
                var items = [];
                var groups = document.querySelectorAll('nav.sidebar-content details, nav[aria-label="Main"] details');
                groups.forEach(function(det) {
                  var summary = det.querySelector('summary');
                  if (!summary) return;
                  var links = det.querySelectorAll('a[href*="/' + slug + '/"]');
                  links.forEach(function(a) {
                    var href = a.getAttribute('href');
                    var text = a.textContent.trim();
                    if (text && href) items.push({href: href, text: text});
                  });
                });
                /* fallback: scan all sidebar links */
                if (items.length === 0) {
                  document.querySelectorAll('nav a[href*="/' + slug + '/"]').forEach(function(a) {
                    var href = a.getAttribute('href');
                    var text = a.textContent.trim();
                    if (text && href) items.push({href: href, text: text});
                  });
                }
                return items;
              }

              var overlay = document.createElement('div');
              overlay.className = 'mobile-subject-overlay';
              document.body.appendChild(overlay);

              var panel = document.createElement('div');
              panel.className = 'mobile-subject-panel';
              var title = document.createElement('div');
              title.className = 'mobile-subject-panel-title';
              title.textContent = 'Jump to Subject';
              panel.appendChild(title);

              var expandedSlug = null;

              subjects.forEach(function(s) {
                var row = document.createElement('div');
                row.className = 'msw-subject-row';

                var btn = document.createElement('button');
                btn.className = 'msw-subject-btn' + (s.slug === currentSection ? ' active' : '');
                btn.innerHTML = '<span>' + s.label + '</span><svg class="msw-chevron" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>';

                var lessonList = document.createElement('div');
                lessonList.className = 'msw-lessons';

                btn.addEventListener('click', function(e) {
                  e.preventDefault();
                  if (expandedSlug === s.slug) {
                    lessonList.classList.remove('open');
                    btn.classList.remove('expanded');
                    expandedSlug = null;
                    return;
                  }
                  /* collapse any other open */
                  panel.querySelectorAll('.msw-lessons.open').forEach(function(el) { el.classList.remove('open'); });
                  panel.querySelectorAll('.msw-subject-btn.expanded').forEach(function(el) { el.classList.remove('expanded'); });

                  /* populate lessons on first expand */
                  if (!lessonList.dataset.loaded) {
                    var lessons = getLessons(s.slug);
                    if (lessons.length === 0) {
                      var li = document.createElement('a');
                      li.href = '/' + s.slug + '/' + s.about + '/';
                      li.className = 'msw-lesson-link';
                      var ts = document.createElement('span');
                      ts.className = 'msw-link-text';
                      ts.textContent = 'Go to ' + s.label;
                      li.appendChild(ts);
                      lessonList.appendChild(li);
                    } else {
                      lessons.forEach(function(l) {
                        var li = document.createElement('a');
                        li.href = l.href;
                        li.className = 'msw-lesson-link';
                        if (path === l.href.replace(/^\\//, '').replace(/\\/$/, '')) li.classList.add('current');
                        var textSpan = document.createElement('span');
                        textSpan.className = 'msw-link-text';
                        textSpan.textContent = l.text;
                        li.appendChild(textSpan);
                        /* Add checkmark if perfect score in localStorage */
                        var lSlug = l.href.replace(/^\\//, '').replace(/\\/$/, '').split('/').pop();
                        if (lSlug && localStorage.getItem('mbu-perfect-' + lSlug)) {
                          var ck = document.createElement('span');
                          ck.className = 'sidebar-check';
                          ck.textContent = '\u2705';
                          ck.title = 'Perfect score!';
                          li.appendChild(ck);
                        }
                        li.addEventListener('click', function() { close(); });
                        lessonList.appendChild(li);
                      });
                    }
                    lessonList.dataset.loaded = '1';
                  }

                  lessonList.classList.add('open');
                  btn.classList.add('expanded');
                  expandedSlug = s.slug;

                  /* scroll the expanded section into view */
                  setTimeout(function() { btn.scrollIntoView({behavior:'smooth', block:'nearest'}); }, 50);
                });

                row.appendChild(btn);
                row.appendChild(lessonList);
                panel.appendChild(row);
              });
              document.body.appendChild(panel);

              var fab = document.createElement('button');
              fab.className = 'mobile-subject-fab';
              fab.setAttribute('aria-label', 'Switch subject');
              var menuIcon = '<svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>';
              var closeIcon = '<svg viewBox="0 0 24 24"><path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/></svg>';
              fab.innerHTML = menuIcon + '<span class="fab-label">Subjects</span>';
              document.body.appendChild(fab);

              var isOpen = false;
              function toggle() {
                isOpen = !isOpen;
                panel.classList.toggle('open', isOpen);
                overlay.classList.toggle('open', isOpen);
                fab.innerHTML = isOpen
                  ? closeIcon + '<span class="fab-label">Close</span>'
                  : menuIcon + '<span class="fab-label">Subjects</span>';
              }
              function close() {
                if (!isOpen) return;
                isOpen = false;
                panel.classList.remove('open');
                overlay.classList.remove('open');
                fab.innerHTML = menuIcon + '<span class="fab-label">Subjects</span>';
              }
              fab.addEventListener('click', toggle);
              overlay.addEventListener('click', close);
            });
          `,
        },
        {
          tag: "script",
          content: `
            /* Auth button in header */
            document.addEventListener('DOMContentLoaded', async function() {
              try {
                var mod = await import('/src/lib/auth-modal.ts');
                if (mod && mod.initAuthButton) mod.initAuthButton();
              } catch(e) { /* Supabase not configured yet */ }
            });
          `,
        },
        {
          tag: "script",
          content: `
            /* Sidebar checkmarks: inject completion indicators from Supabase */
            document.addEventListener('DOMContentLoaded', async function() {
              try {
                var mod = await import('/src/lib/supabase/client.ts');
                if (!mod || !mod.createSupabaseClient) return;
                var supabase = mod.createSupabaseClient();
                var session = await supabase.auth.getSession();
                if (!session.data.session) return;

                var resp = await supabase.from('user_progress').select('lesson_slug, is_perfect, completed');
                if (!resp.data) return;

                var progressMap = {};
                resp.data.forEach(function(r) {
                  progressMap[r.lesson_slug] = r;
                });

                document.querySelectorAll('nav a[href]').forEach(function(link) {
                  var href = link.getAttribute('href') || '';
                  var slug = href.replace(/^\\//, '').replace(/\\/$/, '').split('/').pop();
                  if (!slug || !progressMap[slug]) return;
                  var p = progressMap[slug];
                  if (!p.completed) return;
                  var badge = document.createElement('span');
                  badge.className = 'sidebar-check';
                  badge.textContent = p.is_perfect ? '\\uD83D\\uDFE2' : '\\u2705';
                  badge.title = p.is_perfect ? 'Perfect score!' : 'Completed';
                  link.appendChild(badge);
                });
              } catch(e) { /* silently fail if not logged in or Supabase unavailable */ }
            });
          `,
        },
        {
          tag: "script",
          content: `
            /* Sidebar checkmarks from localStorage (works without login) */
            document.addEventListener('DOMContentLoaded', function() {
              document.querySelectorAll('nav a[href]').forEach(function(link) {
                var href = link.getAttribute('href') || '';
                var slug = href.replace(/^\\//, '').replace(/\\/$/, '').split('/').pop();
                if (!slug) return;
                if (localStorage.getItem('mbu-perfect-' + slug)) {
                  if (link.querySelector('.sidebar-check')) return;
                  var badge = document.createElement('span');
                  badge.className = 'sidebar-check';
                  badge.textContent = '\\u2705';
                  badge.title = 'Perfect score!';
                  link.appendChild(badge);
                }
              });
            });
          `,
        },
        {
          tag: "script",
          content: `
            document.addEventListener('DOMContentLoaded', function() {
              var footer = document.createElement('div');
              footer.className = 'scratch-paper-footer';
              footer.innerHTML = '\\u270F\\uFE0F Grab some scratch paper and work the problems out by hand — it makes a huge difference.';
              document.body.appendChild(footer);
            });
          `,
        },
        {
          tag: "link",
          attrs: {
            rel: "preconnect",
            href: "https://fonts.googleapis.com",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "preconnect",
            href: "https://fonts.gstatic.com",
            crossorigin: true,
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "stylesheet",
            href: "https://fonts.googleapis.com/css?family=Libre+Baskerville:400,400italic,700&display=swap",
          },
        },
      ],
    }),
  ],
});
