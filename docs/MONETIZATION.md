# AdSense readiness — checked 2026-10-03

Ray's confirmed goal is display-ad revenue, not purchasing Google Ads. This web
application targets AdSense; AdMob would apply to a separate native app.

Current state: **disabled, no publisher ID, no ad unit, no site approval, no revenue**.
`public/ads-config.js` is public configuration. Only `guide.html` loads the module;
the editor and either output mode never load it. Missing consent integration,
missing IDs, or `enabled: false` cause zero ad requests. This is a scaffold, not a
completed CMP integration. Do not use Auto Ads on the application origin because
they could inject units into editor/output routes.

## Practical launch sequence

1. Pick an owned domain and a hosting plan that permits monetization. The existing
   Vercel team was verified as Hobby: it is limited to non-commercial personal use.
   Keep this release ad-free. Do not upgrade, create accounts or spend funds on
   Ray's behalf. If using another existing free host, verify its current terms and
   account access first. Export browser projects before changing origins.
2. Before actual activation, host ad-bearing content on a separate origin from
   the editor: third-party scripts on the same origin could access its IndexedDB
   projects. The current same-origin scaffold is disabled and is not that isolation
   boundary. Keep tool/output pages free of ad scripts.
   Publish substantive original guides and real mapping examples with rights-cleared
   media. The included workflow guide, about/contact and privacy pages are a start,
   not a promise of approval. A utility-only or thin screen may lack inventory value.
3. Ray must supply/control the actual AdSense account and site. Connect the domain
   using Google's supplied verification mechanism, submit for review, and wait for
   approval. Do not substitute a made-up publisher ID. A verification meta tag can
   be used when offered, without loading ads into the tool.
4. Configure a Google-certified CMP and TCF integration for applicable EEA, UK and
   Switzerland traffic; implement and test privacy choices and withdrawal. Complete
   applicable regional disclosures. The placeholder `window.rayalityAdConsent`
   callback must come from a reviewed CMP adapter, not a home-made accept button.
   Until then the module remains blocked. Test denial, unknown state, consent,
   withdrawal and navigation before enabling.
5. Update privacy disclosures with actual ad partners, cookies, web beacons/IP use,
   retention/contact practices and consent controls. The current notice describes
   the ad-disabled release.
6. Create an ad unit and use the real public `ca-pub-…` and slot ID. Publish the exact
   account-provided seller entry at `/ads.txt`, verify it returns plain text with
   HTTP 200 at the final domain, and check AdSense's status. No placeholder ads.txt
   is shipped because it would not authorize a real seller.
7. Enable only the guide's separated, labeled bottom placement after these gates.
   Verify no request or ad appears in editor, output, popup, fullscreen or a
   backgrounded presentation. Avoid accidental clicks and never click your own ads.
8. Ray personally completes identity, address, tax and bank/payment verification
   required by Google. No credentials or financial documents belong in Git.

## Revenue planning

Use measured guide pageviews and observed page RPM: monthly revenue = pageviews /
1000 × page RPM. For arithmetic only, 10,000 monthly pageviews at a hypothetical
US$1–5 page RPM would be US$10–50/month; this is not a forecast or promised rate.
Count guide-page inventory only, not projector runtime. First validate usefulness,
repeat users and discoverability with useful case studies; do not buy traffic or
create filler pages to pursue approval. No analytics or tracking is installed here.

## Official sources

- [Eligibility](https://support.google.com/adsense/answer/9724): original, useful
  content and account eligibility; approval is Google's decision.
- [Publisher policies](https://support.google.com/adsense/answer/10502938): avoid
  low-value screens, intrusive placements and ads outside the user's attention;
  publish appropriate privacy disclosures.
- [Connect and review a site](https://support.google.com/adsense/answer/7584263).
- [ads.txt guide](https://support.google.com/adsense/answer/12171612).
- [Certified CMP requirements](https://support.google.com/adsense/answer/13554116).
- [Consent management](https://support.google.com/adsense/answer/7670013).
- [Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines).

繁體中文：廣告方向已確認，但本版沒有收益串接。先確認可商用的網域與託管、
內容及素材權利，再由 Ray 完成 AdSense 審核、CMP 與隱私設定、真實 ads.txt、
publisher／slot ID、稅務及收款。廣告僅規劃在教學內容頁，不放編輯器或投影端。
