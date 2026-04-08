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
        { label: "Welcome", slug: "" },
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
          content: `if (!localStorage.getItem('starlight-theme')) { document.documentElement.dataset.theme = 'dark'; }`,
        },
        {
          tag: "script",
          content: `
            document.addEventListener('DOMContentLoaded', function() {
              if (window.innerWidth >= 800) return;
              var sunSvg = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-3a1 1 0 0 0 1-1V1a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1zm0 18a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1zM5.64 7.05 4.22 5.64a1 1 0 0 1 1.42-1.42l1.41 1.42a1 1 0 1 1-1.41 1.41zm12.73 9.9a1 1 0 1 0-1.42 1.42l1.42 1.41a1 1 0 0 0 1.41-1.41l-1.41-1.42zM4 12a1 1 0 0 0-1-1H1a1 1 0 0 0 0 2h2a1 1 0 0 0 1-1zm18-1h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2zM5.64 16.95a1 1 0 1 0-1.41 1.42l1.41 1.41a1 1 0 0 0 1.42-1.41l-1.42-1.42zm12.73-9.9a1 1 0 1 0 1.41-1.41l-1.41-1.42a1 1 0 0 0-1.42 1.42l1.42 1.41z"/></svg>';
              var moonSvg = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73A8.15 8.15 0 0 1 9.08 5.49a8.59 8.59 0 0 1 .25-2 1 1 0 0 0-.37-1 1 1 0 0 0-1-.17 10 10 0 1 0 13.69 11.65 1 1 0 0 0 0-.96z"/></svg>';
              var header = document.querySelector('header');
              if (!header) return;

              var group = document.createElement('div');
              group.className = 'mobile-header-icons';

              var search = header.querySelector('starlight-search');
              if (search) group.appendChild(search);

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

              header.appendChild(group);
            });
          `,
        },
        {
          tag: "script",
          content: `
            document.addEventListener('DOMContentLoaded', function() {
              if (window.innerWidth >= 800) return;
              var path = window.location.pathname;
              var isHome = (path === '/' || path === '/index.html');
              var bar = document.createElement('div');
              bar.className = 'mobile-nav-bar';
              if (!isHome) {
                var btn = document.createElement('a');
                btn.href = '/';
                btn.className = 'mobile-back-btn';
                btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H19v-2z"/></svg>Back';
                bar.appendChild(btn);
              }
              var menuBtn = document.createElement('button');
              menuBtn.className = 'mobile-menu-btn';
              menuBtn.setAttribute('aria-label', 'Menu');
              menuBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>';
              menuBtn.addEventListener('click', function() {
                var real = document.querySelector('starlight-menu-button button');
                if (real) real.click();
              });
              bar.appendChild(menuBtn);
              var main = document.querySelector('main') || document.querySelector('.main-pane');
              var header = document.querySelector('header');
              if (header && header.nextElementSibling) {
                header.parentNode.insertBefore(bar, header.nextElementSibling);
              } else if (main) {
                main.parentNode.insertBefore(bar, main);
              } else {
                document.body.insertBefore(bar, document.body.firstChild);
              }
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
