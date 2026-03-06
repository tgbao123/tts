# VoiceSensei — Deploy trên Ubuntu

## Yêu cầu
- Ubuntu 20.04+ 
- Docker + Docker Compose
- RAM ≥ 2GB

## Các bước

### 1. Clone repo
```bash
git clone -b develop https://github.com/tgbao123/tts.git
cd tts
```

### 2. Tạo file .env
```bash
cp .env.example .env
nano .env
```

Điền:
```
SUPABASE_URL=https://rcebhmfetjpmmicfafxr.supabase.co
SUPABASE_KEY=sb_publishable_xxx...
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8000
NEXT_PUBLIC_SUPABASE_URL=https://rcebhmfetjpmmicfafxr.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_xxx...
```

> ⚠️ `NEXT_PUBLIC_API_URL` phải là IP/domain public của server

### 3. Build & Run
```bash
docker compose up -d --build
```

### 4. Kiểm tra
```bash
# Backend
curl http://localhost:8000/health

# Frontend
curl -I http://localhost:3000
```

### 5. Mở firewall
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
```

## Truy cập
- Frontend: `http://YOUR_IP:3000`
- Backend API: `http://YOUR_IP:8000/docs`

## Cập nhật
```bash
cd tts
git pull origin develop
docker compose up -d --build
```

## Logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
```
