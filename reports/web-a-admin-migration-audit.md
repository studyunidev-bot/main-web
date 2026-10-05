# Web A Admin Migration Audit

ตรวจเทียบ source ใน `/studyunith` วันที่ 5 ตุลาคม 2026 ระหว่าง

- Frontend เดิม: `demo-app-register-gat-pat/app/(admin)/admin/**`
- API เดิม: `demo-app-register-gat-pat-api/src/**` และ contract ใน `demo-app-register-gat-pat/lib/backend-api.ts`
- ระบบใหม่: `main-web/src/app/gatpat/admin/**`, `main-web/src/app/api/gatpat/admin/**`, `main-web/src/server/gatpat/**` และ Prisma schema

## ผลสรุป

**ยังย้ายระบบหลังบ้าน Web A มาไม่ครบ 100% และยังไม่ควรเริ่ม Web B** การตรวจนี้เทียบ source และ route/API ที่ implement แล้ว ไม่ใช่การยืนยัน end-to-end ด้วยบัญชีเจ้าหน้าที่หรือการทำรายการกับข้อมูลจริง

| หน้าหลังบ้านเดิม | หน้าหลังบ้านใหม่ | ผลเทียบ source |
|---|---|---|
| `/admin/dashboard` | `/gatpat/admin/dashboard` | **ไม่ครบ** — ใหม่มี 4 counters แต่ขาดตัวกรองช่วงวันที่, สถิติรายชั่วโมง, อันดับสนาม, ค่าเฉลี่ย TGAT, active session breakdown และ refresh อัตโนมัติที่หน้าเดิมมี |
| `/admin/manage-students` | `/gatpat/admin/students` | **ไม่ครบ** — ใหม่ค้นหาและแสดง 25 รายการแรกได้ แต่ UI ไม่มี pagination, source/year/pending-location filters, summary cards และปุ่มลบที่มีในเดิม; API ใหม่รองรับบาง filter/DELETE แต่ UI ไม่เรียกใช้ และ API ใหม่ไม่มี `pendingLocationOnly`/summary แบบเดิม |
| `/admin/upload-students` | `/gatpat/admin/imports` | **ครอบคลุมหลักและเพิ่มความปลอดภัย** — อัปโหลด location/onsite/simulated พร้อมปี/รอบ/วันที่ได้ และเพิ่ม preview, diff, journal, history, rollback; ยังต้องยืนยัน parser กับไฟล์จริงทุกชนิดและผล reconcile |
| `/admin/rights-management` | `/gatpat/admin/forfeit-requests` | **ไม่ครบ** — แสดง/อัปเดตสถานะและรายละเอียดหลักได้ แต่ขาดค้นหา, filter สถานะ/หมวดหมู่, export Excel, modal รายละเอียดพร้อมลิงก์ไป record ที่มีในเดิม |
| `/admin/checkin` | `/gatpat/admin/checkin` | **ไม่ครบ** — เปิด session และสแกนได้ แต่ UI/API ไม่มีสรุปจำนวนเช็คอิน, รายการล่าสุด, polling สด, แสดงผลรายบุคคลครบ และปุ่ม “บันทึกยอดจุดนี้แล้วเริ่มนับใหม่” ในหน้าเดิม |
| `/admin/settings` | `/gatpat/admin/settings` | **ครอบคลุม source ส่วนหลัก** — links, announcement, banners, portal/check-in flags และกำหนดเวลา portal อยู่ใน UI/API ใหม่; ยังไม่ execute save/upload จริงและทดสอบ role ที่เปลี่ยน schedule ไม่ได้ |
| `/admin/schedule-settings` | รวมใน `/gatpat/admin/settings` | **ครอบคลุม source ส่วนหลัก** — เปิด/ปิด portal/check-in และ announcement เดิมยังแก้ได้; ระบบใหม่เพิ่มเวลาเปิด/ปิดอัตโนมัติ Asia/Bangkok |
| `/admin/manual` | ไม่มี route ใน Web A ใหม่ | **ขาด** — คู่มือการใช้งานหลังบ้านจากระบบเดิมยังไม่มีหน้าใน target |
| ไม่มีหน้าจัดการผู้ใช้ใน frontend เดิมที่ตรวจพบ | `/gatpat/admin/users` | **เพิ่มใหม่** — UI/API จัดการบัญชีและ membership เฉพาะ site A; ต้องตรวจ permission/role ทุกระดับจริง |

## API parity และข้อควรตรวจ

| ความสามารถ/API เดิม | สถานะในระบบใหม่ |
|---|---|
| Dashboard stats: ปี, สถานที่/session, from/to, active sessions, hourly check-ins, enrollment count, checked-in count, average TGAT | ไม่มี endpoint parity สำหรับ dashboard; Server Component นับข้อมูลพื้นฐาน 4 ค่าเอง จึงยังไม่รองรับ dashboard เดิมครบ |
| Students list: ค้นหา, source, academic year, pending location, pagination และ summary | API ใหม่มีค้นหา/source/year/pagination แต่ไม่มี pending-location filter และ summary; UI เรียกเฉพาะ q กับ page 1/pageSize 25 |
| Student delete | DELETE API ใหม่มี soft-delete และ guard แต่ไม่มีปุ่ม/flow ใน UI ใหม่ |
| Enrollment list/status update | API ใหม่มี GET/PATCH; หน้า Web A ใหม่ไม่มีหน้า/ปุ่มเรียกใช้ ฟังก์ชันนี้มีอยู่ใน API เดิมแต่ไม่พบการเรียกจากหน้า Admin เดิมที่ตรวจ |
| Forfeit list/status | GET/PATCH มี; UI ใหม่ไม่มี filter/export/detail interactions ที่หน้าเดิมมี |
| Check-in operator session/current state/recent history | ระบบใหม่มี bootstrap สำหรับ session/location และ POST เปิด session/scan; ยังไม่มี endpoint/UI ดึง count/recent check-ins หรือ refresh ระหว่างใช้งาน |
| Import Excel | เดิม POST `/imports/excel`; ใหม่แยก preview/apply/history/change journal/rollback; flow target มีความสามารถเพิ่ม แต่ยังต้องทดสอบไฟล์ตัวอย่างจริง |
| Settings/banner | GET/PATCH และ upload banner มีในระบบใหม่; ต้องทดสอบเปลี่ยนค่าจริงและสิทธิ์ SUPERADMIN สำหรับ schedule |

## รายการที่ต้องปิดก่อน Gate ไป Web B

1. ย้าย Dashboard ให้เทียบฟังก์ชันเดิมครบ หรือเจ้าของระบบระบุรายการที่ตัดออกได้ พร้อมสูตร/ช่วงเวลาที่ต้องแสดง
2. เติมหน้า Students: source/year/pending-location filters, summary, pagination และ flow soft-delete พร้อมยืนยันสิทธิ์
3. เติมหน้า Forfeit: ค้นหา, filter status/category, export Excel, รายละเอียดแบบ modal และทางเชื่อมไป student/application
4. เติม Check-in: session count, recent scan list, automatic refresh, result detail และ reset/start-new-session flow
5. สร้างหน้า Manual หรือยืนยันว่าไม่ต้องย้ายคู่มือเดิม
6. ตัดสินใจว่า Enrollment status management เป็น requirement สำหรับหน้า Web A หรือเก็บเป็น API-only ตามระบบเดิม
7. ทำ acceptance ด้วยบัญชี role จริง (CHECKIN, VIEWER, STAFF, ADMIN, SUPERADMIN) และทดสอบ denied access รวมทั้งยืนยันว่า Sidebar แสดงเมนู Web A ให้ role ที่ได้รับ membership
8. ทดสอบ import preview/apply/rollback กับไฟล์จริงที่อนุมัติ, settings/banner write, forfeit status transition และ check-in duplicate/reset โดยใช้ข้อมูลทดสอบที่ไม่กระทบข้อมูลจริง

## ผลการเติมช่องว่างและจัด UI (5 ตุลาคม 2026)

ทำ source-level implementation เพิ่มแล้ว โดยใช้ shared Admin shell และ template tokens/components ใน Web A:

| Gap ที่พบ | สิ่งที่เพิ่มใน `main-web` | สถานะหลักฐาน |
|---|---|---|
| Dashboard มีแต่ counters | เพิ่ม API สำหรับวันที่/ปี, เช็คอินรายชั่วโมง, top locations, TGAT average, active sessions และ counters พร้อมตัวกรองวันที่และ auto-refresh 30 วินาที | Build/TypeScript ผ่าน; ต้อง reconcile สูตรกับ report เดิม |
| นักเรียนไม่มี filters/summary/pagination/delete UI | เพิ่ม API filter source/year/pending location และ summary, เพิ่มตัวกรอง/แบ่งหน้า/student detail/soft-delete dialog ใน UI | Build/TypeScript ผ่าน; ต้องทดสอบสิทธิ์และการซ่อนข้อมูล |
| Enrollment status API ไม่มี UI | เพิ่มหน้า `/gatpat/admin/enrollments` พร้อมค้นหา, กรองปี/สถานะ, pagination และเปลี่ยนสถานะด้วย confirmation | Build/TypeScript ผ่าน; endpoint เดิมและ target ยังไม่ทดสอบ mutation |
| Enrollment status API ไม่มี UI | เพิ่มหน้า `/gatpat/admin/enrollments` สำหรับค้นหา/กรองและเปลี่ยนสถานะ พร้อม confirmation ก่อนยกเลิก | Build/TypeScript ผ่าน; endpoint เดิมและ target ยังไม่ทดสอบ mutation |
| Forfeit ไม่มี search/filter/export/detail interactions | เพิ่มค้นหา/filter หมวดหมู่และสถานะ, export Excel ตามผลกรอง, modal รายละเอียดและทางไปหน้าข้อมูลนักเรียน/ใบสมัคร | Build/TypeScript ผ่าน; การเปลี่ยน COMPLETED ต้องยืนยันกับ record ทดสอบ |
| Check-in ไม่มี counts/recent/live reset/result detail | เพิ่มยอดและ recent 10 รายการต่อ session, refresh 10 วินาที, scan result panel และ action เริ่ม session ใหม่โดยปิด session เดิม/เก็บประวัติ | Build/TypeScript ผ่าน; ต้องทดสอบ scanner, duplicate, reset ด้วยข้อมูลทดสอบ |
| คู่มือ Admin ไม่มีใน target | เพิ่ม `/gatpat/admin/manual` และลิงก์ในเมนู โดยเขียนขั้นตอนให้ตรงกับ flow ใหม่ | Build ผ่าน; ยังไม่ได้ตรวจภาพใน Browser |
| เมนูไม่แยกบทบาท | Sidebar กรองแต่ละรายการด้วย site role; เวลาเปิด/ปิดใน Settings disable สำหรับ role ที่ไม่ใช่ SUPERADMIN | Build ผ่าน; ต้อง acceptance role จริง |

หน้าที่เติม/ปรับใช้ style tokens ของ admin template (พื้นผิว, border, shadow, primary, dark mode) และยังรักษาการ authorization ใน server/API route ไว้

### สถานะตรวจรับหลังเติม

- `npm run build` ผ่านหลังการเปลี่ยนแปลงทั้งหมด
- ไม่ได้ส่ง POST/PATCH/DELETE เพื่อแก้ข้อมูลระบบจริง
- Browser visual QA ทำไม่ได้ในรอบนี้เพราะไม่มี browser session ที่เชื่อมต่อได้; `agent.browsers.list()` ส่งรายการว่าง
- ดังนั้น source-level feature gaps ที่ระบุถูก implement แล้ว แต่สถานะงานรวมยังเป็น **รอ functional acceptance** ไม่ใช่ “ย้ายครบ 100%” และยังไม่ผ่าน gate ไป Web B

## หลักฐานจาก source ที่ตรวจ

- หน้าเดิม: `demo-app-register-gat-pat/app/(admin)/admin/{dashboard,manage-students,upload-students,rights-management,checkin,settings,schedule-settings,manual}/page.tsx`
- API เดิม: `demo-app-register-gat-pat-api/src/{dashboard,students,enrollments,forfeit-requests,checkin,imports,system-settings,users}.controller.ts` และ service ที่ชื่อเดียวกัน
- หน้าใหม่: `main-web/src/app/gatpat/admin/{dashboard,students,imports,forfeit-requests,checkin,settings,users}/page.tsx`
- API ใหม่: `main-web/src/app/api/gatpat/admin/**/route.ts`

ไม่มีการ POST/PATCH/DELETE ข้อมูลระบบจริงในการ audit นี้
