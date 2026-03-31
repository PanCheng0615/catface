# One-off builder: merges NEW_UI shell + API overlays into pages/cat-facebook.html
from pathlib import Path

FE = Path(__file__).resolve().parent.parent
NEW = FE / "NEW_UI" / "index.html"
OLD_FB = FE / "pages" / "cat-facebook.html"
OUT = FE / "pages" / "cat-facebook.html"

old = OLD_FB.read_text(encoding="utf-8")
overlay_css_start = old.find("    .overlay {")
overlay_css_end = old.find("  </style>", overlay_css_start)
overlay_css = old[overlay_css_start:overlay_css_end]

oh_start = old.find('<section class="overlay" id="createOverlay"')
oh_end = old.find("<script src=", oh_start)
overlays_html = old[oh_start:oh_end].rstrip()

inject_css = """
    .feed-nav button.ftab { border: none; background: transparent; font: inherit; width: 100%; margin: 0; }
    #feed { display: flex; flex-direction: column; min-height: 120px; }
    #feed .feed-status, #feed .feed-empty { text-align: center; padding: 48px 20px; font-size: 14px; color: var(--text-muted); }
""" + overlay_css

lines = NEW.read_text(encoding="utf-8").splitlines(keepends=True)
# 1-291 (0:291), inject before </style> at index 291
head = "".join(lines[0:291]) + inject_css + "".join(lines[291:293])

nav = "".join(lines[296:323])  # <!-- LEFT NAV --> … </nav>
nav = nav.replace("location.href='log-in.html'", "location.href='/pages/log-in.html'")
nav = nav.replace("location.href='adoption.html'", "location.href='/pages/adoption.html'")
nav = nav.replace("location.href='notifications.html'", "location.href='/pages/notifications.html'")
nav = nav.replace("location.href='account.html'", "location.href='/pages/account.html'")
nav = nav.replace(
    '<button class="btn-new-post" onclick="openNewPost()">+ New Post</button>',
    '<button type="button" class="btn-new-post" id="btnCreatePost">+ New Post</button>',
)
nav = nav.replace(
    "</nav>",
    '<a href="/pages/log-in.html" class="login-btn" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)" tabindex="-1" aria-hidden="true">Log in</a>\n  </nav>',
    1,
)

# NEW_UI lines 329–382: feed-header … chips-row (inside #view-feed)
center = "".join(lines[328:382])
center = center.replace(
    """    <div class="feed-header">
      <div class="ftab active">For You</div>
      <div class="ftab">Following</div>
      <div class="ftab">Trending</div>
    </div>""",
    """    <div class="feed-header feed-nav">
      <button type="button" class="ftab active" data-feed="recommended">For You</button>
      <button type="button" class="ftab" data-feed="followed">Following</button>
      <button type="button" class="ftab" data-feed="trending">Trending</button>
    </div>""",
)
center = center.replace(
    '<div class="composer">',
    '<div class="composer" id="openCreateFromQuick" tabindex="0" role="button" aria-label="Compose post">',
    1,
)
center = center.replace('src="assets/', 'src="../assets/')

feed_block = '    <div id="feed"></div>\n  </div><!-- end #view-feed -->\n\n'

right = "".join(lines[583:608])
right = right.replace('src="assets/', 'src="../assets/')
right = right.replace(
    'onclick="location.href=\'account.html\'"',
    'onclick="location.href=\'/pages/account.html\'"',
)

html = (
    head
    + "<body>\n"
    + '<div class="layout">\n'
    + nav
    + "  <!-- CENTER -->\n"
    + "  <div class=\"center\">\n"
    + "  <div id=\"view-feed\">\n"
    + center
    + feed_block
    + "  </div><!-- end .center -->\n\n"
    + right
    + "</div>\n"
    + overlays_html
    + "\n\n  <script src=\"../js/config.js\"></script>\n"
    + '  <script src="../js/community.js"></script>\n'
    + "</body>\n</html>\n"
)

OUT.write_text(html, encoding="utf-8")
print("Wrote", OUT)
