# SSL Setup for orcr-agad.com

## Development Setup (Self-Signed Certificate)

The application is now configured to serve `https://orcr-agad.com` using a self-signed SSL certificate.

### Generated Files
- `nginx/ssl/orcr-agad.com.crt` - SSL certificate
- `nginx/ssl/orcr-agad.com.key` - Private key
- `nginx/ssl/generate-cert.sh` - Certificate generation script

### DNS Configuration Required
To use `https://orcr-agad.com` locally, add this to your `/etc/hosts` file:
```
127.0.0.1 orcr-agad.com
127.0.0.1 www.orcr-agad.com
```

### Starting the Application
```bash
# Start services
colima start
docker-compose up -d

# Access the application
# HTTP (redirects to HTTPS): http://orcr-agad.com
# HTTPS (main): https://orcr-agad.com
```

### Browser Security Warning
Since this is a self-signed certificate, browsers will show a security warning. Click "Advanced" → "Proceed to orcr-agad.com (unsafe)" to continue.

## Production Setup (Let's Encrypt)

For production deployment, replace the self-signed certificate with Let's Encrypt:

### Option 1: Using Certbot with Docker
```bash
# Install certbot
sudo apt-get update && sudo apt-get install certbot

# Stop nginx temporarily
docker-compose stop nginx

# Generate Let's Encrypt certificate
sudo certbot certonly --standalone -d orcr-agad.com -d www.orcr-agad.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/orcr-agad.com/fullchain.pem nginx/ssl/orcr-agad.com.crt
sudo cp /etc/letsencrypt/live/orcr-agad.com/privkey.pem nginx/ssl/orcr-agad.com.key

# Fix permissions
sudo chown $USER:$USER nginx/ssl/orcr-agad.com.*
chmod 644 nginx/ssl/orcr-agad.com.crt
chmod 600 nginx/ssl/orcr-agad.com.key

# Start nginx
docker-compose up -d nginx
```

### Option 2: Using Docker Compose with Certbot
Add certbot service to `docker-compose.yml` for automatic renewal.

### Certificate Renewal
Let's Encrypt certificates expire every 90 days. Set up automatic renewal:
```bash
# Add to crontab
0 12 * * * /usr/bin/certbot renew --quiet && docker-compose restart nginx
```

## Configuration Summary

### Nginx Configuration
- Port 80: HTTP to HTTPS redirect
- Port 443: HTTPS with SSL termination
- Security headers including HSTS
- Modern SSL configuration (TLS 1.2+)

### Application Configuration
- Frontend: `REACT_APP_API_URL=https://orcr-agad.com`
- Backend: `FRONTEND_URL=https://orcr-agad.com`
- CORS: Allows `https://orcr-agad.com` and `https://www.orcr-agad.com`

### Ports
- HTTP: 80 (redirects to HTTPS)
- HTTPS: 443
- Database: 5433 (external)
- Redis: 6380 (external)