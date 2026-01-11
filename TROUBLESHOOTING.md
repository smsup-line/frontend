# แก้ปัญหา 404 Error สำหรับ /crm-customer/login

## วิธีแก้ปัญหา

### 1. ลบ Next.js Cache และ Restart Dev Server

```bash
# หยุด dev server (กด Ctrl+C)

# ลบ cache
rm -rf .next

# รันใหม่
npm run dev
```

### 2. ตรวจสอบว่า Dev Server รันอยู่

```bash
# ตรวจสอบว่า port 3000 ถูกใช้งาน
lsof -i :3000
```

### 3. ลองเข้าที่ URL ใหม่

หลังจาก restart แล้วลองเข้า:
- http://localhost:3000/crm-customer/login

### 4. ตรวจสอบ Console/Terminal

ดูว่า terminal ที่รัน `npm run dev` มี error message อะไรหรือไม่

### 5. ลองทดสอบ Route อื่น

ลองเข้า:
- http://localhost:3000/crm-customer/stores
- http://localhost:3000/crm-customer/admins

ถ้า route อื่นเข้าได้ แสดงว่า login route อาจมีปัญหา

### 6. Hard Refresh Browser

กด Ctrl+Shift+R (Windows/Linux) หรือ Cmd+Shift+R (Mac) เพื่อ clear browser cache

## ไฟล์ที่ควรมี

✅ app/crm-customer/login/page.jsx
✅ app/crm-customer/login/layout.jsx

ทั้งสองไฟล์มีอยู่แล้วและถูกต้อง




