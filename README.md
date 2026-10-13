# REALISE website theme

October CMS theme for the REALISE project website (realise.pensoft.com), built
by Pensoft from the REALISE website design.

## Structure

- `layouts/default.htm` – page shell: header, footer, and the inner-page hero
  for content pages that are not individually designed.
- `pages/` – home, about, partners, news, events, library, media centre,
  contact, newsletter, and the content pages (privacy, accessibility, ...).
- `partials/realise/` – shared pieces (page hero, news card, icons, socials,
  subscribe link). `partials/site/` – header and footer.
- `partials/menu/default.htm` – Menu Manager template for the header nav.
- `partials/librarypage/templates/template5.htm` – library document card.
- `meta/realise-data.php` – static data with no CMS model (globe
  coordinates, deliverable icons) and fallbacks.
- `assets/realise/` – the REALISE look: `css/realise.css`, `js/realise.js`,
  fonts (Plus Jakarta Sans), images, logos, flags, favicon, hero video.
- `assets/less/theme.less` – base Pensoft styles for plugin component markup
  (grid, jumbotron, library, forms); loaded before `realise.css`.

## Content

All texts and lists are managed in the backend: Pensoft.Jumbotron (homepage
and About texts, privacy and accessibility pages, footer disclaimer),
Pensoft.Partners, Pensoft.Articles, Pensoft.Calendar, Pensoft.Library,
Pensoft.Media, Pensoft.Cardprofiles, Pensoft.Accordions (work packages) and
Menu Manager (header navigation). The newsletter form is the theme setting
"Subscribe link".
