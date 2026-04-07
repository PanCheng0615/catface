import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FE = path.join(__dirname, "..");
const NEW = path.join(FE, "NEW_UI", "index.html");
const OLD_FB = path.join(FE, "pages", "cat-facebook.html");
const OUT = path.join(FE, "pages", "cat-facebook.html");

const old = fs.readFileSync(OLD_FB, "utf8");
const overlayCssStart = old.indexOf("    .overlay {");
const overlayCssEnd = old.indexOf("  </style>", overlayCssStart);
const overlayCss = old.slice(overlayCssStart, overlayCssEnd);

const ohStart = old.indexOf('<section class="overlay" id="createOverlay"');
const ohEnd = old.indexOf("<script src=", ohStart);
const overlaysHtml = old.slice(ohStart, ohEnd).trimEnd();

const injectCss =
  `
    .feed-nav button.ftab { border: none; background: transparent; font: inherit; width: 100%; margin: 0; }
    #feed { display: flex; flex-direction: column; min-height: 120px; }
    #feed .feed-status, #feed .feed-empty { text-align: center; padding: 48px 20px; font-size: 14px; color: var(--text-muted); }
` + overlayCss;

const raw = fs.readFileSync(NEW, "utf8");
const lines = raw.split(/(?<=\n)/);

const head = lines.slice(0, 291).join("") + injectCss + lines.slice(291, 293).join("");

let nav = lines.slice(296, 323).join("");
nav = nav.replace(/location\.href='log-in\.html'/g, "location.href='/pages/log-in.html'");
nav = nav.replace(/location\.href='adoption\.html'/g, "location.href='/pages/adoption.html'");
nav = nav.replace(/location\.href='notifications\.html'/g, "location.href='/pages/notifications.html'");
nav = nav.replace(/location\.href='account\.html'/g, "location.href='/pages/account.html'");
nav = nav.replace(
  '<button class="btn-new-post" onclick="openNewPost()">+ New Post</button>',
  '<button type="button" class="btn-new-post" id="btnCreatePost">+ New Post</button>'
);
nav = nav.replace(
  "</nav>",
  '<a href="/pages/log-in.html" class="login-btn" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)" tabindex="-1" aria-hidden="true">Log in</a>\n  </nav>'
);

let center = lines.slice(328, 382).join("");
center = center.replace(
  `    <div class="feed-header">
      <div class="ftab active">For You</div>
      <div class="ftab">Following</div>
      <div class="ftab">Trending</div>
    </div>`,
  `    <div class="feed-header feed-nav">
      <button type="button" class="ftab active" data-feed="recommended">For You</button>
      <button type="button" class="ftab" data-feed="followed">Following</button>
      <button type="button" class="ftab" data-feed="trending">Trending</button>
    </div>`
);
center = center.replace(
  '<div class="composer">',
  '<div class="composer" id="openCreateFromQuick" tabindex="0" role="button" aria-label="Compose post">'
);
center = center.replace(/src="assets\//g, 'src="../assets/');

const feedBlock = '    <div id="feed"></div>\n  </div><!-- end #view-feed -->\n\n';

let right = lines.slice(583, 608).join("");
right = right.replace(/src="assets\//g, 'src="../assets/');
right = right.replace(
  /onclick="location\.href='account\.html'"/g,
  `onclick="location.href='/pages/account.html'"`
);

const html =
  head +
  "<body>\n" +
  '<div class="layout">\n' +
  nav +
  "  <!-- CENTER -->\n" +
  '  <div class="center">\n' +
  '  <div id="view-feed">\n' +
  center +
  feedBlock +
  "  </div><!-- end .center -->\n\n" +
  right +
  "</div>\n" +
  overlaysHtml +
  '\n\n  <script src="../js/config.js"></script>\n' +
  '  <script src="../js/community.js"></script>\n' +
  "</body>\n</html>\n";

fs.writeFileSync(OUT, html, "utf8");
console.log("Wrote", OUT);
