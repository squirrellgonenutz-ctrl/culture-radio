# Station provenance

Checked 29 September 2026. All eight chosen HTTPS endpoints returned HTTP 200, audio content types and non-empty stream bytes. Rates below come from the server's `icy-br` header; this is transport verification, not a listening-quality guarantee or confirmation of perpetual availability.

| Station | Direct stream | Response | Source |
|---|---|---|---|
| Flex FM 101.4 | https://stream.cotswoldgrp.com:8021/flex | MP3, 320 kbps, icy-name Flex FM | [Station's September update](https://tingfm.com/contact), posted by Flex; [official site](https://flexfm.co.uk/) |
| Centreforce 883 | https://listen2.centreforceradio.com:8830/192 | MP3, 192 kbps, icy-name Centreforce 192 | [Official player](https://centreforceradio.com/), audio source in page |
| Rinse FM | https://admin.stream.rinse.fm/proxy/rinse_uk/stream | AAC, 128 kbps, icy-name Rinse FM | [Official site](https://www.rinse.fm/), player data |
| Kool FM | https://admin.stream.rinse.fm/proxy/kool/stream | AAC, 128 kbps, icy-name Kool FM 8 | [Official channel](https://www.rinse.fm/channels/kool/), player data |
| Point Blank Radio | https://pointblankradio.co.uk/stream.mp3 | MP3, 128 kbps, icy-name Point Blank FM | [Official site](https://www.pointblankradio.com/), player script |
| UK Bass Radio | https://ukbassradio.com/stream | MP3, 192 kbps; redirects to https://s2.ssl-stream.com/listen/uk_bass_radio/stream | [Official listening options](https://www.ukbassradio.com/listening-options/) |
| Eruption Radio | https://cosmo.shoutca.st/proxy/eruptionradio/stream | MP3, 320 kbps, icy-name Eruption Radio UK 320K | [Official listening options](https://www.eruptionradio.uk/site/listen/) and current website player |
| Sub FM | https://fmsub.radioca.st/Sub.FM | MP3, 192 kbps, icy-name Sub FM | [Official playlist](https://www.sub.fm/listen.pls), tested HTTPS equivalent |

Point Blank's alternative `https://stream.pointblankradio.com/pbr128` returned 404 and is not shipped. The chosen stream currently advertises 128 kbps, unlike the earlier conversation's 320 kbps claim. Select Radio remains excluded as requested.

Artwork sources, downloaded locally to avoid hotlink failures and enable offline display:

- Flex: official [Linktree](https://linktr.ee/flexfmuk) profile image (`ugc.production.linktr.ee/32b79d0c-585d-4251-b0c2-a05ccc4da4b0_FLEX-F-16-01.png`).
- Centreforce: `https://centreforceradio.com/883white.png`.
- Rinse and Kool: station logo SVGs in their respective official pages listed above.
- Point Blank: `https://www.pointblankradio.com/Landscape_Logo_Red_on_Transparent.webp`.
- UK Bass: `https://www.ukbassradio.com/wp-content/uploads/2024/01/IMG-20240129-WA0020-removebg-preview.png`.
- Eruption: `https://www.eruptionradio.uk/site/wp-content/uploads/2024/01/logomain.png`.
- Sub: `https://www.sub.fm/wp-content/uploads/2020/11/subfm350-1.png`.

Station artwork is third-party branding, not newly designed Culture Radio branding. Genres describe a station's broad programming, not the show currently on air.
