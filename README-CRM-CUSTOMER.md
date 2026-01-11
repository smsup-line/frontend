# CRM Customer Frontend - คู่มือการใช้งาน

## ขั้นตอนการรันโปรเจ็ค

### 1. ติดตั้ง Dependencies

```bash
npm install --force
```

หรือ

```bash
npm install
```

> **หมายเหตุ:** ใช้ `--force` ถ้ามีปัญหา dependency conflicts ตามที่ระบุใน README เดิม

### 2. ตั้งค่า Environment Variables

ไฟล์ `.env.local` ถูกสร้างไว้แล้วในโปรเจ็ค โดยมีค่าตั้งต้นดังนี้:

- `NEXT_PUBLIC_API_URL=http://localhost:8080` - URL ของ API Backend
- Cloudinary credentials สำหรับอัพโหลดรูปภาพ

หากต้องการเปลี่ยนค่า สามารถแก้ไขไฟล์ `.env.local` ได้

### 3. รันโปรเจ็คในโหมด Development

```bash
npm run dev
```

โปรเจ็คจะรันที่: **http://localhost:3000**

### 4. เข้าถึงระบบ

1. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`
2. สำหรับระบบ CRM Customer:
   - หน้า Login: `http://localhost:3000/crm-customer/login`
   - หน้าหลัก: `http://localhost:3000/crm-customer/stores`

## โครงสร้างระบบ

### หน้าหลักของระบบ CRM Customer:

- **ร้านค้า** (`/crm-customer/stores`) - จัดการข้อมูลร้านค้า
- **สาขา** (`/crm-customer/branches`) - จัดการข้อมูลสาขา
- **ผู้ดูแลระบบ** (`/crm-customer/admins`) - จัดการผู้ดูแลระบบ
- **ลูกค้า** (`/crm-customer/customers`) - จัดการข้อมูลลูกค้า
- **ประวัติคะแนนสะสม** (`/crm-customer/points-history`) - ดูประวัติคะแนนสะสม

## คำสั่งอื่นๆ

### Build สำหรับ Production

```bash
npm run build
```

### รัน Production Build

```bash
npm start
```

### Lint Code

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

## ข้อกำหนดเบื้องต้น

- Node.js 16.x หรือสูงกว่า
- npm หรือ yarn
- API Backend ต้องรันที่ `http://localhost:8080` (หรือตามที่ตั้งค่าใน `.env.local`)

## การแก้ไขปัญหา

### ปัญหา: Port 3000 ถูกใช้งานแล้ว

แก้ไขโดยเปลี่ยน port:
```bash
npm run dev -- -p 3001
```

### ปัญหา: API ไม่เชื่อมต่อ

1. ตรวจสอบว่า API Backend รันอยู่ที่ `http://localhost:8080`
2. ตรวจสอบ Swagger API Document: `http://localhost:8080/swagger/index.html`
3. ตรวจสอบค่า `NEXT_PUBLIC_API_URL` ในไฟล์ `.env.local`

### ปัญหา: Cloudinary Upload ไม่ทำงาน

ตรวจสอบว่า environment variables สำหรับ Cloudinary ถูกตั้งค่าถูกต้องใน `.env.local`

## หมายเหตุ

- ระบบใช้ Next.js 16.0.2 และ React 19.2.0
- ใช้ TanStack Table สำหรับ Data Grid
- ใช้ React Hook Form + Zod สำหรับ Form Validation
- ใช้ Cloudinary สำหรับ Image Upload




