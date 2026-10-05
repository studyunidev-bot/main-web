# URL delta vs prior 76 HTML /th URLs

Prior QA crawl counted HTTP 200 HTML documents, including noindex utilities.

## Changed after cleanup + copy-repo gate

| URL | Before | After | Reason |
| --- | --- | --- | --- |
| /th/portfolio/aptaglabel.com | 200 noindex | 404 | Proxy dotted-slug 404 |
| /th/portfolio/boomsmartsolution.com | 200 noindex | 404 | same |
| /th/portfolio/estate818.com | 200 noindex | 404 | same |
| /th/portfolio/mittrathaiphone.com | 200 noindex | 404 | same |
| /th/portfolio/thaibusinessmate.com | 200 noindex | 404 | same |
| /th/portfolio/wm-manitthakant-transport.com | 200 noindex | 404 | same |
| /th/product/spider-man-backpack | 200 noindex (demo) | 404 | Row deleted + real notFound status |

```text
Original: 76 HTML 200
Removed intentionally: 7 (6 dotted + 1 demo product)
Added: 0
Current valid indexable/public money+CMS: unchanged owners + published content
404: the 7 above + any other missing DB slug
Redirect: legacy map unchanged
Noindex: /workflow, account/cart/checkout utilities unchanged
```

If a future crawl counts only HTTP 200 HTML: expect **69** (76 − 7), plus normal utility noindex pages still at 200.
