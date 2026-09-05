import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeBoldHeading from "./src/lib/rehype-bold-heading.mjs";

export default defineConfig({
  site: "https://momsbasementuniversity.com",
  // The game development track was split into a 2D prerequisite and a 3D track, so its
  // pages moved from /applied/game-development/ to /applied/3d-game-development/. These
  // keep the already-published URLs working rather than leaving six dead links.
  redirects: {
    "/applied/game-development/about-game-development":
      "/applied/3d-game-development/about-3d-game-development/",
    "/applied/game-development/points-vectors-and-coordinate-conventions":
      "/applied/3d-game-development/points-vectors-and-coordinate-conventions/",
    "/applied/game-development/length-normalization-and-distance":
      "/applied/3d-game-development/length-normalization-and-distance/",
    "/applied/game-development/the-dot-product":
      "/applied/3d-game-development/the-dot-product/",
    "/applied/game-development/the-cross-product-and-building-a-basis":
      "/applied/3d-game-development/the-cross-product-and-building-a-basis/",
    "/applied/game-development/angles-atan2-and-shortest-rotation":
      "/applied/3d-game-development/angles-atan2-and-shortest-rotation/",
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, rehypeBoldHeading],
  },
  integrations: [
    sitemap(),
    starlight({
      title: "Mom's Basement University",
      favicon: "/favicon.png",
      logo: {
        src: "./src/assets/logo.png",
      },
      components: {
        Head: "./src/components/Head.astro",
        Header: "./src/components/Header.astro",
      },
      // Two top-level tracks. Core keeps its original URLs (/arithmetic/... rather
      // than /core/arithmetic/...) because every section-detection script below reads
      // path.split('/')[0] as the subject slug, and because those pages are already
      // indexed. Applied is new, so it gets /applied/... from the start.
      sidebar: [
        {
          label: "Core Mathematics",
          collapsed: true,
          items: [
            { label: "All Core Subjects", link: "/core-mathematics/" },
            { label: "Arithmetic", autogenerate: { directory: "arithmetic" } },
            {
              label: "Pre-Algebra",
              autogenerate: { directory: "pre-algebra" },
            },
            {
              label: "Algebra Basics",
              autogenerate: { directory: "algebra-basics" },
            },
            { label: "Geometry", autogenerate: { directory: "geometry" } },
            { label: "Algebra 2", autogenerate: { directory: "algebra-2" } },
            {
              label: "Trigonometry",
              autogenerate: { directory: "trigonometry" },
            },
            {
              label: "Pre-Calculus",
              autogenerate: { directory: "pre-calculus" },
            },
            { label: "Calculus 1", autogenerate: { directory: "calculus-1" } },
            { label: "Calculus 2", autogenerate: { directory: "calculus-2" } },
            { label: "Calculus 3", autogenerate: { directory: "calculus-3" } },
            {
              label: "Linear Algebra",
              autogenerate: { directory: "linear-algebra" },
            },
            {
              label: "Differential Equations",
              autogenerate: { directory: "differential-equations" },
            },
            {
              label: "Discrete Mathematics",
              autogenerate: { directory: "discrete-mathematics" },
            },
            { label: "Statistics", autogenerate: { directory: "statistics" } },
            {
              label: "Abstract Algebra",
              autogenerate: { directory: "abstract-algebra" },
            },
            {
              label: "Real Analysis",
              autogenerate: { directory: "real-analysis" },
            },
            {
              label: "Complex Analysis",
              autogenerate: { directory: "complex-analysis" },
            },
            { label: "Topology", autogenerate: { directory: "topology" } },
          ],
        },
        {
          label: "Applied Mathematics",
          collapsed: true,
          items: [
            { label: "All Applied Modules", link: "/applied-mathematics/" },
            // 2D first, deliberately. It is the prerequisite: the same ideas with one
            // fewer axis, where a sign error is visible on screen instead of hidden
            // inside a rotation.
            {
              label: "2D Game Development",
              items: [
                {
                  slug: "applied/2d-game-development/about-2d-game-development",
                },
                {
                  label: "Part 1: The Screen and Its Coordinates",
                  collapsed: false,
                  items: [
                    {
                      slug: "applied/2d-game-development/pixels-coordinates-and-the-y-axis",
                    },
                    {
                      slug: "applied/2d-game-development/points-vectors-and-directions",
                    },
                    {
                      slug: "applied/2d-game-development/length-distance-and-normalizing",
                    },
                    {
                      slug: "applied/2d-game-development/the-dot-product",
                    },
                  ],
                },
                {
                  label: "Part 2: Turning and Aiming",
                  collapsed: false,
                  items: [
                    {
                      slug: "applied/2d-game-development/the-2d-cross-product-and-which-side",
                    },
                    {
                      slug: "applied/2d-game-development/angles-radians-and-atan2",
                    },
                    {
                      slug: "applied/2d-game-development/rotating-a-point-and-turning-smoothly",
                    },
                  ],
                },
                {
                  label: "Part 3: Transforms and Cameras",
                  collapsed: false,
                  items: [
                    {
                      slug: "applied/2d-game-development/translate-rotate-and-scale",
                    },
                    {
                      slug: "applied/2d-game-development/parents-children-and-local-space",
                    },
                  ],
                },
              ],
            },
            {
              label: "3D Game Development",
              items: [
                {
                  slug: "applied/3d-game-development/about-3d-game-development",
                },
                {
                  label: "Part 1: Vectors",
                  collapsed: false,
                  items: [
                    {
                      slug: "applied/3d-game-development/points-vectors-and-coordinate-conventions",
                    },
                    {
                      slug: "applied/3d-game-development/length-normalization-and-distance",
                    },
                    { slug: "applied/3d-game-development/the-dot-product" },
                    {
                      slug: "applied/3d-game-development/the-cross-product-and-building-a-basis",
                    },
                    {
                      slug: "applied/3d-game-development/angles-atan2-and-shortest-rotation",
                    },
                  ],
                },
                {
                  label: "Part 2: Transforms",
                  collapsed: false,
                  items: [
                    {
                      slug: "applied/3d-game-development/matrices-as-transformations",
                    },
                    {
                      slug: "applied/3d-game-development/homogeneous-coordinates-and-4x4-matrices",
                    },
                    {
                      slug: "applied/3d-game-development/trs-order-and-composing-transforms",
                    },
                    {
                      slug: "applied/3d-game-development/local-world-view-and-clip-space",
                    },
                  ],
                },
                {
                  label: "Part 3: Rotations",
                  collapsed: false,
                  items: [
                    {
                      slug: "applied/3d-game-development/euler-angles-and-gimbal-lock",
                    },
                    { slug: "applied/3d-game-development/quaternions" },
                    {
                      slug: "applied/3d-game-development/interpolating-rotations-slerp-and-nlerp",
                    },
                  ],
                },
                {
                  label: "Part 4: Time and Feel",
                  collapsed: false,
                  items: [
                    {
                      slug: "applied/3d-game-development/delta-time-and-frame-rate-independence",
                    },
                    {
                      slug: "applied/3d-game-development/easing-smoothstep-and-damping",
                    },
                    { slug: "applied/3d-game-development/bezier-curves" },
                    {
                      slug: "applied/3d-game-development/hermite-catmull-rom-and-constant-speed-paths",
                    },
                  ],
                },
                {
                  label: "Part 5: Cameras and Screen Space",
                  collapsed: false,
                  items: [
                    {
                      slug: "applied/3d-game-development/projection-fov-and-the-view-frustum",
                    },
                    {
                      slug: "applied/3d-game-development/screen-space-to-world-space",
                    },
                  ],
                },
                {
                  label: "Part 6: Geometry and Collision",
                  collapsed: false,
                  items: [
                    {
                      slug: "applied/3d-game-development/rays-planes-and-closest-points",
                    },
                    {
                      slug: "applied/3d-game-development/bounding-volumes-and-intersection-tests",
                    },
                    {
                      slug: "applied/3d-game-development/collision-response-penetration-and-sliding",
                    },
                  ],
                },
                {
                  label: "Part 7: Physics Integration",
                  collapsed: false,
                  items: [
                    {
                      slug: "applied/3d-game-development/velocity-acceleration-and-forces",
                    },
                    {
                      slug: "applied/3d-game-development/integrators-and-the-fixed-timestep",
                    },
                  ],
                },
                {
                  label: "Capstone",
                  collapsed: false,
                  items: [
                    {
                      slug: "applied/3d-game-development/capstone-third-person-character-controller",
                    },
                  ],
                },
              ],
            },
          ],
        },
        { label: "About", link: "/about/" },
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
              var path = window.location.pathname.replace(/^\\//, '').replace(/\\/$/, '');
              var parts = path.split('/');
              if (parts.length < 2) return;
              /* Core subjects live at the site root, so the first segment names the
                 subject. Applied tracks live under /applied/<track>/, so the first
                 segment is always "applied" and the track name is the second. */
              function sectionKey(p) {
                return p[0] === 'applied' && p.length > 2 ? p[0] + '/' + p[1] : p[0];
              }
              var section = sectionKey(parts);
              var map = {
                'applied/2d-game-development': '2D Game Development',
                'applied/3d-game-development': '3D Game Development',
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
                'differential-equations': 'Differential Equations',
                'discrete-mathematics': 'Discrete Mathematics',
                'statistics': 'Statistics',
                'abstract-algebra': 'Abstract Algebra',
                'real-analysis': 'Real Analysis',
                'complex-analysis': 'Complex Analysis',
                'topology': 'Topology'
              };
              var label = map[section];
              if (!label) return;
              var heading = document.querySelector('.sl-heading-wrapper h1, .content-panel h1, main h1');
              if (!heading) return;
              var badge = document.createElement('div');
              badge.className = 'section-badge';
              badge.textContent = label;

              /* Applied modules group their sections into numbered Parts. The grouping has
                 no page of its own, so name it here - otherwise a reader landing mid-module
                 has no way to tell which Part they are in. Keyed by the section slug so a
                 new section only needs one line. */
              var partOf = {
                'applied/2d-game-development': {
                  'pixels-coordinates-and-the-y-axis':         [1, 'The Screen and Its Coordinates'],
                  'points-vectors-and-directions':             [1, 'The Screen and Its Coordinates'],
                  'length-distance-and-normalizing':           [1, 'The Screen and Its Coordinates'],
                  'the-dot-product':                           [1, 'The Screen and Its Coordinates'],
                  'the-2d-cross-product-and-which-side':       [2, 'Turning and Aiming'],
                  'angles-radians-and-atan2':                  [2, 'Turning and Aiming'],
                  'rotating-a-point-and-turning-smoothly':     [2, 'Turning and Aiming'],
                  'translate-rotate-and-scale':                [3, 'Transforms and Cameras'],
                  'parents-children-and-local-space':          [3, 'Transforms and Cameras']
                },
                'applied/3d-game-development': {
                  'points-vectors-and-coordinate-conventions': [1, 'Vectors and Spatial Reasoning'],
                  'length-normalization-and-distance':         [1, 'Vectors and Spatial Reasoning'],
                  'the-dot-product':                          [1, 'Vectors and Spatial Reasoning'],
                  'the-cross-product-and-building-a-basis':    [1, 'Vectors and Spatial Reasoning'],
                  'angles-atan2-and-shortest-rotation':        [1, 'Vectors and Spatial Reasoning'],
                  'matrices-as-transformations':               [2, 'Matrices and Transformations'],
                  'homogeneous-coordinates-and-4x4-matrices':  [2, 'Matrices and Transformations'],
                  'trs-order-and-composing-transforms':        [2, 'Matrices and Transformations'],
                  'local-world-view-and-clip-space':           [2, 'Matrices and Transformations'],
                  'euler-angles-and-gimbal-lock':              [3, 'Rotations Done Right'],
                  'quaternions':                               [3, 'Rotations Done Right'],
                  'interpolating-rotations-slerp-and-nlerp':   [3, 'Rotations Done Right'],
                  'delta-time-and-frame-rate-independence':    [4, 'Time, Interpolation and Feel'],
                  'easing-smoothstep-and-damping':             [4, 'Time, Interpolation and Feel'],
                  'bezier-curves':                             [4, 'Time, Interpolation and Feel'],
                  'hermite-catmull-rom-and-constant-speed-paths': [4, 'Time, Interpolation and Feel'],
                  'projection-fov-and-the-view-frustum':       [5, 'Cameras and Screen Space'],
                  'screen-space-to-world-space':               [5, 'Cameras and Screen Space'],
                  'rays-planes-and-closest-points':            [6, 'Geometry and Collision'],
                  'bounding-volumes-and-intersection-tests':   [6, 'Geometry and Collision'],
                  'collision-response-penetration-and-sliding': [6, 'Geometry and Collision'],
                  'velocity-acceleration-and-forces':          [7, 'Physics Integration'],
                  'integrators-and-the-fixed-timestep':        [7, 'Physics Integration']
                  /* The capstone is deliberately absent: it belongs to no Part, and the badge
                     reads better without a Part number it would have to invent. */
                }
              };
              var partMap = partOf[section];
              var slug = parts[parts.length - 1];
              if (partMap && partMap[slug]) {
                var sep = document.createElement('span');
                sep.className = 'part-badge-sep';
                sep.textContent = '\\u00B7';
                var part = document.createElement('span');
                part.className = 'part-badge';
                part.textContent = 'Part ' + partMap[slug][0] + ': ' + partMap[slug][1];
                badge.appendChild(sep);
                badge.appendChild(part);
              }

              heading.parentNode.insertBefore(badge, heading);

              // Also inject section labels into pagination links
              var pagLinks = document.querySelectorAll('.pagination-links a');
              pagLinks.forEach(function(link) {
                var href = link.getAttribute('href') || '';
                var hrefClean = href.replace(/^\\//, '').replace(/\\/$/, '');
                var hrefParts = hrefClean.split('/');
                if (hrefParts.length < 2) return;
                var linkSection = map[sectionKey(hrefParts)];
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
              /* Grouped by domain and listed Core first, matching the desktop nav's order. A single
                 flat list put Applied's two modules above Core's eighteen with nothing to say why,
                 which read as one mixed pile of twenty subjects. */
              var subjects = [
                {slug:'arithmetic', label:'Arithmetic', about:'about-arithmetic', domain:'core'},
                {slug:'pre-algebra', label:'Pre-Algebra', about:'about-pre-algebra', domain:'core'},
                {slug:'algebra-basics', label:'Algebra Basics', about:'about-algebra-basics', domain:'core'},
                {slug:'geometry', label:'Geometry', about:'about-geometry', domain:'core'},
                {slug:'algebra-2', label:'Algebra 2', about:'about-algebra-2', domain:'core'},
                {slug:'trigonometry', label:'Trigonometry', about:'about-trigonometry', domain:'core'},
                {slug:'pre-calculus', label:'Pre-Calculus', about:'about-pre-calculus', domain:'core'},
                {slug:'calculus-1', label:'Calculus 1', about:'about-calculus-1', domain:'core'},
                {slug:'calculus-2', label:'Calculus 2', about:'about-calculus-2', domain:'core'},
                {slug:'calculus-3', label:'Calculus 3', about:'about-calculus-3', domain:'core'},
                {slug:'linear-algebra', label:'Linear Algebra', about:'about-linear-algebra', domain:'core'},
                {slug:'differential-equations', label:'Differential Equations', about:'about-differential-equations', domain:'core'},
                {slug:'discrete-mathematics', label:'Discrete Mathematics', about:'about-discrete-mathematics', domain:'core'},
                {slug:'statistics', label:'Statistics', about:'about-statistics', domain:'core'},
                {slug:'abstract-algebra', label:'Abstract Algebra', about:'about-abstract-algebra', domain:'core'},
                {slug:'real-analysis', label:'Real Analysis', about:'about-real-analysis', domain:'core'},
                {slug:'complex-analysis', label:'Complex Analysis', about:'about-complex-analysis', domain:'core'},
                {slug:'topology', label:'Topology', about:'about-topology', domain:'core'},
                {slug:'applied/2d-game-development', label:'2D Game Development', about:'about-2d-game-development', domain:'applied'},
                {slug:'applied/3d-game-development', label:'3D Game Development', about:'about-3d-game-development', domain:'applied'}
              ];
              var domains = [
                {key:'core', label:'Core Mathematics', href:'/core-mathematics/'},
                {key:'applied', label:'Applied Mathematics', href:'/applied-mathematics/'}
              ];
              var path = window.location.pathname.replace(/^\\//, '').replace(/\\/$/, '');
              var pathParts = path.split('/');
              /* Applied tracks are two segments deep, Core subjects one. */
              var currentSection = (pathParts[0] === 'applied' && pathParts.length > 2
                ? pathParts[0] + '/' + pathParts[1]
                : pathParts[0]) || '';

              /* Every link for one subject, in sidebar order, each appearing exactly once.

                 This used to walk each <details> group in turn and collect the matching links inside
                 it. That double-counts anything nested, because querySelectorAll searches all
                 descendants: an Applied Section sits inside its Part group, which sits inside the
                 module group, so every Section was collected once per ancestor and the panel listed
                 the whole module twice. Core subjects autogenerate a single flat group and have no
                 nesting, which is why only Applied looked wrong.

                 One scan of the sidebar plus a set of hrefs already seen removes the whole class of
                 problem, however deeply the sidebar nests. Scoped to the sidebar so the prev/next
                 pagination links in the page body cannot be picked up as chapters. */
              function getLessons(slug) {
                var scope = document.querySelector('nav.sidebar-content')
                  || document.querySelector('nav[aria-label="Main"]')
                  || document.querySelector('nav');
                if (!scope) return [];
                var items = [];
                var seen = {};
                scope.querySelectorAll('a[href*="/' + slug + '/"]').forEach(function(a) {
                  var href = a.getAttribute('href');
                  var text = a.textContent.trim();
                  if (!href || !text || seen[href]) return;
                  seen[href] = true;
                  items.push({href: href, text: text});
                });
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

              /* The desktop nav is hidden on mobile, so the two top-level hubs and
                 About need a home. This panel is the only always-reachable menu. */
              var hubs = document.createElement('div');
              hubs.className = 'msw-hub-links';
              [
                {href: '/core-mathematics/', label: 'Core Mathematics'},
                {href: '/applied-mathematics/', label: 'Applied Mathematics'},
                {href: '/about/', label: 'About'}
              ].forEach(function(h) {
                var a = document.createElement('a');
                a.href = h.href;
                a.className = 'msw-hub-link';
                a.textContent = h.label;
                if (path === h.href.replace(/^\\//, '').replace(/\\/$/, '')) a.classList.add('current');
                hubs.appendChild(a);
              });
              panel.appendChild(hubs);

              var expandedSlug = null;
              /* The row for the subject the reader is already inside, if any. */
              var activeRow = null;

              /* Build one subject's lesson links, once, by scraping Starlight's sidebar. */
              function populateLessons(s, lessonList) {
                if (lessonList.dataset.loaded) return;
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
                    var a = document.createElement('a');
                    a.href = l.href;
                    a.className = 'msw-lesson-link';
                    if (path === l.href.replace(/^\\//, '').replace(/\\/$/, '')) a.classList.add('current');
                    var textSpan = document.createElement('span');
                    textSpan.className = 'msw-link-text';
                    textSpan.textContent = l.text;
                    a.appendChild(textSpan);
                    /* Add checkmark if perfect score in localStorage */
                    var lSlug = l.href.replace(/^\\//, '').replace(/\\/$/, '').split('/').pop();
                    if (lSlug && localStorage.getItem('mbu-perfect-' + lSlug)) {
                      var ck = document.createElement('span');
                      ck.className = 'sidebar-check';
                      ck.textContent = '\u2705';
                      ck.title = 'Perfect score!';
                      a.appendChild(ck);
                    }
                    a.addEventListener('click', function() { close(); });
                    lessonList.appendChild(a);
                  });
                }
                lessonList.dataset.loaded = '1';
              }

              function collapseAll() {
                panel.querySelectorAll('.msw-lessons.open').forEach(function(el) { el.classList.remove('open'); });
                panel.querySelectorAll('.msw-subject-btn.expanded').forEach(function(el) { el.classList.remove('expanded'); });
              }

              /* Open one subject, collapsing any other. The scroll flag is false during setup, when
                 the panel is still display:none and scrolling it would do nothing useful.
                 Note: no backticks in these comments - the whole script is a template literal. */
              function expandRow(s, btn, lessonList, scroll) {
                collapseAll();
                populateLessons(s, lessonList);
                lessonList.classList.add('open');
                btn.classList.add('expanded');
                expandedSlug = s.slug;
                if (scroll) setTimeout(function() { btn.scrollIntoView({behavior:'smooth', block:'nearest'}); }, 50);
              }

              function addSubjectRow(s) {
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
                  expandRow(s, btn, lessonList, true);
                });

                row.appendChild(btn);
                row.appendChild(lessonList);
                panel.appendChild(row);

                if (s.slug === currentSection) activeRow = {s: s, btn: btn, list: lessonList};
              }

              /* One heading per domain, so Core's subjects and Applied's modules read as two lists
                 rather than one pile. A plain label rather than a link: the hub buttons at the top of
                 the panel already go to those two pages, and a second identical link here would be
                 both redundant and ambiguous about which one to press. */
              domains.forEach(function(d) {
                var heading = document.createElement('div');
                heading.className = 'msw-group-heading';
                heading.textContent = d.label;
                panel.appendChild(heading);

                subjects.forEach(function(s) {
                  if (s.domain === d.key) addSubjectRow(s);
                });
              });

              /* Open the subject the reader is already in. Without this the panel always opened
                 collapsed, so reaching the next chapter of the subject you are standing in meant
                 finding that subject in a list of twenty and expanding it again, every time. */
              if (activeRow) expandRow(activeRow.s, activeRow.btn, activeRow.list, false);

              document.body.appendChild(panel);

              var fab = document.createElement('button');
              fab.className = 'mobile-subject-fab';
              fab.setAttribute('aria-label', 'Switch subject');
              var menuIcon = '<svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>';
              var closeIcon = '<svg viewBox="0 0 24 24"><path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/></svg>';
              fab.innerHTML = menuIcon + '<span class="fab-label">Subjects</span>';
              document.body.appendChild(fab);

              /* Scroll the panel so the reader's own chapter is the thing they see first.
                 The expanded subject may sit well down a list of twenty, so opening at the top
                 would still cost a scroll to find where you already are. */
              function revealCurrent() {
                var target = panel.querySelector('.msw-lesson-link.current')
                  || panel.querySelector('.msw-subject-btn.active');
                if (!target) return;
                setTimeout(function() {
                  var panelBox = panel.getBoundingClientRect();
                  var targetBox = target.getBoundingClientRect();
                  /* Leave a little above it so the subject heading stays in view for context. */
                  panel.scrollTop += (targetBox.top - panelBox.top) - 90;
                }, 40);
              }

              var isOpen = false;
              function toggle() {
                isOpen = !isOpen;
                panel.classList.toggle('open', isOpen);
                overlay.classList.toggle('open', isOpen);
                fab.innerHTML = isOpen
                  ? closeIcon + '<span class="fab-label">Close</span>'
                  : menuIcon + '<span class="fab-label">Subjects</span>';
                if (isOpen) revealCurrent();
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
              footer.innerHTML = '\\u270F\\uFE0F Grab some scratch paper and work the problems out by hand - it makes a huge difference.';
              document.body.appendChild(footer);
            });
          `,
        },
        {
          tag: "script",
          content: `
            /* Feature: Track Last Visited Lesson */
            document.addEventListener('DOMContentLoaded', function() {
              var path = window.location.pathname.replace(/^\\//, '').replace(/\\/$/, '');
              var parts = path.split('/');
              if (parts.length < 2 || !parts[1]) return;
              var section = parts[0] === 'applied' && parts.length > 2
                ? parts[0] + '/' + parts[1]
                : parts[0];
              var sectionMap = {
                'applied/2d-game-development': '2D Game Development',
                'applied/3d-game-development': '3D Game Development',
                'arithmetic': 'Arithmetic',
                'pre-algebra': 'Pre-Algebra',
                'algebra-basics': 'Algebra Basics',
                'geometry': 'Geometry',
                'algebra-2': 'Algebra 2',
                'trigonometry': 'Trigonometry',
                'pre-calculus': 'Pre-Calculus',
                'calculus-1': 'Calculus 1',
                'calculus-2': 'Calculus 2',
                'calculus-3': 'Calculus 3',
                'linear-algebra': 'Linear Algebra',
                'differential-equations': 'Differential Equations',
                'discrete-mathematics': 'Discrete Mathematics',
                'statistics': 'Statistics',
                'abstract-algebra': 'Abstract Algebra',
                'real-analysis': 'Real Analysis',
                'complex-analysis': 'Complex Analysis',
                'topology': 'Topology'
              };
              var subject = sectionMap[section];
              if (!subject) return;
              var h1 = document.querySelector('h1');
              var rawTitle = h1 ? h1.textContent.trim() : parts[parts.length - 1];
              var title = rawTitle.split(' - ')[0].split(' | ')[0];
              var data = {
                href: '/' + path + '/',
                title: title,
                subject: subject,
                timestamp: Date.now()
              };
              try { localStorage.setItem('mbu-last-lesson', JSON.stringify(data)); } catch(e) {}
            });
          `,
        },
        {
          tag: "script",
          content: `
            /* Feature: Continue Learning Banner (homepage) + Progress Bar Fill.
               The subject cards moved to /core-mathematics/, so the fill has to run
               there as well as on the homepage, or every bar would sit at zero. */
            document.addEventListener('DOMContentLoaded', function() {
              var path = window.location.pathname.replace(/^\\//, '').replace(/\\/$/, '');
              var isHome = path === '' || path === 'index';
              var isCoreHub = path === 'core-mathematics';
              if (!isHome && !isCoreHub) return;

              /* --- Continue Learning Banner (homepage only) --- */
              if (isHome) try {
                var raw = localStorage.getItem('mbu-last-lesson');
                if (raw) {
                  var data = JSON.parse(raw);
                  var age = Date.now() - (data.timestamp || 0);
                  var thirtyDays = 30 * 24 * 60 * 60 * 1000;
                  if (age < thirtyDays && data.href && data.title && data.subject) {
                    /* Sit just above the progress call-to-action, which puts the
                       banner below the two path cards rather than above them. */
                    var heading = document.querySelector('.progress-cta') || document.querySelector('h2');
                    if (heading) {
                      var banner = document.createElement('a');
                      banner.className = 'continue-banner';
                      banner.href = data.href;

                      /* Determine accent color from subject level */
                      var levelMap = {
                        'applied': 'applied',
                        'arithmetic': 'foundations',
                        'pre-algebra': 'foundations',
                        'algebra-basics': 'foundations',
                        'geometry': 'intermediate',
                        'algebra-2': 'intermediate',
                        'trigonometry': 'intermediate',
                        'pre-calculus': 'advanced',
                        'calculus-1': 'advanced',
                        'calculus-2': 'advanced',
                        'calculus-3': 'expert',
                        'linear-algebra': 'expert',
                        'differential-equations': 'expert',
                        'discrete-mathematics': 'expert',
                        'statistics': 'expert',
                        'abstract-algebra': 'expert',
                        'real-analysis': 'expert',
                        'complex-analysis': 'expert',
                        'topology': 'expert'
                      };
                      var colorMap = {
                        'foundations': '#7ee787',
                        'intermediate': '#d2a8ff',
                        'advanced': '#58a6ff',
                        'expert': '#f0883e',
                        'applied': '#39d3c3'
                      };
                      var slug = data.href.replace(/^\\//, '').split('/')[0];
                      var level = levelMap[slug] || 'advanced';
                      var accentColor = colorMap[level] || '#58a6ff';
                      banner.style.borderLeftColor = accentColor;

                      banner.innerHTML = '<div class="continue-banner-text">'
                        + '<div class="continue-banner-subject">' + data.subject + '</div>'
                        + '<div class="continue-banner-title">' + data.title + '</div>'
                        + '</div>'
                        + '<span class="continue-banner-arrow" style="color:' + accentColor + '">Continue \\u2192</span>';
                      heading.parentNode.insertBefore(banner, heading);
                    }
                  }
                }
              } catch(e) {}

              /* --- Progress Bar Fill --- */
              var cards = document.querySelectorAll('.subject-card[data-slug]');
              cards.forEach(function(card) {
                var slug = card.getAttribute('data-slug');
                if (!slug) return;

                /* Collect all lesson slugs for this subject from sidebar nav */
                var lessonSlugs = [];
                document.querySelectorAll('nav a[href*="/' + slug + '/"]').forEach(function(a) {
                  var href = a.getAttribute('href') || '';
                  var ls = href.replace(/^\\//, '').replace(/\\/$/, '').split('/').pop();
                  if (ls) lessonSlugs.push(ls);
                });

                /* If sidebar is not available (homepage may not render full sidebar), 
                   fall back to scanning localStorage keys that start with mbu-perfect- 
                   and match the subject slug in the key's origin path */
                if (lessonSlugs.length === 0) {
                  /* Fallback: count all mbu-perfect-* keys; we cannot attribute them to subjects without sidebar links */
                  return;
                }

                /* Count completed lessons */
                var completed = 0;
                lessonSlugs.forEach(function(ls) {
                  if (localStorage.getItem('mbu-perfect-' + ls)) completed++;
                });

                if (completed === 0) return;

                var total = lessonSlugs.length;
                var pct = Math.round((completed / total) * 100);

                var progressBar = card.querySelector('.subject-progress');
                var progressFill = card.querySelector('.subject-progress-fill');
                if (progressBar && progressFill) {
                  progressBar.style.display = 'block';
                  progressFill.style.width = pct + '%';
                  /* Color based on progress: blue → green → gold */
                  if (pct >= 100) {
                    progressFill.style.background = '#7ee787';
                  } else if (pct >= 50) {
                    progressFill.style.background = '#58a6ff';
                  } else {
                    progressFill.style.background = '#f0883e';
                  }
                }

                /* Update the lessons badge to show completion count */
                var badge = card.querySelector('.subject-lessons-badge');
                if (badge) {
                  badge.textContent = completed + '/' + total + ' complete';
                }
              });
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
