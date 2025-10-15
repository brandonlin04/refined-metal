# Refined Metal Contact Form Backend Setup

This guide will help you set up the backend server to handle contact form submissions and send emails.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Email Settings
Create a `.env` file in the root directory:
```bash
cp env-example.txt .env
```

Edit the `.env` file with your email credentials:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=3000
```

### 3. Gmail Setup (Recommended)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in your `.env` file

### 4. Start the Server
```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3000`

## 📧 How It Works

1. **User fills out contact form** on your website
2. **Form data is sent** to `/api/contact` endpoint
3. **Two emails are sent**:
   - **Business email**: Sent to `info@refined-metal.com` with customer details
   - **Confirmation email**: Sent to customer confirming receipt

## 🔧 Alternative Email Services

### Option 1: Outlook/Hotmail
```javascript
// In server.js, change the transporter configuration:
const transporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### Option 2: Custom SMTP
```javascript
const transporter = nodemailer.createTransporter({
  host: 'your-smtp-server.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## 🌐 Deployment Options

### Option 1: Heroku (Free)
1. Create a Heroku account
2. Install Heroku CLI
3. Create a new app: `heroku create your-app-name`
4. Set environment variables: `heroku config:set EMAIL_USER=your-email@gmail.com`
5. Deploy: `git push heroku main`

### Option 2: Railway
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically

### Option 3: VPS/Cloud Server
1. Upload files to your server
2. Install Node.js
3. Run `npm install`
4. Use PM2 for process management: `pm2 start server.js`

## 🔒 Security Features

- ✅ **Input validation** - Required fields are checked
- ✅ **CORS protection** - Only allows requests from your domain
- ✅ **Error handling** - Graceful error messages
- ✅ **Rate limiting** - Can be added if needed

## 📱 Testing

Test the contact form:
1. Start the server: `npm start`
2. Open `http://localhost:3000/contact.html`
3. Fill out and submit the form
4. Check your email for the message

## 🛠️ Customization

### Change Email Template
Edit the `mailOptions.html` in `server.js` to customize the email appearance.

### Add More Fields
1. Add fields to the contact form HTML
2. Update the form data collection in the JavaScript
3. Update the email template in `server.js`

### Change Business Email
Update the `to` field in the `mailOptions` object in `server.js`.

## 📞 Support

If you need help with setup or customization, the contact form includes fallback instructions for customers to call directly at (929) 235-7999.
