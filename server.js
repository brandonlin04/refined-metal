const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Azure deployment
app.set('trust proxy', 1);

// Rate limiting to prevent spam
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many contact form submissions. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com'] 
    : true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limit request size
app.use(express.static('.')); // Serve static files from current directory

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com', // Use Office 365 SMTP
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your Office 365 email
    pass: process.env.EMAIL_PASS  // Your Office 365 password
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

// Input validation function
function validateInput(data) {
  const errors = [];
  
  // Required fields
  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters');
  }
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters');
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email address is required');
  }
  if (!data.message || data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  }
  
  // Length limits
  if (data.firstName && data.firstName.length > 50) {
    errors.push('First name is too long');
  }
  if (data.lastName && data.lastName.length > 50) {
    errors.push('Last name is too long');
  }
  if (data.email && data.email.length > 100) {
    errors.push('Email is too long');
  }
  if (data.phone && data.phone.length > 20) {
    errors.push('Phone number is too long');
  }
  if (data.company && data.company.length > 100) {
    errors.push('Company name is too long');
  }
  if (data.message && data.message.length > 2000) {
    errors.push('Message is too long');
  }
  
  // Sanitize inputs
  const sanitized = {
    firstName: data.firstName ? data.firstName.trim().replace(/[<>]/g, '') : '',
    lastName: data.lastName ? data.lastName.trim().replace(/[<>]/g, '') : '',
    email: data.email ? data.email.trim().toLowerCase() : '',
    phone: data.phone ? data.phone.trim().replace(/[^0-9+\-\(\)\s]/g, '') : '',
    company: data.company ? data.company.trim().replace(/[<>]/g, '') : '',
    subject: data.subject || 'General Inquiry',
    message: data.message ? data.message.trim().replace(/[<>]/g, '') : ''
  };
  
  return { errors, sanitized };
}

// Contact form endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    // Validate and sanitize input
    const { errors, sanitized } = validateInput(req.body);
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: errors.join('. ') 
      });
    }
    
    const { firstName, lastName, email, phone, company, subject, message } = sanitized;

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'info@refined-metal.com', // Your business email
      subject: `Contact Form: ${subject || 'General Inquiry'} - ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #C0C0C0; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #555; margin-top: 0;">Contact Information</h3>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Company:</strong> ${company || 'Not provided'}</p>
            <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3 style="color: #555; margin-top: 0;">Message</h3>
            <p style="line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #e8f4f8; border-radius: 8px; font-size: 12px; color: #666;">
            <p>This message was sent from the Refined Metal website contact form.</p>
            <p>Reply directly to this email to respond to the customer.</p>
          </div>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Send confirmation email to customer - COMMENTED OUT FOR NOW
    // TODO: Implement confirmation emails later when SMTP AUTH is enabled
    /*
    const confirmationMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting Refined Metal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for contacting Refined Metal!</h2>
          
          <p>Dear ${firstName},</p>
          
          <p>We have received your message and will get back to you as soon as possible. Our team typically responds within 24 hours during business days.</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #555; margin-top: 0;">Your Message Summary</h3>
            <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
            <p><strong>Message:</strong></p>
            <p style="background-color: #fff; padding: 15px; border-radius: 4px; border-left: 4px solid #C0C0C0;">
              ${message}
            </p>
          </div>
          
          <p>If you have any urgent questions, please call us at <strong>(929) 235-7999</strong>.</p>
          
          <p>Best regards,<br>
          The Refined Metal Team</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            Refined Metal<br>
            15-30 131 St, College Point, NY 11356<br>
            Phone: (929) 235-7999 | Email: info@refined-metal.com
          </p>
        </div>
      `
    };

    await transporter.sendMail(confirmationMailOptions);
    */

    res.json({ 
      success: true, 
      message: 'Message sent successfully! We will get back to you soon.' 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      command: error.command
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again or call us directly.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Email configuration test endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    // Test email configuration
    await transporter.verify();
    res.json({ 
      status: 'OK', 
      message: 'Email configuration is valid',
      emailUser: process.env.EMAIL_USER ? 'Set' : 'Not set'
    });
  } catch (error) {
    console.error('Email configuration test failed:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Email configuration test failed',
      error: error.message,
      emailUser: process.env.EMAIL_USER ? 'Set' : 'Not set'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Contact form endpoint: http://localhost:${PORT}/api/contact`);
});
