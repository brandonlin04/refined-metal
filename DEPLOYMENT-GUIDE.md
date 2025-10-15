# 🚀 Production Deployment Guide

This guide will help you deploy your Refined Metal website with the contact form to your domain.

## 📋 **Pre-Deployment Checklist**

### ✅ **Files Ready for Production:**
- ✅ Contact form uses relative URLs (`/api/contact`)
- ✅ Backend server configured for production
- ✅ Environment variables ready

## 🌐 **Deployment Options**

### **Option 1: VPS/Cloud Server (Recommended)**

#### **1. Upload Files to Server**
```bash
# Upload all files to your server
scp -r * user@your-server.com:/var/www/refined-metal/
```

#### **2. Install Node.js on Server**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# CentOS/RHEL
sudo yum install nodejs npm
```

#### **3. Install Dependencies**
```bash
cd /var/www/refined-metal/
npm install --production
```

#### **4. Set Up Environment Variables**
```bash
# Create .env file on server
nano .env
```

Add your production email credentials:
```bash
EMAIL_USER=your-business-email@yourdomain.com
EMAIL_PASS=your-gmail-app-password
PORT=3000
NODE_ENV=production
```

#### **5. Set Up Process Manager (PM2)**
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start your application
pm2 start server.js --name "refined-metal"

# Save PM2 configuration
pm2 save
pm2 startup
```

#### **6. Configure Web Server (Nginx)**
Create `/etc/nginx/sites-available/refined-metal`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Serve static files
    location / {
        root /var/www/refined-metal;
        try_files $uri $uri/ @backend;
    }
    
    # API requests go to Node.js
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Fallback to backend for SPA routing
    location @backend {
        proxy_pass http://localhost:3000;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/refined-metal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **Option 2: Heroku (Easy)**

#### **1. Install Heroku CLI**
```bash
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

#### **2. Create Heroku App**
```bash
heroku create your-app-name
```

#### **3. Set Environment Variables**
```bash
heroku config:set EMAIL_USER=your-business-email@yourdomain.com
heroku config:set EMAIL_PASS=your-gmail-app-password
heroku config:set NODE_ENV=production
```

#### **4. Deploy**
```bash
git add .
git commit -m "Deploy to production"
git push heroku main
```

### **Option 3: Railway (GitHub Integration)**

#### **1. Connect GitHub Repository**
- Go to [Railway.app](https://railway.app)
- Connect your GitHub repository
- Railway will auto-deploy

#### **2. Set Environment Variables**
In Railway dashboard:
- `EMAIL_USER`: your-business-email@yourdomain.com
- `EMAIL_PASS`: your-gmail-app-password
- `NODE_ENV`: production

## 🔧 **Production Configuration Updates**

### **Update Server.js for Production**
```javascript
// Add to server.js
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Add security headers for production
if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}
```

## 📧 **Email Configuration for Production**

### **Business Email Options:**

#### **Option 1: Use Your Domain Email**
```bash
EMAIL_USER=info@yourdomain.com
EMAIL_PASS=your-domain-email-password
```

#### **Option 2: Use Gmail (Current Setup)**
```bash
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
```

#### **Option 3: Use Professional Email Service**
```bash
# For services like SendGrid, Mailgun, etc.
EMAIL_USER=your-service-username
EMAIL_PASS=your-service-password
```

## 🔒 **Security Considerations**

### **1. Environment Variables**
- ✅ Never commit `.env` to version control
- ✅ Use strong, unique passwords
- ✅ Rotate credentials regularly

### **2. HTTPS Setup**
```bash
# Install SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### **3. Firewall Configuration**
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 🧪 **Testing Production Deployment**

### **1. Test Contact Form**
- Visit your domain
- Fill out and submit contact form
- Check email delivery

### **2. Test API Endpoints**
```bash
curl -X POST https://yourdomain.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","message":"Test message"}'
```

## 📊 **Monitoring & Maintenance**

### **1. Log Monitoring**
```bash
# View PM2 logs
pm2 logs refined-metal

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### **2. Performance Monitoring**
```bash
# Monitor PM2 processes
pm2 monit

# Check server resources
htop
df -h
```

## 🆘 **Troubleshooting**

### **Common Issues:**

#### **Contact Form Not Working**
- Check if backend server is running: `pm2 status`
- Verify environment variables: `pm2 env 0`
- Check logs: `pm2 logs refined-metal`

#### **Emails Not Sending**
- Verify Gmail app password is correct
- Check email credentials in environment variables
- Test email service independently

#### **Static Files Not Loading**
- Check Nginx configuration
- Verify file permissions
- Check Nginx error logs

## 📞 **Support**

If you need help with deployment:
1. Check the logs first
2. Verify all environment variables
3. Test each component individually
4. Contact your hosting provider if needed

Your contact form will work perfectly on your domain once deployed! 🚀
