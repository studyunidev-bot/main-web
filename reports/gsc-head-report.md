# GSC Head Report

Generated: 2026-06-15

This report summarizes HTTP status and key head metadata for the URLs you reported as "not indexed".

- https://thaibusinessmate.com/th
  - Status: 200
  - Title: รับเขียนโปรแกรม ทำเว็บไซต์ ขอนแก่น และทำการตลาด SEO AEO GEO ยุคใหม่ | ThaiBusinessMate
  - Meta description: ทีมผู้เชี่ยวชาญรับเขียนโปรแกรมเฉพาะธุรกิจ ทำเว็บไซต์ Next.js สปีด 100 และการตลาดดิจิทัลครบวงจร SEO/AEO/GEO ในจังหวัดขอนแก่นและภาคอีสาน
  - Robots: index, follow
  - Canonical: https://thaibusinessmate.com/th
  - Note: Responds 200 for Googlebot as well; present in sitemap.xml

- https://thaibusinessmate.com/th/services
  - Status: 200
  - Title: บริการรับเขียนโปรแกรม ขอนแก่น รับทำเว็บไซต์ SEO AEO GEO AI ทุกธุรกิจ | ThaiBusinessMate
  - Meta description: รวมบริการเขียนโปรแกรม ทำเว็บไซต์ และทำการตลาดออนไลน์ครบวงจร...
  - Robots: index, follow
  - Canonical: https://thaibusinessmate.com/th/services
  - Note: In sitemap.xml

- https://thaibusinessmate.com/en/services
  - Status: 200
  - Title: Our Custom Software & Next-Gen SEO/AEO/GEO Services in Khon Kaen | ThaiBusinessMate
  - Meta description: Discover our comprehensive custom software development, Web development, and digital marketing services in Khon Kaen...
  - Robots: index, follow
  - Canonical: https://thaibusinessmate.com/en/services
  - Note: In sitemap.xml

- Example service detail (Thai slug)
  - URL: https://thaibusinessmate.com/th/services/custom-software
  - Status: 200
  - Robots: index, follow
  - Canonical: locale-specific encoded URL
  - Note: Prerendered on server (`x-nextjs-prerender: 1`) and present in sitemap

- Portfolio / Blog / Contact pages
  - All respond 200, have `robots: index, follow`, and are included in sitemap.xml

## Summary
- No technical blocking found (robots.txt allows crawling; pages return 200 for user-agent including Googlebot; meta tags set to index).
- Sitemap is present and includes these URLs.
- Likely cause for "not indexed" in GSC: Google chose not to index (quality/duplication/priority reasons) or needs reprocessing after sitemap submission.

## Next steps taken
- Added an internal "Important Links / Featured services" section to the homepage to increase internal linking to key pages.
