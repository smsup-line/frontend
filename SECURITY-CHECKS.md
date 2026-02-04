# Security Checks and Malicious Process Removal

## Container Name: `sfadmin-nextjs`

### 1. ตรวจสอบ Container ที่รันอยู่

#### ตรวจสอบ processes ที่น่าสงสัย
```bash
docker exec sfadmin-nextjs ps aux | grep -E 'sh|mining|monero|xmr|pool|base64'
```

#### ตรวจสอบ network connections
```bash
docker exec sfadmin-nextjs netstat -tulpn | grep -E 'supportxmr|205.185.127.97|66.96.20.147'
```

#### ตรวจสอบ listening ports
```bash
docker exec sfadmin-nextjs netstat -tulpn
```

#### ตรวจสอบ processes ที่ใช้ CPU สูง
```bash
docker exec sfadmin-nextjs ps aux --sort=-%cpu | head -20
```

### 2. Kill Malicious Processes (ถ้าพบ)

```bash
# Kill mining processes
docker exec sfadmin-nextjs pkill -f mining
docker exec sfadmin-nextjs pkill -f monero
docker exec sfadmin-nextjs pkill -f xmr
docker exec sfadmin-nextjs pkill -f c3pool

# Kill suspicious shell processes
docker exec sfadmin-nextjs pkill -f '/bin/sh'
docker exec sfadmin-nextjs pkill -f 'base64'

# Kill processes by PID (ถ้ารู้ PID)
docker exec sfadmin-nextjs kill -9 <PID>
```

### 3. Rebuild Container ใหม่

```bash
# Stop และ remove container
docker-compose -f docker-compose.prod.yaml down

# Rebuild จาก scratch (no cache)
docker-compose -f docker-compose.prod.yaml build --no-cache

# Start ใหม่
docker-compose -f docker-compose.prod.yaml up -d
```

### 4. ตรวจสอบ Dependencies

```bash
# ตรวจสอบ security vulnerabilities
npm audit

# ตรวจสอบ suspicious packages
npm list | grep -E 'mining|monero|xmr|pool'

# ตรวจสอบ package-lock.json
grep -r "mining\|monero\|xmr\|pool" package-lock.json
```

### 5. ตรวจสอบ Logs

```bash
# ดู logs ของ container
docker logs sfadmin-nextjs

# ดู logs แบบ real-time
docker logs -f sfadmin-nextjs

# ตรวจสอบ error logs
docker logs sfadmin-nextjs 2>&1 | grep -i error
```

### 6. ตรวจสอบ Filesystem

```bash
# ตรวจสอบไฟล์ที่ถูกสร้างโดย malicious processes
docker exec sfadmin-nextjs find /tmp -type f -name "*mining*" -o -name "*monero*" -o -name "*xmr*"

# ตรวจสอบไฟล์ที่ execute ได้
docker exec sfadmin-nextjs find /tmp -type f -executable

# ตรวจสอบ cron jobs
docker exec sfadmin-nextjs crontab -l
```

### 7. ตรวจสอบ Environment Variables

```bash
# ดู environment variables
docker exec sfadmin-nextjs env | grep -E 'NEXT_PUBLIC|API_URL|MINING|MONERO|XMR'
```

### 8. ตรวจสอบ Network Traffic

```bash
# ตรวจสอบ connections ที่ออกไป
docker exec sfadmin-nextjs ss -tulpn

# ตรวจสอบ DNS queries
docker exec sfadmin-nextjs cat /etc/resolv.conf
```

## คำแนะนำเพิ่มเติม

1. **ตรวจสอบ Docker Image**: ตรวจสอบว่า Docker image ไม่ถูก compromise
2. **ตรวจสอบ Dockerfile**: ตรวจสอบว่า Dockerfile ไม่มี malicious code
3. **ตรวจสอบ docker-compose.yaml**: ตรวจสอบว่าไม่มี malicious environment variables
4. **Backup**: ทำ backup ก่อน rebuild container
5. **Monitor**: ตรวจสอบ logs และ processes อย่างสม่ำเสมอ

## Blocked IPs และ Domains

- IPs: `205.185.127.97`, `66.96.20.147`
- Domains: `telemetry`, `analytics`, `webmail.eicat.ca`, `auto.c3pool.org`, `c3pool`, `supportxmr.com`, `monero`, `xmr`, `pool`

## Blocked Commands

- `/bin/sh`, `bash`, `base64`, `curl`, `wget`, `nc`, `netcat`, `pkill`, `kill`, `mining`, `monero`, `xmr`

