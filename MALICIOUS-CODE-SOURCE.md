# Crypto Mining Source Investigation

## สรุปผลการตรวจสอบ

จากการตรวจสอบ codebase **ไม่พบ malicious code ในไฟล์ source code** ของโปรเจค

## Crypto Mining มาจากไหน?

### 1. **Dependencies ที่ถูก Compromised (น่าจะเป็นสาเหตุหลัก)**

Malicious code อาจมาจาก:
- **node_modules** - Dependencies ที่ถูก compromised
- **package-lock.json** - Package ที่ถูก inject malicious code
- **Postinstall scripts** - Scripts ที่รันอัตโนมัติหลัง npm install

**วิธีตรวจสอบ:**
```bash
# ตรวจสอบ postinstall scripts
find node_modules -name "package.json" -exec grep -l "postinstall" {} \; | head -20

# ตรวจสอบ suspicious packages
npm audit
npm list | grep -E 'mining|monero|xmr|pool'

# ตรวจสอบ package-lock.json
grep -r "mining\|monero\|xmr\|c3pool" package-lock.json
```

### 2. **Container ที่ถูก Compromise**

Malicious process อาจรันอยู่แล้วใน container:
- Process ที่ถูก inject ตั้งแต่ก่อนหน้า
- Malicious code ที่ถูก download และ execute จาก external server
- Cron jobs ที่ถูก setup โดย malicious code

**วิธีตรวจสอบ:**
```bash
# ตรวจสอบ processes
docker exec sfadmin-nextjs ps aux | grep -E 'sh|mining|monero|xmr|pool'

# ตรวจสอบ cron jobs
docker exec sfadmin-nextjs crontab -l

# ตรวจสอบ network connections
docker exec sfadmin-nextjs netstat -tulpn | grep -E '205.185.127.97|66.96.20.147'
```

### 3. **Build Process ที่ถูก Inject**

Malicious code อาจถูก inject ระหว่าง build:
- Environment variables ที่ถูก inject
- Build scripts ที่ถูก modify
- Docker image base ที่ถูก compromise

**วิธีตรวจสอบ:**
```bash
# ตรวจสอบ Dockerfile
grep -i "curl\|wget\|base64\|sh" Dockerfile

# ตรวจสอบ environment variables
docker exec sfadmin-nextjs env | grep -E 'NEXT_PUBLIC|API_URL|MINING'
```

## ไฟล์ที่ควรตรวจสอบ

### 1. Source Code Files
- ✅ `package.json` - **ไม่มี postinstall/preinstall scripts**
- ✅ `Dockerfile` - **ไม่มี suspicious commands**
- ✅ Source files - **ไม่พบ malicious code**

### 2. Dependencies
- ⚠️ `node_modules/` - **ต้องตรวจสอบ**
- ⚠️ `package-lock.json` - **ต้องตรวจสอบ suspicious packages**

### 3. Container
- ⚠️ Running processes - **ต้องตรวจสอบ**
- ⚠️ Network connections - **ต้องตรวจสอบ**
- ⚠️ Cron jobs - **ต้องตรวจสอบ**

## คำแนะนำการแก้ไข

### 1. ตรวจสอบ Dependencies
```bash
# รันสคริปต์ตรวจสอบ
./find-malicious-source.sh

# ตรวจสอบ npm audit
npm audit
npm audit fix

# ตรวจสอบ suspicious packages
npm list --depth=0 | grep -E 'mining|monero|xmr'
```

### 2. Kill Malicious Processes
```bash
# Kill processes ที่น่าสงสัย
docker exec sfadmin-nextjs pkill -f mining
docker exec sfadmin-nextjs pkill -f monero
docker exec sfadmin-nextjs pkill -f xmr
docker exec sfadmin-nextjs pkill -f '/bin/sh'
```

### 3. Rebuild Container
```bash
# Stop container
docker-compose -f docker-compose.prod.yaml down

# Rebuild จาก scratch (no cache)
docker-compose -f docker-compose.prod.yaml build --no-cache

# Start ใหม่
docker-compose -f docker-compose.prod.yaml up -d
```

### 4. ตรวจสอบ Container
```bash
# ตรวจสอบ processes
docker exec sfadmin-nextjs ps aux

# ตรวจสอบ network
docker exec sfadmin-nextjs netstat -tulpn

# ตรวจสอบ logs
docker logs sfadmin-nextjs | grep -i error
```

## สรุป

**Crypto mining น่าจะมาจาก:**
1. ✅ **Dependencies ที่ถูก compromised** (ใน node_modules) - **น่าจะเป็นสาเหตุหลัก**
2. ✅ **Container ที่ถูก compromise** (มี malicious process รันอยู่แล้ว)
3. ✅ **Build process ที่ถูก inject** (ระหว่าง build)

**การแก้ไข:**
1. Kill malicious processes ที่รันอยู่
2. Rebuild container จาก scratch
3. ตรวจสอบและ update dependencies
4. ใช้ error handler ที่ block malicious commands

