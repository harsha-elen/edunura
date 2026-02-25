# LMS Deployment Plan with Caddy

## Domain Structure
| Subdomain | Service | Port |
|-----------|---------|------|
| lms.com | Landing Page (Next.js) | 3000 |
| admin.lms.com | Admin Portal (React) | 3001 |
| teacher.lms.com | Teacher Portal (React) | 3002 |
| lms.com/app | Student Portal (React) | 3003 |
| api.lms.com | Backend API | 5000 |

---

# Option 1: Docker Deployment (Recommended)

## Prerequisites
- Docker installed on server
- Domain pointing to server IP
- MySQL (can run in Docker or as managed service)

## Step 1: Create Project Structure
```
lms-deploy/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   └── .env.production
├── frontend/
│   ├── Dockerfile.landing
│   ├── Dockerfile.admin
│   ├── Dockerfile.teacher
│   ├── Dockerfile.student
│   └── .env.production
├── caddy/
│   └── Caddyfile
└── nginx/
    └── Dockerfile (for static files - optional)
```

## Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env.production
    restart: unless-stopped
    networks:
      - lms-network
    depends_on:
      - mysql

  # Frontend: Landing Page
  landing:
    build:
      context: ./frontend/landing
      dockerfile: ../Dockerfile.landing
    ports:
      - "3000:3000"
    restart: unless-stopped
    networks:
      - lms-network

  # Frontend: Admin Portal
  admin:
    build:
      context: ./frontend/admin
      dockerfile: ../Dockerfile.admin
    ports:
      - "3001:80"
    restart: unless-stopped
    networks:
      - lms-network

  # Frontend: Teacher Portal
  teacher:
    build:
      context: ./frontend/teacher
      dockerfile: ../Dockerfile.teacher
    ports:
      - "3002:80"
    restart: unless-stopped
    networks:
      - lms-network

  # Frontend: Student Portal
  student:
    build:
      context: ./frontend/student
      dockerfile: ../Dockerfile.student
    ports:
      - "3003:80"
    restart: unless-stopped
    networks:
      - lms-network

  # MySQL Database
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: your_strong_root_password
      MYSQL_DATABASE: lms_database
      MYSQL_USER: lms_user
      MYSQL_PASSWORD: your_strong_db_password
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped
    networks:
      - lms-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache (optional)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - lms-network

networks:
  lms-network:
    driver: bridge

volumes:
  mysql_data:
```

## Step 3: Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Copy .env file (create .env.production)
COPY .env.production .env

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
```

## Step 4: Frontend Dockerfiles

```dockerfile
# frontend/Dockerfile.landing (Next.js)
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

```dockerfile
# frontend/Dockerfile.admin (React + Vite)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV VITE_API_BASE_URL=https://api.lms.com/api
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf for React apps
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (optional, can also use Caddy)
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Step 5: Caddyfile Configuration

```Caddyfile
# Global options
{
    email admin@lms.com
    auto_https off
}

# Backend API
api.lms.com {
    reverse_proxy localhost:5000
    header X-Real-IP {remote}
    header X-Forwarded-For {remote}
    header X-Forwarded-Proto {scheme}
}

# Landing Page (Main Domain)
lms.com {
    reverse_proxy localhost:3000
    header X-Real-IP {remote}
    header X-Forwarded-For {remote}
}

# Admin Portal
admin.lms.com {
    reverse_proxy localhost:3001
    header X-Real-IP {remote}
    header X-Forwarded-For {remote}
}

# Teacher Portal
teacher.lms.com {
    reverse_proxy localhost:3002
    header X-Real-IP {remote}
    header X-Forwarded-For {remote}
}

# Student Portal (sub-path)
lms.com {
    handle_path /app/* {
        reverse_proxy localhost:3003
    }
}
```

## Step 6: Build & Run

```bash
# 1. Build all Docker images
docker-compose build

# 2. Start all services
docker-compose up -d

# 3. Check logs
docker-compose logs -f

# 4. Run database migrations
docker-compose exec backend npm run db:setup

# 5. Seed admin user
docker-compose exec backend npm run db:seed
```

---

# Option 2: Manual Deployment (Without Docker)

## Prerequisites
- Node.js 20+ installed
- MySQL 8.0 installed
- Nginx or Caddy for reverse proxy
- Domain pointing to server

## Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian-bookworm.b.list' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

## Step 2: MySQL Setup

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE lms_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON lms_database.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 3: Deploy Backend

```bash
# Create deployment directory
sudo mkdir -p /var/www/lms
cd /var/www/lms

# Clone or copy your project
# (Assuming you're deploying from local - copy the project folder)
# For this example, let's assume you're in your project root

# Navigate to backend
cd backend

# Install production dependencies
npm ci --only=production

# Copy and configure environment
cp .env.example .env.production
nano .env.production  # Edit with production values

# Build TypeScript
npm run build

# Create systemd service
sudo nano /etc/systemd/system/lms-backend.service
```

### Backend Systemd Service

```ini
[Unit]
Description=LMS Backend API
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/lms/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=unless-stopped
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start backend
sudo systemctl daemon-reload
sudo systemctl enable lms-backend
sudo systemctl start lms-backend

# Check status
sudo systemctl status lms-backend
```

## Step 4: Deploy Frontend Apps

```bash
# Go to project root
cd /var/www/lms

# Deploy Landing Page (Next.js)
cd frontend/landing
npm install
npm run build
# Create systemd service for Next.js
sudo nano /etc/systemd/system/lms-landing.service

[Unit]
Description=LMS Landing Page
After=network.target
[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/lms/frontend/landing
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=unless-stopped
RestartSec=10
[Install]
WantedBy=multi-user.target

sudo systemctl enable lms-landing
sudo systemctl start lms-landing

# Deploy Admin Portal
cd /var/www/lms/frontend/admin
npm install
npm run build
# Serve with nginx or node
# For simple serving, create similar systemd service using serve:
# npm install -g serve
# serve -s dist -l 3001

# Same for Teacher and Student portals
cd /var/www/lms/frontend/teacher
npm install && npm run build

cd /var/www/lms/frontend/student
npm install && npm run build

# Install serve globally for static sites
sudo npm install -g serve
```

### Create systemd services for each portal

```bash
# Admin Portal
sudo nano /etc/systemd/system/lms-admin.service
[Unit]
Description=LMS Admin Portal
After=network.target
[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/lms/frontend/admin
ExecStart=/usr/bin/npx serve -s dist -l 3001
Restart=unless-stopped
[Install]
WantedBy=multi-user.target

# Teacher Portal
sudo nano /etc/systemd/system/lms-teacher.service
[Unit]
Description=LMS Teacher Portal
After=network.target
[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/lms/frontend/teacher
ExecStart=/usr/bin/npx serve -s dist -l 3002
Restart=unless-stopped
[Install]
WantedBy=multi-user.target

# Student Portal
sudo nano /etc/systemd/system/lms-student.service
[Unit]
Description=LMS Student Portal
After=network.target
[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/lms/frontend/student
ExecStart=/usr/bin/npx serve -s dist -l 3003
Restart=unless-stopped
[Install]
WantedBy=multi-user.target

# Enable all services
sudo systemctl daemon-reload
sudo systemctl enable lms-landing lms-admin lms-teacher lms-student
sudo systemctl start lms-landing lms-admin lms-teacher lms-student
```

## Step 5: Configure Caddy

```bash
# Edit Caddyfile
sudo nano /etc/caddy/Caddyfile
```

```Caddyfile
{
    email admin@lms.com
    auto_https off
}

# API Backend
api.lms.com {
    reverse_proxy localhost:5000
    header X-Real-IP {remote}
    header X-Forwarded-For {remote}
    header X-Forwarded-Proto {scheme}
}

# Landing Page
lms.com {
    reverse_proxy localhost:3000
    header X-Real-IP {remote}
    header X-Forwarded-For {remote}
}

# Admin Portal
admin.lms.com {
    reverse_proxy localhost:3001
    header X-Real-IP {remote}
    header X-Forwarded-For {remote}
}

# Teacher Portal
teacher.lms.com {
    reverse_proxy localhost:3002
    header X-Real-IP {remote}
    header X-Forwarded-For {remote}
}

# Student Portal (sub-path)
lms.com {
    handle_path /app/* {
        reverse_proxy localhost:3003
    }
}
```

```bash
# Validate and reload Caddy
sudo caddy validate
sudo systemctl reload caddy
```

---

# Database Migration & Export Guide

## Running Migrations (Both Docker & Manual)

### Option A: Using npm scripts (already in your project)

```bash
# In backend directory
cd backend

# Setup database (creates tables)
npm run db:setup

# Seed admin user
npm run db:seed
```

### Option B: Manual SQL migration

If you need to manually run migrations:

```bash
# Login to MySQL
mysql -u lms_user -p lms_database

# Run SQL directly
SOURCE /path/to/your/migration.sql;
```

## Exporting Database

### Export entire database
```bash
mysqldump -u lms_user -p lms_database > lms_backup_$(date +%Y%m%d).sql
```

### Export specific tables
```bash
mysqldump -u lms_user -p lms_database users courses enrollments > tables_backup.sql
```

### Import database
```bash
mysql -u lms_user -p lms_database < lms_backup_20240101.sql
```

## Creating Migration Scripts

If you need to add new migrations, create a script:

```typescript
// backend/src/scripts/migrate_your_feature.ts
import sequelize from '../config/database';
import { QueryInterface } from 'sequelize';

async function migrate() {
    const queryInterface: QueryInterface = sequelize.getQueryInterface();
    
    // Example: Add new column
    await queryInterface.addColumn('Courses', 'new_column', {
        type: Sequelize.STRING,
        allowNull: true
    });
    
    console.log('Migration completed');
    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
```

---

# Quick Reference Commands

## Docker Deployment
```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f backend

# Run migrations
docker-compose exec backend npm run db:setup

# Seed admin
docker-compose exec backend npm run db:seed

# Backup database
docker exec lms-deploy-mysql-1 mysqldump -u root -p lms_database > backup.sql
```

## Manual Deployment
```bash
# Restart all services
sudo systemctl restart lms-backend lms-landing lms-admin lms-teacher lms-student

# Check status
sudo systemctl status lms-backend

# View logs
sudo journalctl -u lms-backend -f

# Backup database
mysqldump -u lms_user -p lms_database > /backup/lms_$(date +%Y%m%d).sql
```
