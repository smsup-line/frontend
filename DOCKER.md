# Docker Deployment Guide

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Node.js 20+ (for local development)

## Quick Start

### 1. Prepare Environment Variables

```bash
# Copy the example environment file
cp .env.production.example .env.production

# Edit .env.production with your actual values
nano .env.production
```

Required environment variables:
- `NEXT_PUBLIC_API_URL` - Your backend API URL
- `NEXT_PUBLIC_REFERRER_URL` - Your domain URL for referral links

### 2. Build and Run with Docker Compose

```bash
# Build and start the container
docker-compose -f docker-compose.prod.yaml up -d --build

# View logs
docker-compose -f docker-compose.prod.yaml logs -f

# Stop the container
docker-compose -f docker-compose.prod.yaml down
```

### 3. Using Docker Directly

```bash
# Build the image
docker build -t ssadmin-nextjs:latest .

# Run the container
docker run -d \
  --name ssadmin-nextjs \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  ssadmin-nextjs:latest
```

## Production Deployment

### Using docker-compose.prod.yaml

This file is optimized for production with:
- Resource limits
- Health checks
- Logging configuration
- Restart policies

```bash
# Start production stack
docker-compose -f docker-compose.prod.yaml up -d

# View logs
docker-compose -f docker-compose.prod.yaml logs -f nextjs-app

# Stop production stack
docker-compose -f docker-compose.prod.yaml down

# Rebuild after code changes
docker-compose -f docker-compose.prod.yaml up -d --build
```

## Health Check

The container includes a health check that verifies the application is responding:

```bash
# Check container health
docker ps
# Look for "healthy" status

# Manual health check
curl http://localhost:3000
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose -f docker-compose.prod.yaml logs nextjs-app

# Check container status
docker ps -a
```

### Build fails

```bash
# Clean build (no cache)
docker-compose -f docker-compose.prod.yaml build --no-cache

# Check Dockerfile syntax
docker build -t test .
```

### Port already in use

```bash
# Change port in docker-compose.prod.yaml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### Environment variables not loading

```bash
# Verify .env.production exists
ls -la .env.production

# Check environment variables in container
docker exec ssadmin-nextjs-prod env | grep NEXT_PUBLIC
```

## Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yaml up -d --build
```

## Monitoring

```bash
# View resource usage
docker stats ssadmin-nextjs-prod

# View logs in real-time
docker-compose -f docker-compose.prod.yaml logs -f --tail=100
```

## Backup and Restore

### Backup

```bash
# Save container image
docker save ssadmin-nextjs:latest | gzip > ssadmin-backup.tar.gz
```

### Restore

```bash
# Load container image
gunzip -c ssadmin-backup.tar.gz | docker load
```

## Security Best Practices

1. **Never commit `.env.production`** - Keep it in `.gitignore`
2. **Use secrets management** - Consider using Docker secrets or external secret managers
3. **Keep images updated** - Regularly update base images and dependencies
4. **Limit resources** - Resource limits are set in `docker-compose.prod.yaml`
5. **Use non-root user** - The Dockerfile already uses a non-root user

## Multi-Stage Build

The Dockerfile uses a multi-stage build:
1. **deps** - Installs dependencies
2. **builder** - Builds the Next.js application
3. **runner** - Creates the final lightweight image

This results in a smaller final image (~200MB vs ~1GB+).

## Next.js Standalone Output

The `next.config.mjs` is configured with `output: 'standalone'` which:
- Creates a minimal production build
- Includes only necessary files
- Reduces image size significantly
- Improves startup time

## Network Configuration

The docker-compose file creates a bridge network `ssadmin-network` for:
- Container-to-container communication
- Future service expansion
- Network isolation

## Production Checklist

- [ ] Environment variables configured in `.env.production`
- [ ] API URL is accessible from container
- [ ] Port mapping is correct
- [ ] Health checks are passing
- [ ] Logs are being collected
- [ ] Resource limits are appropriate
- [ ] Backup strategy is in place
- [ ] Monitoring is configured


