<?php
/**
 * REALISE static content, from the design (REALISEWebsite.html).
 *
 * Used where there is no CMS model for the content (countries on the globe,
 * work packages, objectives) and as the fallback when a CMS table is still
 * empty (partners, contacts). Pages pull it in from their code section:
 *
 *     $data = include themes_path($this->getTheme()->getDirName() . '/meta/realise-data.php');
 *
 * $asset() below turns a path under assets/realise/ into a full URL.
 */

$asset = function ($path) {
    return url('themes/' . \Cms\Classes\Theme::getActiveThemeCode() . '/assets/realise/' . $path);
};

$partners = [
    ['id' => 'know', 'logo' => 'logos/know.svg', 'short' => 'KNOW', 'code' => 'AT', 'country' => 'Austria', 'name' => 'Know Center Research GmbH', 'role' => 'Project coordinator', 'url' => 'https://www.know-center.at/', 'paras' => [
        'Know Center is one of Europe’s leading research centres for data-driven business and artificial intelligence, based in Graz, Austria.',
        'Its teams combine data science, machine learning and research on open and responsible science, bridging academic research and applied innovation.']],
    ['id' => 'ulei', 'logo' => 'logos/ulei.png', 'short' => 'ULEI', 'code' => 'NL', 'country' => 'Netherlands', 'name' => 'Universiteit Leiden', 'role' => 'Partner', 'url' => 'https://www.universiteitleiden.nl/', 'paras' => [
        'Founded in 1575, Leiden University is the oldest university in the Netherlands and a broad research university with seven faculties.',
        'Its Centre for Science and Technology Studies (CWTS) is internationally recognised for research on science metrics, research evaluation and science policy.']],
    ['id' => 'sru', 'logo' => 'logos/sru.png', 'short' => 'SRU', 'code' => 'NL', 'country' => 'Netherlands', 'name' => 'Stichting Radboud Universiteit', 'role' => 'Partner', 'url' => 'https://www.ru.nl/', 'paras' => [
        'Radboud University in Nijmegen is a broad, research-intensive university with a strong commitment to open science and societal impact.',
        'It brings expertise in meta-research, research integrity and the evaluation of academic practices.']],
    ['id' => 'uedin', 'logo' => 'logos/uedin.png', 'short' => 'UEDIN', 'code' => 'UK', 'country' => 'United Kingdom', 'name' => 'The University of Edinburgh', 'role' => 'Partner', 'url' => 'https://www.ed.ac.uk/', 'paras' => [
        'The University of Edinburgh is one of the world’s leading research universities, founded in 1583.',
        'Its researchers work across evidence synthesis, research on research and the use of AI methods to support systematic reviews.']],
    ['id' => 'csic', 'logo' => 'logos/csic.png', 'logo_h' => '48px', 'short' => 'CSIC', 'code' => 'ES', 'country' => 'Spain', 'name' => 'Agencia Estatal Consejo Superior de Investigaciones Científicas', 'role' => 'Partner', 'url' => 'https://www.csic.es/', 'paras' => [
        'CSIC is Spain’s largest public research organisation, with institutes covering the full spectrum of scientific disciplines.',
        'Its science-policy and information-science groups study research systems, scholarly communication and evaluation practices.']],
    ['id' => 'ucoimbra', 'logo' => 'logos/ucoimbra.png', 'short' => 'UCOIMBRA', 'code' => 'PT', 'country' => 'Portugal', 'name' => 'Universidade de Coimbra', 'role' => 'Partner', 'url' => 'https://www.uc.pt/', 'paras' => [
        'The University of Coimbra, founded in 1290, is one of the oldest universities in Europe and a UNESCO World Heritage site.',
        'It contributes social-science research on higher education, research careers and institutional change.']],
    ['id' => 'tsv', 'logo' => 'logos/tsv.png', 'short' => 'TSV', 'code' => 'FI', 'country' => 'Finland', 'name' => 'Tieteellisten Seurain Valtuuskunta', 'role' => 'Partner', 'url' => 'https://tsv.fi/', 'paras' => [
        'The Federation of Finnish Learned Societies (TSV) represents more than 280 learned societies and promotes open science and responsible research assessment in Finland.',
        'TSV coordinates national work on research evaluation recommendations and science communication.']],
    ['id' => 'swps', 'logo' => 'logos/swps.png', 'short' => 'SWPS', 'code' => 'PL', 'country' => 'Poland', 'name' => 'Uniwersytet SWPS', 'role' => 'Partner', 'url' => 'https://english.swps.pl/', 'paras' => [
        'SWPS University is a leading Polish university in the social sciences and humanities, with campuses across Poland.',
        'Its researchers bring expertise in psychology, behavioural science and experimental methods.']],
    ['id' => 'pensoft', 'logo' => 'logos/pensoft.svg', 'logo_h' => '40px', 'short' => 'PENSOFT', 'code' => 'BG', 'country' => 'Bulgaria', 'name' => 'Pensoft Publishers', 'role' => 'Partner', 'url' => 'https://pensoft.net/', 'paras' => [
        'Pensoft is an independent academic publisher based in Sofia, known for innovation in open-access and semantic publishing.',
        'It leads communication, dissemination and engagement activities and brings experience from many EU-funded research projects.']],
];
foreach ($partners as &$p) {
    $p['logo'] = $asset($p['logo']);
    $p['logo_h'] = isset($p['logo_h']) ? $p['logo_h'] : '64px';
    $p['content'] = '<p>' . implode('</p><p>', $p['paras']) . '</p>';
}
unset($p);

$countries = [
    ['id' => 'at', 'flag' => 'at', 'code' => 'AT', 'name' => 'Austria', 'lat' => 47.07, 'lon' => 15.44, 'orgs' => [['name' => 'Know Center Research GmbH', 'short' => 'KNOW', 'role' => 'Coordinator']]],
    ['id' => 'nl', 'flag' => 'nl', 'code' => 'NL', 'name' => 'Netherlands', 'lat' => 52.0, 'lon' => 5.1, 'orgs' => [['name' => 'Universiteit Leiden', 'short' => 'ULEI'], ['name' => 'Stichting Radboud Universiteit', 'short' => 'SRU']]],
    ['id' => 'uk', 'flag' => 'gb', 'code' => 'UK', 'name' => 'United Kingdom', 'lat' => 55.95, 'lon' => -3.19, 'orgs' => [['name' => 'The University of Edinburgh', 'short' => 'UEDIN']]],
    ['id' => 'es', 'flag' => 'es', 'code' => 'ES', 'name' => 'Spain', 'lat' => 40.42, 'lon' => -3.70, 'orgs' => [['name' => 'Agencia Estatal Consejo Superior de Investigaciones Científicas', 'short' => 'CSIC']]],
    ['id' => 'pt', 'flag' => 'pt', 'code' => 'PT', 'name' => 'Portugal', 'lat' => 40.2, 'lon' => -8.42, 'orgs' => [['name' => 'Universidade de Coimbra', 'short' => 'UCOIMBRA']]],
    ['id' => 'fi', 'flag' => 'fi', 'code' => 'FI', 'name' => 'Finland', 'lat' => 60.17, 'lon' => 24.94, 'orgs' => [['name' => 'Tieteellisten Seurain Valtuuskunta', 'short' => 'TSV']]],
    ['id' => 'pl', 'flag' => 'pl', 'code' => 'PL', 'name' => 'Poland', 'lat' => 52.23, 'lon' => 21.01, 'orgs' => [['name' => 'Uniwersytet SWPS', 'short' => 'SWPS University']]],
    ['id' => 'bg', 'flag' => 'bg', 'code' => 'BG', 'name' => 'Bulgaria', 'lat' => 42.70, 'lon' => 23.32, 'orgs' => [['name' => 'Pensoft Publishers', 'short' => 'PENSOFT']]],
];
foreach ($countries as &$c) {
    $c['flag'] = $asset('flags/' . $c['flag'] . '.png');
    $c['orgShort'] = implode(', ', array_map(function ($o) {
        return $o['short'] . (isset($o['role']) ? ' · ' . $o['role'] : '');
    }, $c['orgs']));
}
unset($c);

return [
    'asset' => $asset,

    // Media Centre sections not published yet. While false, the section and
    // its tab are left out of /media-center, out of site search, and the
    // Newsletter page's "Read past issues" link is hidden. Set to true to
    // bring them back - content stays in Pensoft.Media meanwhile.
    'media_sections' => [
        'newsletters' => false,
        'press' => false,
    ],
    'partners' => $partners,
    'countries' => $countries,

    // Globe pin positions by ISO 3166 alpha-2 code (Pensoft.Partners has no
    // coordinates). A partner country missing here is still listed but gets
    // no pin - add its lat/lon to show it on the globe.
    'country_geo' => [
        'AT' => [47.07, 15.44], 'NL' => [52.0, 5.1], 'GB' => [55.95, -3.19], 'ES' => [40.42, -3.70],
        'PT' => [40.2, -8.42], 'FI' => [60.17, 24.94], 'PL' => [52.23, 21.01], 'BG' => [42.70, 23.32],
        'BE' => [50.85, 4.35], 'DE' => [52.52, 13.40], 'FR' => [48.86, 2.35], 'IT' => [41.90, 12.50],
        'IE' => [53.35, -6.26], 'DK' => [55.68, 12.57], 'SE' => [59.33, 18.07], 'NO' => [59.91, 10.75],
        'CZ' => [50.08, 14.44], 'SK' => [48.15, 17.11], 'HU' => [47.50, 19.04], 'RO' => [44.43, 26.10],
        'GR' => [37.98, 23.73], 'HR' => [45.81, 15.98], 'SI' => [46.06, 14.51], 'CH' => [46.95, 7.45],
        'EE' => [59.44, 24.75], 'LV' => [56.95, 24.11], 'LT' => [54.69, 25.28], 'CY' => [35.17, 33.36],
        'LU' => [49.61, 6.13], 'MT' => [35.90, 14.51],
    ],
    // Display code differs from ISO for the UK (the design shows "UK").
    'country_display' => ['GB' => 'UK'],
    // Logos that are visually larger than the rest at the default 64px.
    'logo_heights' => ['CSIC' => '48px', 'PENSOFT' => '40px'],

    // About > "What will we do?": icon per deliverable, by position. The
    // deliverable texts are Pensoft.Jumbotron entries about-deliverable-N.
    'deliverable_icons' => [
        'M12 8V4H8M6 8h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM2 14h2M20 14h2M15 13v2M9 13v2',
        'M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2M6.453 15h11.094M8.5 2h7',
        'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4',
        'M3 17l2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8',
    ],

    'contacts' => [
        ['name' => 'Tony Ross-Hellauer', 'role' => 'Project coordinator', 'email' => 'tross@know-center.at', 'photo' => $asset('img/contact-tony.png')],
        ['name' => 'Klaudia Neuhold', 'role' => 'Project manager', 'email' => 'kneuhold@know-center.at', 'photo' => $asset('img/contact-klaudia.png')],
    ],
];
