# Blueprint ระบบสมัครสอบ GAT/PAT

เอกสารนี้บันทึกผลสำรวจ Frontend/Backend เดิมและความคืบหน้าการย้ายเว็บ A เข้าสู่ `main-web` โดยตรวจ source ภายใน `/studyunith` เท่านั้น อ้างอิงสถานะ workspace วันที่ 5 ตุลาคม 2026

## ขอบเขตและข้อสรุป

| ส่วน | ตำแหน่งปัจจุบัน | เทคโนโลยี | หน้าที่ |
|---|---|---|---|
| เว็บสมัครสอบ | `../demo-app-register-gat-pat` | Next.js 16, React 19, NextAuth v5 beta, TypeScript, Tailwind 4 | หน้าค้นหาข้อมูลผู้สมัคร/ใบสมัคร และหน้าปฏิบัติงานเจ้าหน้าที่/แอดมิน |
| API | `../demo-app-register-gat-pat-api` | NestJS 11, Prisma 7, PostgreSQL, TypeScript | กฎทางธุรกิจ, auth/RBAC, import Excel, check-in, portal, จัดการผู้ใช้/ข้อมูล |
| เว็บเป้าหมาย/Template กลาง | `.` (`main-web`) | Next.js 16, React 19, NextAuth v4, Tailwind 3, Prisma 7 | รวม public site/CMS เดิมกับ namespace ของ Web A; Route Handlers เป็น API เป้าหมาย |

Frontend เรียก API ผ่าน `lib/backend-api.ts` และ route proxy `/api/backend-proxy/*`; เสิร์ฟไฟล์ backend ผ่าน `/api/backend-assets/*` โดเมน API ปกติคือพอร์ต 3000 และหน้าเว็บพอร์ต 3001 ใน local dev ไม่มี API version prefix เช่น `/v1`

ส่วนต้นของเอกสารอธิบาย baseline จากระบบเดิม ส่วน checklist และ “หลักฐานจากการย้ายรอบปัจจุบัน” ระบุสิ่งที่สร้างและรันใน target แล้ว การ build/HTTP smoke ไม่ใช่การรับรอง end-to-end หรือ production 100%; ไฟล์ audit เก่าของ API มีข้อสรุปไม่ตรงกับ source ปัจจุบันหลายจุด ให้ถือ source เป็นหลัก

## โครงสร้างและการแบ่งชั้น

### Frontend

- `app/(student)` หน้าเว็บนักเรียนแบบ public: ค้นหาด้วยเลขประจำตัว, ดูรายการสมัคร, ดูรายละเอียด/คะแนน/กำหนดการ, ส่งคำขอสละสิทธิ์
- `app/(admin)` หน้าหลังบ้าน: dashboard, check-in, จัดการนักเรียน, นำเข้าไฟล์, จัดการคำขอสละสิทธิ์, ตั้งค่าระบบ/ตารางเวลา, คู่มือ และจัดการสิทธิ์
- `app/api/auth/[...nextauth]` NextAuth Credentials ใช้ backend login แล้วเก็บ access token ใน JWT session
- `lib/backend-api.ts` จุดรวม HTTP client, type ของ request/response, role mapping, การแปลง error และ API functions
- `app/api/backend-proxy/[...backendPath]` ส่งต่อ method/body/query/auth header จาก browser ไป API; `backend-assets` ส่งต่อไฟล์สาธารณะจาก `/uploads`
- `proxy.ts` ตรวจ session cookie สำหรับ route ที่ไม่ public; `/student*` เปิดโดยไม่ต้องล็อกอินเพื่อให้ค้นข้อมูลผู้สมัครได้
- `app/components` มี Navigation, Sidebar, AuthProvider และ UI primitives

หน้า Frontend ที่ปรากฏจาก App Router:

| URL | กลุ่ม/บทบาท | งานหลัก |
|---|---|---|
| `/login` | เจ้าหน้าที่/ผู้ดูแล | เข้าระบบด้วย email/password |
| `/student/search` และ `/student/search/[...id]` | ผู้สมัคร (public) | ค้นข้อมูลด้วยเลขประจำตัว และแสดงรายการใบสมัคร |
| `/student/applications` | ผู้สมัคร | หน้ารวมใบสมัครที่ได้รับข้อมูลมาจาก flow การค้นหา |
| `/student/exam/[id]` | ผู้สมัคร | รายละเอียดสอบ, barcode, ผลคะแนน/อันดับ, schedule, ยื่นสละสิทธิ์ |
| `/admin/dashboard` | ผู้ดูแล/เจ้าหน้าที่ | สรุปยอดสมัครและ check-in |
| `/admin/checkin` | CHECKIN/STAFF/ADMIN | เลือก session และสแกน/กรอก barcode |
| `/admin/manage-students` | STAFF/ADMIN | ค้น/กรอง/แบ่งหน้า/ลบข้อมูลผู้สมัคร |
| `/admin/upload-students` | STAFF/ADMIN | อัปโหลด Excel สถานที่, onsite, simulated |
| `/admin/rights-management` | STAFF/ADMIN | ตรวจสอบและปรับสถานะคำขอสละสิทธิ์ |
| `/admin/settings`, `/admin/schedule-settings` | STAFF/ADMIN | ตั้งค่า portal, check-in, ประกาศ, ลิงก์ และ banner |
| `/admin/manual` | เจ้าหน้าที่ | คู่มือการใช้งาน |

Role ฝั่ง backend มี `USER`, `STAFF`, `CHECKIN`, `VIEWER`, `ADMIN`, `SUPERADMIN`; frontend map ADMIN/SUPERADMIN เป็น `admin`, STAFF/CHECKIN/VIEWER เป็น `staff`, ค่าอื่นเป็น `student` เพื่อเลือก landing/dashboard เท่านั้น ส่วนการอนุญาตจริงอยู่ที่ API guards

### Backend

- `src/main.ts`: boot Nest, security headers, CORS, proxy setting, static `/uploads`, global audit interceptor/exception filter
- `src/app.module.ts`: รวม controllers/services และ middleware rate limit
- Controllers แยกตาม auth, users, students, enrollments, imports, check-in, dashboard, portal, settings, forfeit requests
- Services ประกอบกฎธุรกิจและ Prisma queries; `src/prisma` จัดการ Prisma client
- `schema.prisma` เป็นแบบจำลอง PostgreSQL; Prisma client generate ไป `src/generated/prisma`
- Upload ชั่วคราวอยู่ `.tmp/imports`; banner อยู่ `.tmp/public/settings-banners` และเผยแพร่เป็น `/uploads/...`
- `scripts/start-*-with-prisma-patch.js` และ `patch-prisma-runtime.js` เป็นส่วนหนึ่งของวิธีรันเฉพาะ repo นี้ตาม README

## User journeys

### ค้นหาผู้สมัครและใบสมัคร

1. ผู้สมัครเปิดหน้า `/student/search` และส่งเลขประจำตัว
2. Frontend เรียก `GET /portal/students/:nationalId`
3. API หา Student ที่ไม่ถูก soft-delete พร้อม Enrollments ของปี/รอบ/แหล่งข้อมูล และแนบสถานที่/คำขอสละสิทธิ์
4. UI แสดงข้อมูลผู้สมัครและรายการใบสมัคร; เลือกรายการไป `/student/exam/:id`
5. `GET /portal/applications/:id` ส่งกลับรายละเอียดผู้สมัคร, enrollment, คะแนน, ตารางเวลา และ public settings
6. ผู้สมัครส่งแบบฟอร์มสละสิทธิ์ผ่าน `PATCH /portal/applications/:id/forfeit`; backend ตรวจข้อมูล/สถานะ/การส่งซ้ำและสร้าง ForfeitRequest

Portal endpoints ไม่มี JWT guard ตาม controller ปัจจุบัน และการค้นใช้เลขประจำตัวเป็นตัวระบุ ดังนั้นก่อนย้ายต้องตรวจการเปิดเผยข้อมูลส่วนบุคคลและความจำเป็นของการยืนยันตัวตน/จำกัดการค้น

### เจ้าหน้าที่เข้าสู่ระบบ

1. NextAuth Credentials รับ email/password ที่ `/login`
2. `validateCredentials` เรียก `POST /auth/login`; API ตรวจ active user และ password hash แล้วลงนาม JWT
3. NextAuth เก็บข้อมูล role/access token ใน JWT session
4. Frontend แนบ `Authorization: Bearer <accessToken>` กับ API ที่ต้อง auth
5. Backend `JwtAuthGuard` ตรวจ token; `RolesGuard` ตรวจ role ที่กำหนดระดับ controller/route

มี `POST /register` สำหรับ bootstrap ผู้ใช้รายแรก และใช้ optional JWT เพื่อจำกัดการสร้าง user หลังมีผู้ดูแลแล้ว แต่หน้า UI ที่พบเป็นหน้า login; ไม่พบ flow สมัคร account จาก frontend

### Import ข้อมูล Excel

1. เจ้าหน้าที่เลือกปีการศึกษา, รอบ onsite/simulated, วันสอบ และไฟล์ `locations`, `onsite`, `simulated`
2. Frontend ส่ง multipart ไป `POST /imports/excel` (ไฟล์สูงสุด 3 ไฟล์, default limit 64 MB ต่อไฟล์)
3. API บันทึกไฟล์ชั่วคราว; service ใช้ ExcelJS ตรวจ header/แถวและ normalize ค่า, แยก batch/concurrency, สร้างหรืออัปเดต Student, ExamLocation, Enrollment, barcode และ ImportFile
4. API ส่ง summary แยกแต่ละไฟล์: row/success/failed, errors/warnings, reconciliation และ header detections
5. ไฟล์ชั่วคราวถูก cleanup หลัง import; ประวัติ ImportFile เก็บ metadata และ error/header snapshot ไม่ได้เก็บไฟล์ต้นฉบับถาวรตาม schema

กฎ mapping ที่มีจำนวนมากอยู่ใน `imports.service.ts` (การจับคู่ชื่อ header, เลขประจำตัว, รอบสอบ, รหัสสถานที่, วัน/เวลา, barcode เดิม, สถานที่ที่ยังจับคู่ไม่ได้) จึงควรย้าย service นี้โดยคง characterization ของรูปแบบ Excel จริง ไม่เขียน parser ใหม่จากการคาดเดา

### Check-in

1. ผู้ปฏิบัติงาน auth ด้วย role CHECKIN/STAFF/ADMIN/SUPERADMIN
2. อ่าน `GET /checkin/session/current` เพื่อดู session ที่ active, ยอด/ประวัติสแกน และสถานะการเปิด check-in
3. Admin/Staff เปิด session ด้วย `POST /checkin/session/start` ระบุ academicYear และ examRound
4. สแกน barcode 8 หลักแล้วส่ง `POST /checkin`
5. Backend ตรวจ session, ผู้สร้าง/เจ้าของ session, ปีการศึกษา/รอบสอบ, enrollment/สถานที่ และการเช็คอินซ้ำ จากนั้นบันทึก CheckIn SUCCESS หรือ conflict/ข้อผิดพลาด
6. Dashboard สรุปยอดผู้สมัคร, เช็คอิน, คงเหลือ, คะแนนเฉลี่ย และข้อมูลตามเวลา/session

### งานดูแลหลังบ้าน

- นักเรียน: `GET /students` รองรับ q/source/year/pendingLocationOnly/page/pageSize; DELETE ทำ soft-delete เป็น transaction และจำกัด ADMIN/SUPERADMIN
- Enrollment: `GET /enrollments`, `PATCH /enrollments/:id/status`
- ผู้ใช้: `GET /users`, `POST /users`, `PATCH /users/:id` สำหรับ ADMIN/SUPERADMIN; password hash, role และ active state จัดการที่ service
- คำขอสละสิทธิ์: `GET /forfeit-requests`, `PATCH /forfeit-requests/:id/status`; service บันทึกผู้ดำเนินการ/เวลา
- Settings: `GET/PATCH /settings`, `POST /settings/banner`; แก้ links, banners, portal/check-in open flags, announcement

## API contract ที่ Frontend ใช้

| Method | Path | Auth/role โดยประมาณ | ใช้ทำอะไร |
|---|---|---|---|
| POST | `/auth/login` | public | รับ access token |
| GET | `/auth/me` | JWT | ข้อมูล principal จาก token |
| GET/POST/PATCH | `/users`, `/users/:id` | ADMIN/SUPERADMIN | จัดการบัญชีเจ้าหน้าที่ |
| GET | `/dashboard/stats` | VIEWER/STAFF/ADMIN/SUPERADMIN | KPI และ session |
| GET/DELETE | `/students`, `/students/:id` | list STAFF+, delete ADMIN+ | จัดการนักเรียน |
| GET/PATCH | `/enrollments`, `/enrollments/:id/status` | STAFF+ | รายการ/สถานะการสมัคร |
| POST | `/imports/excel` | STAFF+ | นำเข้าไฟล์ Excel |
| GET/POST | `/checkin/session/current`, `/checkin/session/start` | CHECKIN+ สำหรับ current; STAFF+ สำหรับ start | เปิด/อ่าน session |
| POST | `/checkin` | CHECKIN+ | บันทึกการเช็คอิน |
| GET | `/forfeit-requests` | STAFF+ | ดูคำขอสละสิทธิ์ |
| PATCH | `/forfeit-requests/:id/status` | STAFF+ | เปลี่ยนสถานะคำขอ |
| GET/PATCH/POST | `/settings`, `/settings/banner` | STAFF+ | ตั้งค่าระบบ/อัปโหลด banner |
| GET | `/portal/students/:nationalId` | public | ค้นผู้สมัคร |
| GET | `/portal/applications/:id` | public | รายละเอียดใบสมัคร/คะแนน/schedule |
| PATCH | `/portal/applications/:id/forfeit` | public | ยื่นคำขอสละสิทธิ์ |
| GET | `/portal/settings` | public | ค่าที่ portal แสดง |
| GET | `/health`, `/` | public | ตรวจสถานะ/ข้อความ API |
| POST | `/register` | bootstrap public; ต่อไป admin-auth | สร้างบัญชีผู้ใช้ |

รายการนี้อิง controller และ API client ที่อ่าน ไม่ใช่ OpenAPI specification; รูปแบบ DTO/validation บาง endpoint รับ `any` หรือ object inline จึงควรบันทึก contract ที่แน่นอนก่อน migration

## แบบจำลองข้อมูล

- **User**: email/password hash, fullName, Role, isActive, soft-delete; เชื่อม import, session/check-in, setting updates และคำขอที่จัดการ
- **Student**: nationalId unique, ชื่อไทย/อังกฤษ, email/phone, โรงเรียน/จังหวัด/วันเกิด; soft-delete
- **Enrollment**: student, academicYear, examRound, sourceType, status, barcode unique, registration window, location, import references; unique ตาม student/year/round/sourceType
- **ExamLocation**: code/name/address/province/capacity/วันและช่วงเวลาสอบ/active
- **ImportFile**: metadata, sourceType/year, checksum, row success/failure counts, header/error snapshots
- **Score**: TGAT รวม/แยกส่วน, ranks overall/location และ percentile; หนึ่งต่อ enrollment
- **CheckInSession**: ปี/รอบ/สถานที่, active state, started/ended, creator
- **CheckIn**: barcode, enrollment/session, status, scannedAt, device/scanner/note
- **ForfeitRequest**: หนึ่งคำขอต่อ enrollment, reason/contact/address, workflow status และ processor/timestamps
- **SystemSetting**: ค่าระบบทั่วไป เช่น links, banner URLs และ portal/check-in flags

Enums สำคัญ: Role (`USER`, `STAFF`, `CHECKIN`, `VIEWER`, `ADMIN`, `SUPERADMIN`), EnrollmentStatus (`DRAFT`, `REGISTERED`, `PAID`, `CANCELLED`), ExamRound (`MORNING`, `AFTERNOON`), EnrollmentSourceType (`ONSITE_EXCEL`, `SIMULATED_EXCEL`, `MANUAL`, `API`), CheckInStatus และ ForfeitRequestStatus

## Runtime และ configuration

- Frontend dev: `npm run dev` ที่ port 3001; production start ใช้ `PORT` หรือ 3001
- API dev: `npm run start:dev`; port ปกติ 3000; build เรียก Prisma generate, Nest build และ patch runtime
- Frontend env: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_BASE_URL`, `SESSION_TIMEOUT`, `SECURE_COOKIES`
- Backend env: `DATABASE_URL`, `PORT`, `DB_POOL_MAX`, `DB_IDLE_TIMEOUT`, `CORS_ORIGIN`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `THROTTLE_TTL_SECONDS`, `THROTTLE_LIMIT`, `TRUST_PROXY`, import limits/batch/concurrency
- API เปิด CORS ตาม `CORS_ORIGIN`, credentials, methods ที่กำหนด, headers ความปลอดภัย, rate limit middleware และ static uploads
- มี Prisma migrations ใน `prisma/migrations`; ควรตรวจสถานะ migration กับฐานข้อมูลต้นทางก่อนเปลี่ยน schema หรือชี้ระบบไปฐานใหม่

## เป้าหมายสถาปัตยกรรมที่ยืนยันแล้ว

- ใช้ **Next.js เป็นทั้งเว็บและ API** ในแอปเดียว โดย API ใช้ App Router Route Handlers (`app/api/**/route.ts`); ไม่ใช้ NestJS ในระบบเป้าหมาย NestJS เป็นระบบต้นทางที่ต้องย้ายกฎธุรกิจออกมา
- ใช้ **PostgreSQL** เป็นฐานข้อมูล และ deploy Next.js กับ PostgreSQL บน **VPS เดียวกัน** ในเฟสนี้; Nginx ทำหน้าที่ reverse proxy/TLS เท่านั้น
- หน้าแรก `/` เป็น Landing มีตัวเลือก Web A/Web B; Web A public portal อยู่ `/gatpat/student/*` และนำ UX/UI เดิมของผู้สมัครมาใช้; หลังบ้านของทุกเว็บใช้ shell/template กลางใน `main-web` พร้อมแยกข้อมูลและเมนูตาม site/user
- เก็บ Prisma/database access และ business logic ใน server-only modules; Route Handler ทำหน้าที่ตรวจ input/auth แล้วเรียก service ห้ามส่ง database secret หรือ service code ไป client bundle
- เตรียม multi-site ด้วย `siteId` และ membership แบบระบุ site: ข้อมูลเดิมทั้งหมดเป็น **เว็บ A**; อนุญาตทำ **UI Mockup เว็บ B** เพื่อสาธิตควบคู่กับการตรวจรับ A ได้ แต่ห้ามเชื่อม DB/API จริงหรืออ่าน/เขียนข้อมูล A; เว็บ B production และ data model จริงยังรอการออกแบบ/ตรวจรับ A
- ใช้ Asia/Bangkok สำหรับเวลาธุรกิจและแสดงปีการศึกษาเป็น พ.ศ.; แปลงข้อมูลเก่าโดย migration ที่ตรวจนับก่อน/หลังและย้อนกลับได้
- เว็บนี้รับข้อมูลนักเรียนด้วย Excel ตามระบบเดิม **ไม่มีหน้าให้นักเรียนสมัครเอง**; การป้องกัน public portal ที่เปิดข้อมูลส่วนบุคคลเป็นประเด็นความปลอดภัยแยกต่างหาก ต้องตัดสินใจ/บันทึกก่อนเปิด production และไม่ถือว่าการไม่ทำ signup เท่ากับการอนุมัติให้ค้นข้อมูลแบบไม่ยืนยันตัวตน

## แผนย้ายเว็บ A ใน main-web

ทำตามลำดับ โดยคงระบบเก่าเป็น baseline จนกว่า A จะตรวจรับครบ:

1. **ยืนยัน baseline และสัญญาระบบ**: บันทึก routes, API contracts, role/permission, business rules, schema/migrations และตัวอย่างไฟล์ Excel ที่ลบข้อมูลระบุตัวบุคคล; สำรองฐานและไฟล์ก่อนเปลี่ยนแปลง ห้ามบันทึกค่า secret ลง blueprint
2. **วางโครงกลางใน main-web**: กำหนด route/layout boundary, server-only data layer, API error/validation conventions และ auth/session integration กับ NextAuth ที่มีอยู่; คง Nest ไว้เป็นแหล่งอ้างอิงระหว่าง port เท่านั้น
3. **เตรียม schema และแยก site**: เพิ่ม `siteId` ให้ข้อมูลที่เป็นของ site, site membership/role scope, unique constraints ที่มี site scope และดัชนี; backfill ข้อมูลต้นทางเป็น A; ปฏิเสธทุก query/mutation ที่ไม่มี authorized site context
4. **ย้ายข้อมูลอย่างกู้คืนได้**: migrate schema/data/files พร้อม row counts, foreign keys, unique checksums; แปลงปี ค.ศ. เป็น พ.ศ. โดยเก็บ mapping/audit; ทำ import preview (เพิ่ม/เปลี่ยน/รายการที่จะ retire), change journal และ rollback; แยก field ที่ Excel เป็นเจ้าของจากค่าที่เจ้าหน้าที่แก้เอง และห้าม soft-delete ประวัติข้ามปี/แหล่งโดยปริยาย
5. **Port API สู่ Next.js ทีละโดเมน**: auth/users → settings/portal window → students/enrollments → imports → scores/dashboard → check-in → forfeit; รักษา response/error semantics ที่ UI พึ่งพา พร้อมยืนยัน validation และสิทธิ์ทุก route
6. **ย้าย UI เข้าสู่ template**: login/admin shell, dashboard, นักเรียน/ใบสมัคร, import, check-in, คำขอสละสิทธิ์, settings, คู่มือ และ portal; ใช้ component/template ร่วมได้ แต่ข้อมูลและ navigation ต้องอยู่ในขอบเขต A
7. **ปิดกฎธุรกิจและความเสี่ยง**: อนุญาต check-in เฉพาะ enrollment ที่ active และไม่ถูกลบ; session ผูกสนาม; กัน check-in ซ้ำทั้งระบบต่อ Enrollment; สละสิทธิ์หนึ่งคำขอต่อ Enrollment; portal window เปิด/ปิดตามเวลาโดย SUPERADMIN; คำนวณ dashboard/rank จากข้อมูลระบบและบันทึก tie rule ที่เจ้าของยืนยัน
8. **ตรวจเทียบและรับรอง A**: เทียบข้อมูล/ไฟล์นำเข้าและผลลัพธ์กับ baseline, ตรวจทุก role และ flow, ทดสอบข้าม site, backup/restore และ rollback; แก้รายการใน checklist ให้มีหลักฐานจึงเปลี่ยนเป็น “ผ่าน”
9. **Deploy VPS**: ตั้ง Nginx/TLS, Next.js process manager, PostgreSQL ให้รับ connection เฉพาะที่จำเป็น, server-side env/secrets, persistent upload storage, migrations, log/monitoring, scheduled backups และขั้นตอน restore; ทดสอบ deploy/rollback ก่อน cutover
10. **ประตูเว็บ B**: สร้างได้เฉพาะ Mockup ที่ทำงานฝั่งหน้าเว็บและใช้ข้อมูลตัวอย่าง; ห้ามเรียก API/DB หรือแชร์ข้อมูล A. ก่อนทำ B production ให้ตรวจรับ A ครบและเจ้าของระบบยืนยันขอบเขต B, schema, roles และ workflow

## ข้อกำหนด Demo และ Web B Mockup (ปรับตามคำสั่งเจ้าของระบบ 5 ตุลาคม 2569)

- ใช้หน้า `/auth/sign-in` และฟอร์ม `SigninWithPassword` ตัวเดิมสำหรับทั้ง A/B; บัญชี Web A ใช้ NextAuth และตรวจสิทธิ์กับ membership ของ `gatpat-a`; บัญชี Web B ตรวจรหัส Demo แบบ fixed ใน client แล้วเข้า mockup โดยไม่สร้าง session หรือเรียก API/DB
- บัญชีจริงที่ผู้ดูแลเลือกใช้ทดสอบ Web A คือ `demo-web-a@studyunith.local`; ระหว่างตรวจพบว่า `User.role=SUPERADMIN` แต่ `SiteMembership.role=VIEWER` จึงซิงก์ membership ของไซต์ `gatpat-a` เป็น `SUPERADMIN` ให้ตรงตามสิทธิ์ที่ผู้ดูแลตั้งไว้แล้ว โดยห้ามแสดงรหัสผ่านบัญชีจริงบนหน้า Login
- Web B Demo Login แสดงรหัสคงที่ `demo-web-b@studyunith.local` / `WebB-Demo-2570` พร้อมปุ่มเติมข้อมูล; ค่านี้เป็นรหัสสาธารณะสำหรับ mockup เท่านั้น ห้ามนำไปใช้กับข้อมูลจริงหรือระบบ production
- A/B ใช้ `Sidebar` และ `Header` ของ main-web ร่วมกัน; Web B แสดงเมนูตามส่วน mockup และป้าย Demo ส่วนข้อมูลทั้งหมดเป็น fixture/client state ไม่มี API/DB access
- Web B Demo routes: `/webb` หน้า portal, `/webb/register` ฟอร์มสมัคร 3 ขั้น, `/webb/status` ตรวจเลขอ้างอิงตัวอย่าง, `/webb/admin/dashboard` หลังบ้าน Demo ภายใต้ admin shell/template กลาง
- ข้อมูลและ interaction ของ B ใช้ fixture/client state หรือ sessionStorage เฉพาะ reference ที่สร้างใน Browser; ไม่มี Route Handler, external API หรือ DB access และต้องมีป้าย Demo ระบุข้อจำกัดบนหน้า
- หน้าต้นแบบ B เดิมเป็นระบบรับสมัครสอบทั่วไปและใช้ข้อมูลสมมติ; งานรอบใหม่จะปรับเป็นระบบซื้อข้อสอบ TGAT และสอบออนไลน์ตามหัวข้อถัดไป

## ขอบเขต Web B รอบ Mockup ตามข้อเสนอสนามสอบจำลอง TCAS

อ้างอิง [ข้อเสนอพัฒนาระบบสนามสอบจำลอง TCAS + Online Payment](https://docs.google.com/document/d/1ZUDo6MMd7Gddm8b_cousruUpYH7z0dG7ekbKCLeMY7M/edit) และคำตอบเจ้าของระบบวันที่ 5 ตุลาคม 2569: **Web B เป็นสนามสอบจำลองออนไลน์; รอบนี้ใช้ข้อมูล Mockup 100% รวมการชำระเงินจำลอง; การแก้ไขต้องไม่กระทบการทำงานหรือข้อมูล Web A** ยืนยันใช้ [Payso](https://payso.co/th) สำหรับระบบจริงในอนาคต; เว็บไซต์ Payso ระบุ PaySoon เป็นผลิตภัณฑ์ B2B คนละรายการ จึงแก้ชื่อจากข้อเสนอเก่าให้ถูกต้อง. ข้อเสนอมีแผนพัฒนาระบบจริงในระยะถัดไป; ตารางนี้เป็นขอบเขตต้นแบบหน้าจอและปฏิสัมพันธ์ของรอบปัจจุบันเท่านั้น

| ส่วนของ Web B | หน้าจอ/ปฏิสัมพันธ์ใน Mockup รอบนี้ | สถานะเทียบต้นแบบปัจจุบัน |
|---|---|---|
| หน้าแรกและรายการข้อสอบ | ทางเลือก A/B จาก Landing เดิม, หน้าโครงการ B, วิธีใช้/FAQ/นโยบาย, สินค้า 5 แบบ: TGAT1, TGAT2, TGAT3, TGAT2+TGAT3, Full TGAT; ทุกสินค้าให้ 1 Attempt และพาร์ทตามที่ซื้อ; TPAT/A-Level/NETSAT แสดงเป็นอนาคต | `/webb` มีแล้วแต่ยังสื่อว่า TPAT/A-Level เปิดรับสมัคร ต้องปรับ |
| สมาชิกผู้เข้าสอบ | จำลองสมัคร/เข้าสู่ระบบ, ยืนยันอีเมล/ลืมรหัส, โปรไฟล์, การยอมรับ Privacy/Terms ก่อนสมัคร ด้วยข้อมูลตัวอย่าง | `/webb/register` ยังเป็นใบสมัครสอบ/เลือกสนาม ไม่ใช่ระบบสมาชิกและซื้อข้อสอบ |
| Catalog และ Order | ดูชุด/เวอร์ชัน/ราคา/สิทธิ์, สร้างเลข Order จำลอง, เก็บ snapshot ของ “ราคาขาย” และ “ยอดที่เรียกเก็บผ่าน Payso” แยกกัน, แสดงยอดจริงก่อนกดยืนยัน; ตัวอย่าง 100/110 บาท | ยังไม่มี |
| ชำระเงินจำลอง | หน้าชำระเงินตัวอย่าง QR หรือบัตรเครดิต; สถานะ Pending/Paid/Expired/Failed/Amount mismatch, ปุ่มจำลองผลชำระและเหตุการณ์ส่งซ้ำ; เปิดสิทธิ์สอบครั้งเดียวเฉพาะ Paid ที่ยอดตรง | ยังไม่มี; ไม่มีการเรียก Payso API/Webhook หรือสร้างรายการชำระเงินจริง |
| สิทธิ์และห้องสอบ | 1 คำสั่งซื้อที่ชำระแล้ว = 1 สิทธิ์สอบตามหน่วยสินค้าที่จะยืนยัน, PDF/โจทย์ตัวอย่าง + กระดาษคำตอบ, จับเวลา, เตือน 10 นาที, auto-save/ส่งข้อสอบ/หมดเวลา และตัวอย่างการกลับเข้าสอบ | ยังไม่มี; พฤติกรรมเวลาฝั่ง Server, sync ข้ามเครื่อง และการป้องกันหลายอุปกรณ์จะเป็นระบบจริงภายหลัง |
| ผลสอบ/อันดับ/เฉลย | คะแนนรวมและ TGAT1–3, รายข้อ, อันดับเฉพาะชุดและเวอร์ชันเดียวกัน, ชื่อผู้สอบแบบปกปิด, PDF/วิดีโอเฉลยตัวอย่างตามสิทธิ์ | `/webb/status` ยังเป็นติดตามใบสมัครและสนามสอบ ต้องเปลี่ยนเป็นรายการซื้อ/สิทธิ์/ผลสอบ |
| หลังบ้าน | ใช้ Sidebar/Header ของ template กลางที่มีอยู่; จำลอง Dashboard, ชุดข้อสอบ/เวอร์ชัน/เฉลย, สมาชิก, Order/Payment/ยอดสุทธิและค่าธรรมเนียม Payso พร้อมตัวกรองวันที่เริ่ม–สิ้นสุด Asia/Bangkok, สิทธิ์สอบ, ผล/Ranking, role Content/Support/Finance/Super Admin และ Audit Log | `/webb/admin/dashboard` มีโครงแล้ว แต่เป็น Dashboard การรับสมัครทั่วไปและข้อมูลคนละชุดกับหน้าเว็บผู้ใช้ |

### ขอบเขตการแยก Web A/B และเกณฑ์รับ Mockup

- จำกัดงาน Web B ไว้ใน route `/webb/*` และข้อมูลตัวอย่างของ B; ใช้ admin shell component เดิมผ่าน configuration ของ B ที่มีอยู่ โดยคงพฤติกรรมเริ่มต้นของ A. ห้ามแก้ `/gatpat/*`, `/api/gatpat/*`, auth/role ของ A, Prisma schema/migration หรือฐานข้อมูล A เพื่อทำ Mockup นี้
- สร้าง fixture/state ของ B ชุดเดียวให้หน้า Catalog, Order, Payment, สิทธิ์สอบ, ห้องสอบ, ผลสอบ และ Admin แสดงข้อมูลสอดคล้องกันใน Browser เดียว; ป้าย Demo ต้องเห็นชัด. ข้อมูลที่กรอกใน Mockup ไม่ใช้ข้อมูลจริง และห้ามเก็บเลขบัตรหรือบัตรชำระเงินจริง
- Mockup ต้องสาธิตอย่างน้อย 4 กรณีชำระเงิน: สำเร็จแล้วได้สิทธิ์หนึ่งครั้ง, ล้มเหลว/หมดอายุแล้วไม่ได้สิทธิ์, ยอดไม่ตรงแล้วไม่ได้สิทธิ์, และส่งผลสำเร็จซ้ำแล้วไม่เพิ่มสิทธิ์. QR/บัตรเป็นภาพและข้อความตัวอย่าง ไม่มีการส่งเงิน
- ก่อนส่งมอบหน้าต้นแบบ ให้ตรวจว่าเส้นทาง A ยังคงเข้าและทำงานเหมือนเดิม และ B ไม่เรียก API/DB ของ A; เก็บผลตรวจไว้ในตารางรับงาน B. การเชื่อมต่อผู้ให้บริการชำระเงินจริง, Webhook, การส่งอีเมล, การเก็บข้อมูลสมาชิกจริง, การจับเวลาจาก Server และความพร้อม 500 ผู้ใช้พร้อมกันเป็นงานระบบจริงในระยะถัดไป

### คำตอบที่ยืนยันแล้วและนิยามรายงานการเงิน

- สินค้า 5 แบบคือ TGAT1 (สอบพาร์ท 1), TGAT2 (พาร์ท 2), TGAT3 (พาร์ท 3), TGAT2+TGAT3 (สองพาร์ทในชุดเดียว) และ Full TGAT (สามพาร์ทในชุดเดียว); แต่ละรายการซื้อสำเร็จให้ 1 Attempt สำหรับสินค้านั้น
- ช่องทาง Mockup คือสแกน QR และบัตรเครดิต; ใช้ตัวตนและข้อสอบตัวอย่าง ติดป้าย `DO` ตามคำตอบเจ้าของระบบ; ไม่มีการใช้เลขบัตรประชาชนหรือข้อมูลบัตรจริง. อันดับแสดงเมื่อมีผู้สอบตั้งแต่ 2 คนในชุดและเวอร์ชันเดียวกัน. กรณีคืนเงินใช้สถานะตัวอย่างชั่วคราว
- อ้างอิง UX จาก [Figma หลัก](https://www.figma.com/design/kxUG8hEXmnLGQnVmi3bnAA/Rian-tor-mahalai?node-id=3-3), [Mobile](https://www.figma.com/proto/kxUG8hEXmnLGQnVmi3bnAA/Rian-tor-mahalai?page-id=767%3A69414&node-id=886-113947) และ [Desktop](https://www.figma.com/proto/kxUG8hEXmnLGQnVmi3bnAA/Rian-tor-mahalai?page-id=3%3A3&node-id=642-25585); Figma connector แจ้งว่าไม่มีสิทธิ์ Editor จึงรอภาพหน้าจอที่เจ้าของระบบจะส่งมาเพื่อเทียบภาพจริง
- แต่ละ Order ต้องเก็บ snapshot อย่างน้อย `ราคาสินค้า`, `ยอดเรียกเก็บลูกค้า`, `ส่วนต่างที่บวกลูกค้า`, `ค่าธรรมเนียม Payso ที่จำลองตามช่องทาง`, `ยอดรับสุทธิหลังค่าธรรมเนียม`, `วันที่ชำระ`, `สถานะ` และ `สินค้า/เวอร์ชัน`; รายงานต้องกรองวันที่เริ่ม–สิ้นสุดตาม Asia/Bangkok และรวมเฉพาะรายการ Paid สำหรับยอดที่รับจริง
- ตัวอย่าง: ราคาสินค้า 100 บาท, เรียกเก็บ 110 บาท, ส่วนต่าง 10 บาท; ถ้า Payso หักค่าธรรมเนียมจำลอง 5 บาท ยอดรับสุทธิหลัง Payso คือ 105 บาท และส่วนต่างสุทธิหลังหักค่าธรรมเนียมคือ 5 บาท. ค่าธรรมเนียม Payso ไม่ใช่ส่วนต่าง 10 บาทโดยอัตโนมัติ. คำว่า “กำไรจริง” ต้องหักต้นทุนข้อสอบ/การผลิต/ภาษี/ค่าใช้จ่ายอื่นเพิ่ม ซึ่งยังไม่ได้ระบุ จึงใช้ชื่อรายงาน “ยอดรับสุทธิหลัง Payso” และ “ส่วนต่างสุทธิหลังค่าธรรมเนียม” ใน Mockup ก่อน

### ข้อมูลที่ยังต้องได้รับสำหรับระบบจริง

- ราคาและต้นทุนของสินค้าแต่ละแบบ รวมถึงค่าธรรมเนียม Payso ตามสัญญาร้านค้าจริง เพื่อคำนวณกำไรสุทธิทางธุรกิจได้ถูกต้อง; Mockup ใช้ตัวเลขตัวอย่างที่ติดป้ายชัดเจน
- ไฟล์ข้อสอบ/เฉลยและภาพหน้าจอ Figma Desktop/Mobile ที่เจ้าของระบบเลือกเป็นแบบอ้างอิง; การเชื่อม Payso จริงและนโยบายคืนเงินต้องยืนยันก่อนพัฒนาระบบจริง

## ตารางติดตามการย้ายเว็บ A

สถานะด้านล่างปรับตาม source, schema และ runtime ที่อยู่ใน `main-web` หลังเริ่มย้ายจริง ณ 5 ตุลาคม 2026; `ผ่าน` ใช้เฉพาะเมื่อมีหลักฐานตรวจสอบเพียงพอ ส่วน flow ที่ยังไม่ได้ทดสอบด้วยบัญชี/ไฟล์ข้อมูลที่อนุมัติจะเป็น `รอตรวจ` หรือ `กำลังทำ` ไม่ถือว่าเสร็จ 100%

| ID | ขอบเขต/เกณฑ์รับเว็บ A | Requirement/หลักฐานที่ต้องตรวจ | สถานะ |
|---|---|---|---|
| A-01 | โครง Next.js กลางและ route namespace | App Router `/gatpat/*`, API `/api/gatpat/*`; production build ผ่านและเว็บเดิมยังอยู่ | ผ่าน (โครง/Build) |
| A-02 | Landing และทางเข้า A | `/` แสดง Card A ไปหน้าค้นหาผู้สมัคร และ Card B ไป Mockup; `/gatpat` ส่งต่อไป portal | ผ่าน (smoke ที่พอร์ต 3003) |
| A-03 | Login/session/logout | บัญชี Web A ผ่าน NextAuth จริงด้วย hash scrypt, session แสดง `SUPERADMIN` และ `siteKey=gatpat-a`; ปรับ role membership ให้ตรงกันแล้ว; ยังต้องตรวจ logout/session expiry/disable account | ผ่าน (login success) |
| A-04 | Site A authorization | siteId + membership บังคับใน API/data layer; ยังต้องทดสอบการข้าม site แบบ adversarial | รอตรวจ |
| A-05 | Role/permission | API มี role guards และเมนูหลังบ้าน; บัญชีทดสอบเป็น `SUPERADMIN`; acceptance ครบทุก role ยังไม่ทำ | กำลังทำ |
| A-06 | Student portal และค้นหาผู้สมัคร | ค้นหา/รายละเอียด/สละสิทธิ์มี route/UI; public lookup ยังไม่มี OTP/claim verification จึงไม่ผ่านเกณฑ์ privacy | ติดปัญหา (นโยบายยืนยันตัวตน) |
| A-07 | กำหนดเวลา portal | API/settings มีช่วงเวลา Asia/Bangkok และ SUPERADMIN control; ต้องทดสอบช่วงเวลาเปิด/ปิดจริง | รอตรวจ |
| A-08 | รายละเอียดใบสมัคร | route/UI รายละเอียดใบสมัครเชื่อม DB; flow ค้นหา→เปิดรายละเอียดผ่านจริง 1 record และอ่าน banner จาก Settings ได้; ยังไม่ตรวจเทียบทุกสถานะ/record | รอตรวจ |
| A-09 | คะแนนและอันดับ | คะแนนอ่านจาก DB และจำนวน active enrollment คำนวณตามปี/รอบ; tie rule/ผลเทียบ baseline ยังไม่รับรอง | รอตรวจ |
| A-10 | ปีและเวลา | snapshot แปลงปี 2026 เป็น 2569 (Enrollment 15,524, Import 164, Session 27); UI ตั้งปี พ.ศ. | ผ่าน (conversion/count ที่บันทึกไว้) |
| A-11 | สละสิทธิ์ | workflow ผูกคำขอกับ Enrollment และสถานะทำให้ enrollment ยกเลิก; ยังไม่ทดสอบการทำรายการจริง | รอตรวจ |
| A-12 | Import สถานที่ | Preview dry-run, diff ก่อน/หลัง, confirm apply, journal และ rollback API/UI เพิ่มแล้ว; ยังไม่ทดลอง representative file | รอตรวจ |
| A-13 | Import onsite/simulated | ใช้ parser/mapping เดิม, preserve enrollment state, dry-run preview และ apply; ต้องตรวจไฟล์ตัวอย่างจริง | รอตรวจ |
| A-14 | Import reconciliation/history | ปิด soft-delete ข้ามปี/รายการที่หาย, เก็บประวัติและ rollback แบบตรวจ updatedAt; ต้องพิสูจน์ด้วย import/rollback ตัวอย่าง | รอตรวจ |
| A-15 | นักเรียนและใบสมัครหลังบ้าน | UI/API มีค้นหา, source/year/pending filters, summary, pagination, student details และ soft-delete; build ผ่าน; workflow/role จริงยังไม่ทดสอบ | **ย้ายแล้ว — acceptance ค้าง** |
| A-16 | จัดการสถานะ Enrollment | เพิ่มหน้าใบสมัครพร้อมค้นหา/กรองปี/สถานะและ PATCH; build ผ่าน; transition จริงยังไม่ทดสอบ | **ย้ายแล้ว — acceptance ค้าง** |
| A-17 | Check-in session | มี session/location, ยอดและ 10 รายการล่าสุด, refresh 10 วินาที, scan detail และเริ่ม session ใหม่โดยเก็บ log; build ผ่าน; scan จริงยังไม่ทดสอบ | **ย้ายแล้ว — acceptance ค้าง** |
| A-18 | สแกน Check-in | ตรวจสถานะ/ปี/รอบ/สนามและมี DB unique SUCCESS ต่อ enrollment; ยังไม่ run duplicate/error workflow | รอตรวจ |
| A-19 | Dashboard | เพิ่มตัวกรองวันที่, counters, ค่าเฉลี่ย TGAT, hourly stats, top locations และ active session list; build ผ่าน; สูตรยังต้องเทียบผลข้อมูลจริงกับ report เดิม | **ย้ายแล้ว — reconciliation ค้าง** |
| A-20 | Settings/banner/links/ประกาศ | settings/banner API/UI พร้อม MIME และ limit; ยังไม่ทดสอบ upload/update | รอตรวจ |
| A-21 | User management/bootstrap | UI/API สร้าง/แก้ผู้ใช้และ membership; ยังไม่ทดสอบบทบาท/activation จริง | รอตรวจ |
| A-22 | Schema/data migration | snapshot แยก DB ใหม่, data counts เดิมคงอยู่, ปีแปลง, migrations 1–7 deployed; checksum/FK/rollback migration ยังไม่ตรวจเต็ม | รอตรวจ |
| A-23 | Privacy/security | rate limit แบบ DB และ detail cookie; national-ID-only public lookup ยังเสี่ยงสูงและยังไม่มี OTP/claim, MFA/audit log ยังไม่ครบ | ติดปัญหา (ต้องอนุมัติ/ทำ verification) |
| A-24 | Upload/storage | staging/archive private mode และ MIME/size allowlist; retention policy และ backup/restore ยังไม่ทำ | กำลังทำ |
| A-25 | UI ภาษาไทย/คู่มือ | หน้า Admin Web A ใช้ shell กลาง, ปรับ dashboard/students/enrollments/forfeit/check-in ให้ใช้ token/component style ของ template และเพิ่มคู่มือ; visual check ทุก viewport ยังไม่ได้ทำ | **ย้าย UI แล้ว — visual acceptance ค้าง** |
| A-26 | Functional acceptance | build + HTTP smoke ผ่าน; ไม่มีการ execute workflow เขียนข้อมูลด้วย user/ไฟล์ทดสอบที่อนุมัติ | รอตรวจ |
| A-27 | VPS deployment/operations | deploy Next.js + PostgreSQL บน VPS, TLS/proxy, env, migrations, logs, backups, restore/rollback runbook ผ่าน | ยังไม่เริ่ม |
| A-28 | ตรวจรับและ gate ไป B ระบบจริง | ทุกแถว A-01..A-27 ผ่านพร้อมหลักฐาน และเจ้าของระบบตรวจรับก่อนเริ่มเชื่อม API/DB หรือใช้งานจริงของ B; งาน Mockup B ที่เจ้าของระบบอนุญาตทำได้โดยไม่แตะ A | ยังไม่ผ่าน |

### ผลตรวจความครบถ้วนหลังบ้าน Web A เทียบระบบเดิม (5 ตุลาคม 2026)

ตรวจ source ของ Frontend เดิม, API เดิม และ `main-web` แล้วพบช่องว่างและลงมือเติมหน้า Dashboard, Students, Enrollment status, Forfeit, Check-in และ Manual พร้อมปรับหน้าที่แก้ให้เข้ากับ template กลาง รายละเอียดรายการเดิมและผลตรวจอยู่ที่ [reports/web-a-admin-migration-audit.md](reports/web-a-admin-migration-audit.md)

การ implement ช่องว่างตาม source-level audit เสร็จและ `npm run build` ผ่านแล้ว แต่ **ยังห้ามสรุปว่าระบบย้ายครบ 100% หรือผ่านตรวจรับ**: ต้องเทียบสูตร Dashboard กับผลเดิม, ทดสอบบทบาทจริง, import/settings/banner mutations, forfeit transitions, soft-delete และ check-in scan/duplicate/reset ด้วยชุดทดสอบที่ไม่กระทบข้อมูลจริง รวมทั้งตรวจภาพทุก viewport

**งาน Web B รอบนี้ทำได้เฉพาะ Mockup ที่แยกจาก A; การเชื่อม API/DB และการเปิดใช้งานจริงของ B รอให้ปิดช่องว่าง Web A, ทดสอบ role/API และ workflow จริง, และผ่าน acceptance ตาม A-28**

### หลักฐานจากการย้ายรอบปัจจุบัน

- ย้ายข้อมูลเข้าฐานใหม่ `studyunith_gatpat_a_next` โดยไม่เขียนทับฐานต้นทาง; snapshot มี User 6, Student 10,419, Enrollment 15,524, Score 9,764, ExamLocation 19, CheckIn 35, CheckInSession 27 และ SystemSetting 1 รายการ
- ตามข้อกำหนดล่าสุด หน้า `/` ที่พอร์ต 3003 เป็น Landing สองทางเลือก; Card A ไปหน้าค้นหาผู้สมัครเดิม ส่วน Card B ไปต้นแบบ `/webb`; `/gatpat` พาเข้า student portal โดยตรง และมีลิงก์แยกให้เจ้าหน้าที่เข้าสู่หลังบ้าน template กลาง
- หน้า `/gatpat/student/search` ถูกจัด layout ตาม JSX เดิมที่ `/student/search`: hero สูงและตำแหน่งภาพ, TCASEXPO badge, การ์ดค้นหาที่ซ้อนทับ hero, ข้อความ/ปุ่ม/การ์ดผลลัพธ์และสถานะปิด portal; ผลค้นหาแสดงชื่อไทย/อังกฤษในช่องเดิม, การ์ดรายการสมัครใช้ชื่อกิจกรรมเดิม, การ์ดประเภทที่ยังไม่มีข้อมูลเป็นสีเทา และรองรับหลายใบสมัครประเภทเดียวกันโดยแสดงแยกทุกใบ
- ปรับจากภาพตัวอย่างเจ้าของระบบ: การ์ด “ข้อมูลผู้สมัคร” ไม่มีแถบทองด้านซ้าย; ช่องเลขบัตรแสดงค่าที่ผู้ใช้กรอกค้นหาเหมือนภาพอ้างอิง ขณะที่ API ยังคงส่ง identifier แบบ mask; ค่านี้ยังเป็นข้อมูลส่วนบุคคลที่มองเห็นได้บนหน้าจอหลังค้นหา
- ค่า banner ในฐานเดิมเป็น `/uploads/settings-banners/...`; ย้ายไฟล์รูปเดิม 15 ไฟล์จาก `.tmp/public/settings-banners` ของ API ต้นทางไป `.data/uploads/gatpat/banners/legacy` ของ `main-web` ด้วย `npm run migrate:gatpat-banners` และเพิ่ม route อ่าน path เดิมโดยจำกัดชื่อไฟล์/ชนิด MIME; หลังบ้าน A เปลี่ยนภาพปกใหม่ผ่าน Settings แล้ว URL ใหม่ใช้ `/api/gatpat/assets/*` ส่วนหน้าค้นหาและหน้ารายละเอียดอ่านค่าคนละฟิลด์จาก Settings
- รูป fallback `/images/student-search-baner.jpeg` ถูกคัดลอกจาก frontend เดิมและใช้เฉพาะเมื่อไม่มีภาพปกที่กำหนดใน Settings
- ตรวจ flow จริงโดยใช้ record ในฐานเป้าหมายโดยไม่แสดงเลขประจำตัว/ข้อมูลส่วนตัว: `POST /api/gatpat/portal/search` ได้ 200 และพบ 2 ใบสมัคร, `GET /api/gatpat/portal/applications/:id` ด้วย cookie ที่ออกหลังค้นหาได้ 200 พร้อม URL banner รายละเอียดที่ตรงกับ Settings; checksum ของ banner หน้าค้นหาใน storage ใหม่ตรงกับไฟล์ต้นทาง
- หลังปรับ UI ตรวจ `POST /api/gatpat/portal/search` อีกครั้งได้ 200, API มีชื่อไทย/อังกฤษครบ, ส่งชื่อกิจกรรมตรงกับประเภทเดิม และส่งคืนใบสมัคร 2 รายการ; ไม่บันทึกเลขบัตรหรือชื่อบุคคลใน log/checklist
- หลังปรับตามภาพล่าสุด production build ผ่าน; ช่องหมายเลขบัตรใน UI ใช้ค่าค้นหาเดิม และตัดแถบทองด้านซ้ายของการ์ดข้อมูลผู้สมัครออก
- Browser ที่เชื่อมกับงานนี้ไม่พร้อมใช้งาน จึงยังไม่มีหลักฐาน screenshot เทียบ pixel ที่พอร์ต 3001/3003; ใช้ source JSX/CSS, HTML response, asset path/ชนิดไฟล์ และ flow API ตรวจแทน
- `npx prisma validate`, `npx prisma generate`, `npx prisma migrate deploy` และ production `npm run build` ผ่าน; migrations 1–7 ใช้กับฐานเป้าหมายแล้ว
- server ที่ `localhost:3003` (Next dev ที่มีอยู่ใน workspace): `/` และ `/gatpat/student/search` ตอบ HTTP 200, `/gatpat` redirect ไปหน้าค้นหา; public portal settings ตอบ HTTP 200; protected students API ตอบ 401 เมื่อไม่ login; `/gatpat/admin/imports` redirect ไปหน้า login ตามการป้องกัน route
- login บัญชี Web A จริงผ่าน NextAuth แล้วตาม A-03; ยังไม่ได้ทดสอบ import/apply/rollback ด้วยไฟล์ทดสอบ, mutation check-in/forfeit/settings หรือการกู้คืน backup; จึงยังห้ามใช้คำว่า migration ครบ 100% หรือเปิด B ระบบจริง

## เกณฑ์ยืนยันก่อน cutover และตรวจรับ

- ยืนยัน route/permission matrix ทุก API กับเจ้าของระบบ และทดสอบ user ของ A ไม่สามารถอ่าน/แก้ข้อมูล B ได้
- จำนวน Student/Enrollment/Score/CheckIn/ForfeitRequest เทียบก่อนและหลัง; unique barcode, unique check-in และ foreign keys ผ่าน
- ไฟล์ Excel ตัวอย่างของแต่ละชนิดนำเข้าแล้วผลเทียบ baseline; diff, audit และ rollback ตรวจได้
- ทดสอบ login ทุก role, หมดอายุ token, logout, disabled/deleted user และเข้าถึง route/API โดยตรง
- ทดสอบ scan สำเร็จ, ซ้ำข้าม session, barcode ผิด, enrollment ยกเลิก/ถูกลบ, ผิดปี/รอบ/สนาม, session ปิด และ check-in ปิด
- ทดสอบ portal เปิด/ปิดตามเวลาจริง Asia/Bangkok, no-result, detail/score/schedule และ forfeit ซ้ำ/ข้อมูลไม่ครบ/การเปลี่ยนสถานะ
- ตรวจ privacy response, upload MIME/limits, backup restore, deployment และ rollback ไป baseline
- **Gate:** เจ้าของระบบตรวจ A-01..A-27 และอนุมัติรับ A ก่อนจึงเริ่ม Web B ที่เชื่อม API/DB หรือเปิดใช้งานจริง; Web B Mockup แยกขอบเขตทำได้ตามคำสั่งล่าสุด

## ข้อจำกัดและสิ่งที่ต้องยืนยันเพิ่ม

- ผล build/API/DB/runtime ของระบบต้นทางที่ตรวจไว้บันทึกในหัวข้อ “ผลตรวจ runtime จริง”; ไม่ใช่การรับรอง flow migration ใหม่หรือ production readiness
- `README_AUDIT.md` และ `DOCUMENTATION_INDEX.md` ของ API เป็น audit เก่าที่มีข้อสรุปไม่ตรง source ปัจจุบัน; ให้ยึด source และผลตรวจ runtime ที่ระบุวันที่
- README API มีตัวอย่าง env path แบบ absolute ที่ไม่ตรง workspace ปัจจุบัน; ใช้ `.env.example` เป็นรายการชื่อตัวแปรเท่านั้น ห้ามนำ secret ลง blueprint
- ต้องกำหนด policy สำหรับ public portal access ก่อนเปิดระบบจริง เนื่องจากระบบเดิมเปิด endpoint ข้อมูลส่วนบุคคลโดยไม่มีการยืนยันตัวตน; การไม่มี signup ไม่ได้ตอบโจทย์ความปลอดภัยของการค้นข้อมูล
- ยังต้องยืนยันจากเจ้าของระบบเรื่อง manual override ของเวลา portal, เกณฑ์ผู้มีสิทธิ์เป็นตัวหารอันดับ/กติกาคะแนนเสมอ และ retention ของไฟล์ต้นฉบับ import
- สถานะ VPS/domain/storage/monitoring และการทดสอบ restore จริงต้องเก็บหลักฐานใน checklist ระหว่างดำเนินการ ไม่ถือว่าผ่านจากการเขียนแผน

## ผลตรวจ runtime จริง (5 ตุลาคม 2026)

ตรวจใน workspace เครื่องนี้ด้วย Node `v22.14.0`, npm `10.9.2`, PostgreSQL local ที่ port `5432` และ source ปัจจุบัน ผลนี้เป็น snapshot ของ environment ตอนตรวจ ไม่ใช่ผลรับรอง production

### สถานะบริการและ build

| รายการ | ผล | รายละเอียด |
|---|---|---|
| PostgreSQL | ผ่าน | ฟังที่ `5432`; Prisma เชื่อมต่อ database `mydb` ได้ |
| Prisma migrations | ผ่าน | `npx prisma migrate status`: พบ 7 migrations และ schema up to date; ไม่ได้ apply migration |
| API build | ผ่าน | `npm run build` สร้าง Prisma client และ Nest build; เริ่ม compiled API ได้ |
| API runtime | ผ่าน | API ตอบที่ `http://127.0.0.1:3000`; runtime รายงาน development mode แม้สั่ง `start:prod` เพราะค่า `NODE_ENV` ใน env ปัจจุบัน |
| Frontend production build | ผ่าน | `npm run build` compiled, TypeScript ผ่าน, สร้าง 15 static pages และ route manifest ครบ |
| Frontend production process | ผ่าน | build ใหม่หลัง `.env.production` ถูกลบแล้วและ start ที่ `3001`; build โหลดเฉพาะ `.env` ซึ่งชี้ API ไป `localhost:3000` |
| Frontend + local API integration | ผ่าน | production frontend ที่ `3001` ส่ง proxy ไป API local `3000`; page/proxy/public settings ทำงาน |

### Smoke checks ที่ทำจริง

| Surface | Request | ผลที่สังเกต |
|---|---|---|
| API | `GET /health` | `200`; application up และ database up |
| API | `GET /portal/settings` | `200`; อ่าน SystemSetting จริงได้ |
| API | `GET /portal/students/0000000000000` | `404` “ไม่พบข้อมูล” ตามกรณีไม่มี record |
| API | `GET /auth/me` ไม่มี bearer | `401 Missing bearer token` |
| API | `GET /students`, `/dashboard/stats` ไม่มี bearer | `401` ตาม auth guard |
| Frontend | `GET /login`, `/student/search` | `200` |
| Frontend | เปิด `/admin/dashboard` โดยไม่มี session | `307` redirect ตาม route protection |
| Frontend local proxy | `GET /api/backend-proxy/health` ผ่าน port 3001 | `200`; ได้ health จาก API local/database (uptime และ environment ตรงกับ API process local) |
| Frontend local proxy | `GET /api/backend-proxy/portal/settings` ผ่าน port 3001 | `200`; ได้ settings จาก database local |
| Frontend local proxy | ค้น ID ที่ไม่มีอยู่บน dev integration ก่อนหน้า | `404` และ error JSON ถูกส่งกลับผ่าน proxy |
| Frontend asset proxy | ขอ banner JPEG ผ่าน `/api/backend-assets/...` | body เป็น JPEG ถูกต้องและได้ `200` แต่ response header กลับเป็น `Content-Type: application/json` เพราะ Next config กำหนด header นี้กว้างกับ `/api/:path*`; ต้องแก้ก่อนพึ่ง proxy สำหรับรูปภาพ/ไฟล์ |

ไม่มีการ POST/ PATCH/ DELETE เพื่อเปลี่ยนข้อมูล และไม่ดึง/พิมพ์ข้อมูลส่วนตัวของนักเรียนออกจากฐานข้อมูล

### ปริมาณข้อมูลใน local database

นับ record ด้วย Prisma read-only query หลัง API start; เป็นจำนวนรวมโดยไม่อ่านชื่อ/เลขประจำตัว:

| Model | Records |
|---|---:|
| User | 6 |
| Student | 10,419 |
| Enrollment | 15,524 |
| ImportFile | 164 |
| ExamLocation | 19 |
| Score | 9,764 |
| CheckInSession | 27 |
| CheckIn | 35 |
| ForfeitRequest | 0 |
| SystemSetting | 1 |

จำนวนนี้สะท้อน database ที่เชื่อมจาก `.env` ใน local checkout เท่านั้น ไม่ได้ยืนยันว่าเป็นฐาน production หรือสำเนาล่าสุด

### Test results และข้อผิดพลาดที่พบ

- `npm test -- --runInBand`: 64 tests ผ่านจาก 2 suites; 1 suite (`src/app.controller.spec.ts`) โหลดไม่ขึ้น เพราะ Jest resolve `./internal/class.js` จาก generated Prisma client ไม่ได้
- `npm run test:e2e -- --runInBand`: เริ่ม suite ไม่ได้ เพราะ package `@paralleldrive/cuid2` ขาดจาก dependency tree ของ `formidable`/`superagent`; จึงไม่มี e2e assertion ใดถูกรัน
- Jest แสดง TS151002 warning เรื่อง hybrid module และ `isolatedModules` ไม่ได้เปิด
- browser automation connection ไม่มี browser ให้ใช้; การตรวจหน้าเว็บจึงเป็น HTTP/route smoke checks ไม่ใช่ visual interaction test
- ไม่พบ test script ใน frontend package; build เป็นการตรวจ compile/TypeScript ไม่ใช่ behavioral test

### Configuration/runtime findings

1. Backend `.env` มี `JWT_EXPIRATION` และ `THROTTLE_TTL` แต่ `src/env.ts` อ่าน `JWT_EXPIRES_IN` และ `THROTTLE_TTL_SECONDS`; ค่าที่ตั้งด้วยชื่อเดิมจึงถูกละเลยและ fallback เป็น `12h`/`60s` โดยประมาณ ควรปรับชื่อให้ตรงหรือกำหนด mapping ชัดเจน
2. Backend `.env.example` ระบุตัวแปรชื่อใหม่ (`JWT_EXPIRES_IN`, `THROTTLE_TTL_SECONDS`) ซึ่งไม่ตรงกับ `.env` runtime ที่ตรวจ
3. `.env.production` ถูกลบแล้วตามการยืนยันของเจ้าของระบบ; `.env` ปัจจุบันของ frontend ชี้ `localhost:3000` และ backend `.env` ใช้ PostgreSQL local ชื่อ `mydb`. Build เก่าที่ยังเหลือใน `.next` เคยฝังค่า upstream ภายนอกไว้ จึง rebuild ใหม่หลังลบไฟล์และยืนยันผ่าน health/settings ว่าพอร์ต 3001 ใช้ API local แล้ว
4. `next.config.ts` ตั้ง `Content-Type: application/json` สำหรับทุก `/api/:path*`; ทำให้ asset proxy ส่ง bytes JPEG พร้อม MIME type ผิด แม้ไฟล์ภาพยังดาวน์โหลดได้
5. `npm run build` ฝั่ง API เรียก `prisma:generate` และสร้าง/อัปเดต generated client ใน `src/generated/prisma`; ตรวจ diff ของ generated files ก่อน commit build artifacts

### Coverage boundary ก่อนเริ่มเฟสถัดไป

ยืนยันได้ว่า compile, route registration, health/database connectivity, public settings, no-token authorization, public missing-record handling, frontend route protection และ HTTP proxy ทำงานตาม path หลักภายใน `/studyunith` โดย frontend production build ที่ port 3001 เชื่อม API local port 3000 ผ่าน `.env` ปัจจุบัน ส่วนนี้ยังไม่ใช่ full end-to-end verification ของ user journey ทุกบทบาท เพราะไม่มีการใช้บัญชีทดสอบที่ยืนยันแล้วและไม่มีการสร้าง/แก้/ลบข้อมูลจริงเพื่อทดสอบ flow; โดยเฉพาะ login สำเร็จ, user/role CRUD, import Excel, check-in mutation, forfeit workflow, banner upload และ settings update ยังไม่ถูก execute against local DB การทดสอบเหล่านี้ต้องมีชุดบัญชี/ไฟล์ทดสอบและข้อมูลทดสอบที่ตกลงใช้ได้โดยไม่กระทบข้อมูลจริง

## คำตอบและข้อสรุปจากเจ้าของระบบ

| หัวข้อ | คำตอบ/requirement |
|---|---|
| ปีการศึกษา | ใช้ **พ.ศ.**; โค้ดปัจจุบันใช้ปี ค.ศ. จาก `getFullYear()` และ local DB มี `academicYear=2026` จึงต้องวางแผนแปลง/ตรวจข้อมูลเดิมเป็นปี พ.ศ. (เช่น 2569) และแก้ logic ปีใน import, check-in, dashboard และ UI |
| สละสิทธิ์ | นักเรียนหนึ่งคนยื่นได้หลายคำขอตามจำนวนรอบ/ใบสมัครที่สมัครไว้; ขอบเขตควรเป็น **หนึ่งคำขอต่อ Enrollment** ไม่ใช่หนึ่งคำขอต่อคนต่อปี |
| กันเช็คอินซ้ำ | ต้องกันซ้ำข้ามทุก session สำหรับ Enrollment เดียวกัน; enrollment คนละรอบ/ใบสมัครเป็นรายการแยกและตัดสินแยก |
| เวลา | ใช้ timezone **Asia/Bangkok** เป็น timezone ธุรกิจสำหรับเวลาสอบ, เปิด/ปิด portal และการแสดงเวลา |
| เปิดลงทะเบียนตามเวลา | ตีความคำตอบว่าเป็นเวลาเปิด/ปิด **student portal** ตามช่วงเวลาที่ตั้งค่า ไม่ใช่การเปิด API สมัครบัญชีเจ้าหน้าที่; ปัจจุบันมีเพียงสวิตช์ `isUserPortalOpen` และ schema มี `userPortalOpensAt/ClosesAt` แต่ DTO, settings service และ UI ยังไม่อ่าน/เขียน/บังคับใช้เวลาเหล่านี้ |
| การแยกสิทธิ์ | ขอให้ใช้ข้อเสนอ role matrix ด้านล่างเป็นแบบตั้งต้นสำหรับยืนยันก่อนย้าย |

### คำแนะนำความปลอดภัยสำหรับ portal (คำถามเดิมข้อ 2)

**ระดับความเสี่ยงปัจจุบัน: สูงด้านการเปิดเผยข้อมูลส่วนบุคคล** เพราะไม่ต้อง login หรือพิสูจน์ว่าเป็นเจ้าของข้อมูล: ผู้ที่รู้/ได้เลขประจำตัวสามารถเรียก public endpoint เพื่อเห็นชื่อ, email/phone, ใบสมัคร, barcode และคะแนน; endpoint รายละเอียดรับ Enrollment UUID โดยตรงด้วย ความเสี่ยงไม่ใช่การได้สิทธิ์แอดมิน แต่คือบุคคลอื่นเข้าถึงข้อมูลนักเรียน/ผลสอบ และนำไปใช้หลอกลวงหรือเผยแพร่ต่อ ความพยายามเดาแบบอัตโนมัติถูกจำกัดบางส่วนด้วย in-memory rate limit ต่อ IP/path (ค่า default 120 requests/60 วินาที) แต่ไม่ได้ยืนยันผู้สมัคร, จำกัดตามเลขประจำตัว หรือป้องกันหลาย IP/หลาย instance จึงไม่พอเป็นการควบคุมสิทธิ์

ข้อเสนอที่เหมาะกับข้อมูลนี้:

1. ให้ผู้สมัครยืนยันเลขประจำตัว **ร่วมกับ OTP ไปยังช่องทางติดต่อที่ลงทะเบียนและยืนยันไว้ก่อนแล้ว**; ส่ง OTP โดยไม่บอกว่าระบบมี email/เบอร์อะไรเต็ม ๆ หากไม่มีช่องทางยืนยัน ให้ใช้รหัส claim ที่แจกผ่านช่องทางที่เชื่อถือได้หรือให้เจ้าหน้าที่ช่วยยืนยัน แทนการใช้วันเกิดอย่างเดียวซึ่งคนอื่นอาจรู้ได้
2. เมื่อยืนยันแล้ว ออก portal token อายุสั้นที่ scope เฉพาะ Student และบังคับตรวจสิทธิ์กับ enrollment ทุกครั้ง; ห้ามใช้เพียง Enrollment UUID เป็น access control
3. ลด fields ที่คืนจาก API ให้เท่าที่หน้า UI ต้องใช้; ซ่อน/mask email และ phone; ใช้ข้อความ/response ที่ลดการแยกว่ามีเลขประจำตัวนั้นในระบบหรือไม่
4. จำกัด OTP และ search ต่อ IP, student identifier แบบ hash, device/session; มี cooldown, attempt cap, expiry, lockout ชั่วคราว, monitoring และ CAPTCHA เมื่อพฤติกรรมผิดปกติ โดยให้ CAPTCHA เป็นชั้นเสริม
5. ให้ staff/admin ใช้ MFA และ audit log สำหรับการดู/แก้ข้อมูลอ่อนไหว

OWASP จัดการขาด object-level authorization, การเปิดเผย property เกินจำเป็น, การกิน resource ไม่จำกัด และ sensitive business flow ที่ไม่มีมาตรการชดเชย เป็นความเสี่ยง API ที่ควรพิจารณาในการออกแบบนี้: [OWASP API Security Top 10 2023](https://api-security.owasp.org/editions/2023/en/0x11-t10/), [API1 Broken Object Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/), [OWASP MFA Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)

### คำแนะนำ role matrix (คำถามเดิมข้อ 8)

- `SUPERADMIN`: ตั้งค่าระบบและจัดการ ADMIN ได้; ต้องจำกัดบัญชีและบังคับ MFA
- `ADMIN`: จัดการผู้ใช้, settings, import, นักเรียน/enrollment, check-in และคำขอสละสิทธิ์
- `STAFF`: งานประจำวันที่ได้รับมอบหมาย; แนะนำแยกสิทธิ์ import/แก้ข้อมูล/อนุมัติสละสิทธิ์เป็น permission หากต้องจำกัดความเสียหายจากบัญชีเจ้าหน้าที่
- `CHECKIN`: เข้าเฉพาะหน้าสแกน, อ่าน session ที่อนุญาตและส่ง check-in; ไม่มีสิทธิ์เริ่ม session/ดู dashboard หรือข้อมูลที่ไม่จำเป็น เว้นแต่ธุรกิจต้องการ
- `VIEWER`: อ่าน dashboard/report อย่างเดียว และ landing page เป็น dashboard ไม่ใช่ check-in
- `USER`: ยังไม่มี flow นักเรียน login ที่ชัดเจน; แยก student verification ออกจาก employee account หรือถ้าไม่ใช้ให้เลิก map เป็น session role นักเรียน

ปัจจุบัน frontend ยุบ role เป็น `admin/staff/student`; ทุก staff-like role ถูกพาไป `/admin/checkin` และการป้องกันใน frontend ตรวจ session cookie เป็นหลัก ส่วน API guards จึงต้องเป็น source of truth และ UI ควรใช้ permission matrix เดียวกัน

## คำถามค้าง/ตัวอย่างประกอบ

1. **เช็คอินควรยอมรับ enrollment สถานะใด?** ตัวอย่าง: ถ้า staff mark คำขอสละสิทธิ์ `COMPLETED` ระบบเปลี่ยน enrollment เป็น `CANCELLED` แต่ barcode เดิมยังอยู่ ถ้านักเรียนถือ barcode นั้นมาสแกน API ปัจจุบันยังตรวจปี/รอบ/สถานที่และอาจบันทึก SUCCESS เพราะไม่ได้ตรวจ status หรือ `deletedAt` ด้วย ต้องการให้ระบบปฏิเสธ `CANCELLED`, `DRAFT` และ soft-deleted enrollment หรือไม่? ข้อเสนอ: อนุญาตเฉพาะ `REGISTERED`/`PAID` ที่ไม่ถูก soft-delete
2. **ผูก session กับสถานที่อย่างไร?** ตัวอย่าง: เจ้าหน้าที่ประจำสนามเชียงใหม่เปิด session แต่ไม่เลือก `examLocationId`; barcode ของผู้สมัครสนามภูเก็ตที่ปี/รอบตรงกันก็อาจผ่านได้ ข้อเสนอ: ให้แต่ละจุด check-in ต้องเลือกสนาม และปฏิเสธ barcode ที่คนละสนาม ยกเว้นตั้งใจสร้าง session กลางแบบไม่ผูกสนาม
3. **ฐานจำนวนผู้เข้าสอบ/อันดับในหน้าคะแนนควรเป็นอะไร?** ดูบันทึกจริงด้านล่าง; หน้า UI ตอนนี้โชว์ total nationwide คงที่ `7,028` และจำนวนระดับจังหวัดดึงจาก seat capacity ซึ่ง local DB ปัจจุบันเป็น 0 ทั้งหมด ต้องการจำนวนผู้มีคะแนน, ผู้สมัครที่ active หรือความจุสนามเป็นตัวหาร?
4. คำตอบเรื่องตั้งเวลาเปิดลงทะเบียนหมายถึง student portal ตามที่ตีความหรือไม่? ถ้าใช่ ช่วงเปิด/ปิดต้องตั้งวันเวลาเริ่ม/สิ้นสุดที่ไหน และ manual close override ตารางเวลาได้หรือไม่?
5. คำถามเดิมเรื่อง bootstrap เป็นคนละฟีเจอร์: `POST /register` ใช้สร้าง **บัญชีเจ้าหน้าที่/SUPERADMIN** เมื่อไม่มี active user ไม่ใช่เปิดรับสมัครนักเรียน ต้องการให้คงวิธี bootstrap/recovery แบบใด? อย่าเปิด anonymous bootstrap ตามเวลาเดียวกับ student portal

### จุด UI/ตัวอย่าง record สำหรับตรวจคะแนนจาก local DB

- หน้า: `/student/exam/[id]` โดย `{id}` คือ `Enrollment.id`; ส่วนผลอยู่ในการ์ด **“รายงานผลการสอบ”** กด **“ตรวจสอบผลคะแนน”** เพื่อเปิดตารางคะแนน, ลำดับระดับจังหวัด/สนาม และลำดับรวม
- ตัวอย่างใน local DB ที่มี score และ ranking: Enrollment ID `0dcf9a74-83d4-43d4-a4a3-fbf39d06c24b`; เปิด `http://localhost:3001/student/exam/0dcf9a74-83d4-43d4-a4a3-fbf39d06c24b`
- ฟิลด์ที่ตรวจโดยไม่อ่านข้อมูลระบุตัวนักเรียน: ปีใน DB `2026` (ระบบใหม่ต้อง map เป็น พ.ศ.), รอบ `MORNING`, source `SIMULATED_EXCEL`, location code `8`, TGAT `67.2222`, rank รวม `74`, rank สถานที่ `73`
- UI แสดง rank จาก `Score.rankingOverall`/`rankingLocation`; แถวจำนวนผู้เข้าสอบระดับสนามมาจาก `ExamLocation.seatCapacity` รวมในจังหวัด แต่ผลรวม capacity ของ local DB เป็น `0` ทุกสนาม; แถวจำนวนผู้เข้าสอบรวมถูก hardcode `7,028` ใน `ExamDetailClient.tsx` แม้ API ส่ง `totalNationwide` มาแล้ว
- ตรวจหน้า URL ตัวอย่างผ่าน Frontend local แล้วได้ HTTP `200` และหน้าแสดง section/ปุ่มตรวจคะแนน; ค่าในตารางจะแสดงหลังผู้ใช้กดปุ่ม (ตัวเลข `7,028` เป็นข้อความใน client-side panel)
- ID นี้เป็น record จริงจาก local DB เพื่อให้เจ้าของระบบเปิดตรวจเอง ควรหลีกเลี่ยงส่ง URL/ข้อมูลหน้า detail ต่อให้บุคคลอื่น เพราะ endpoint ปัจจุบันยัง public

### ตรวจสอบพฤติกรรม import ที่มีอยู่ (คำถามเดิมข้อ 10)

พบว่า **มี upsert อยู่แล้ว** และใช้ key เหล่านี้: Student ตาม nationalId (บางแถวใช้ fallback จากชื่อ), Enrollment ตาม student + ปี + รอบ + source, Location ตาม code และ Score ตาม enrollmentId ดังนั้นการนำ key เดิมเข้าซ้ำจะ update record เดิม ส่วน key ใหม่จะเพิ่มรายการใหม่

อย่างไรก็ดี วิธีปัจจุบันยังไม่ตรงเป้าหมาย “อัปเดตได้โดยข้อมูลไม่ถูกทับ/หาย” ครบถ้วน:

- Student field ที่นำเข้ามา update profile เดิม; Enrollment update บังคับ status กลับเป็น `REGISTERED` และเขียน location/notes/date/import reference ใหม่; Score upsert เขียนคะแนน/ranks ใหม่; Location update เขียนชื่อ/จังหวัด/ที่อยู่/capacity/schedule ใหม่
- `softDeleteHistoricalEnrollments()` ตั้ง soft-delete ให้ enrollment ของ Student คนนั้นที่ academicYear ไม่เท่าปีของไฟล์ import โดยไม่กรอง sourceType; reimport ปีเดียวกันอาจซ่อนประวัติปีอื่นจาก portal
- การ import source เดิมอาจ soft-delete enrollment ของรอบที่ไม่พบในไฟล์ใหม่ภายในปี/source เดียวกัน จึงถือว่าไฟล์บางชนิดเป็น authoritative snapshot
- upload ต้นฉบับถูกลบหลังประมวลผล; เก็บ metadata/error/header snapshot แต่ยังไม่มี change diff และ rollback ต่อแถว

ข้อเสนอ: คง upsert เพื่อไม่สร้าง duplicate แต่เพิ่ม preview diff (เพิ่ม/เปลี่ยน/จะ soft-delete พร้อมค่าก่อน-หลัง), ให้ผู้ใช้ยืนยันก่อน apply, เก็บ import snapshot/change journal ที่ย้อนกลับได้, แยก field ที่ import เป็นเจ้าของจาก field ที่ staff แก้เอง, และไม่ soft-delete ข้ามปีโดยอัตโนมัติ ต้องคงการกู้ข้อมูล/ประวัติได้ หลัง review ให้เจ้าของระบบยืนยันว่าจะให้ไฟล์ใหม่ลบรายการที่หายไปในไฟล์เดิมหรือให้ mark “ไม่อยู่ในชุดล่าสุด” แทน

## จุดเริ่มต้นอ่าน source

- Frontend: `../demo-app-register-gat-pat/app`, `../demo-app-register-gat-pat/auth.ts`, `../demo-app-register-gat-pat/proxy.ts`, `../demo-app-register-gat-pat/lib/backend-api.ts`
- Backend: `../demo-app-register-gat-pat-api/src/main.ts`, `src/app.module.ts`, controllers/services ตามโดเมน, `schema.prisma`, `prisma/migrations`
- Target: `src/app`, `src/server/auth-options.ts`, `package.json`, `docs/sdlc/02-design`
