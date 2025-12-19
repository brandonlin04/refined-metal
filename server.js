const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Azure deployment
app.set('trust proxy', 1);

// Rate limiting to prevent spam
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs (reduced from 5)
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
    ? ['https://refined-metal.com', 'https://www.refined-metal.com', 'https://refined-metal-e0etbtd6dtddahfu.centralus-01.azurewebsites.net'] 
    : true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limit request size
app.use(express.static('.')); // Serve static files from current directory

// Email transporter configuration for Office 365
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // info@refined-metal.com
    pass: process.env.EMAIL_PASS
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

// reCAPTCHA verification function
async function verifyRecaptcha(token, ip) {
  return new Promise((resolve, reject) => {
    if (!token) {
      resolve({ success: false, error: 'No token provided' });
      return;
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.log('reCAPTCHA secret key not configured, skipping verification');
      resolve({ success: true });
      return;
    }

    const postData = JSON.stringify({
      secret: secretKey,
      response: token,
      remoteip: ip
    });

    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Spam detection functions
function containsRandomPattern(text) {
  if (!text) return false;
  const vowels = (text.match(/[aeiouAEIOU]/g) || []).length;
  const consonants = (text.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []).length;
  const totalLetters = vowels + consonants;
  
  if (totalLetters < 5) return false;
  
  const consonantRatio = consonants / totalLetters;
  if (consonantRatio > 0.8) return true;
  
  const mixedCasePattern = /[a-z][A-Z][a-z][A-Z]/;
  if (mixedCasePattern.test(text)) return true;
  
  const repeatedPattern = /(.{3,}).*\1/;
  if (repeatedPattern.test(text.toLowerCase())) return true;
  
  return false;
}

function isValidName(name) {
  if (!name) return false;
  // Names should contain mostly letters, spaces, hyphens, and apostrophes
  // Should not be mostly random characters
  const namePattern = /^[a-zA-Z\s\-']+$/;
  if (!namePattern.test(name)) return false;
  
  // Check for random patterns
  if (containsRandomPattern(name)) return false;
  
  // Should have at least one vowel
  if (!/[aeiouAEIOU]/.test(name)) return false;
  
  return true;
}

// Input validation function
function validateInput(data) {
  const errors = [];
  
  if (data.website || data.url || data.honeypot) {
    console.log('Spam detected: Honeypot field filled');
    errors.push('Invalid submission detected');
    return { errors, sanitized: null, isSpam: true };
  }
  
  // Required fields
  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters');
  } else if (!isValidName(data.firstName)) {
    errors.push('Please enter a valid first name');
  }
  
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters');
  } else if (!isValidName(data.lastName)) {
    errors.push('Please enter a valid last name');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email address is required');
  }
  
  if (!data.message || data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  } else if (containsRandomPattern(data.message)) {
    errors.push('Message appears to be invalid');
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
  
  if (data.company && containsRandomPattern(data.company)) {
    errors.push('Company name appears to be invalid');
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
  
  return { errors, sanitized, isSpam: false };
}

// Contact form endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    console.log('Contact form submission received:', {
      email: req.body.email,
      name: `${req.body.firstName} ${req.body.lastName}`,
      subject: req.body.subject,
      ip: req.ip
    });
    
    // Verify reCAPTCHA token
    if (req.body.recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(req.body.recaptchaToken, req.ip);
      
      if (!recaptchaResult.success) {
        console.log('reCAPTCHA verification failed:', {
          ip: req.ip,
          email: req.body.email,
          errors: recaptchaResult['error-codes']
        });
        return res.status(400).json({ 
          success: false, 
          message: 'Security verification failed. Please try again.' 
        });
      }
      
      // Check reCAPTCHA score (v3 returns a score from 0.0 to 1.0)
      // Lower scores indicate bot-like behavior
      if (recaptchaResult.score !== undefined && recaptchaResult.score < 0.5) {
        console.log('reCAPTCHA score too low:', {
          ip: req.ip,
          email: req.body.email,
          score: recaptchaResult.score
        });
        return res.status(400).json({ 
          success: false, 
          message: 'Security verification failed. Please try again.' 
        });
      }
    } else if (process.env.RECAPTCHA_SECRET_KEY) {
      console.log('reCAPTCHA token missing but required');
      return res.status(400).json({ 
        success: false, 
        message: 'Security verification required. Please refresh the page and try again.' 
      });
    }
    
    const { errors, sanitized, isSpam } = validateInput(req.body);
    
    if (isSpam) {
      console.log('Spam submission blocked:', {
        ip: req.ip,
        email: req.body.email,
        name: `${req.body.firstName} ${req.body.lastName}`
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid submission. Please check your information and try again.' 
      });
    }
    
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
      to: process.env.EMAIL_USER, // Your business email
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
    console.log('Sending contact form email to:', process.env.EMAIL_USER);
    await transporter.sendMail(mailOptions);
    console.log('Contact form email sent successfully');

    // Send confirmation email to customer
    console.log('Sending confirmation email to:', email);
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
    console.log('Confirmation email sent successfully');

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
      command: error.command,
      responseCode: error.responseCode
    });
    
    // Specific Office 365 error handling
    if (error.code === 'EAUTH') {
      console.error('Office 365 Authentication failed. Check EMAIL_USER and EMAIL_PASS.');
    } else if (error.code === 'EENVELOPE') {
      console.error('Office 365 envelope error. Check email addresses.');
    } else if (error.responseCode === 535) {
      console.error('Office 365 SMTP AUTH is disabled. Enable it in Office 365 admin center.');
    }
    
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

// Office 365 email configuration test endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    console.log('Testing Office 365 email configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
    
    // Test Office 365 connection
    await transporter.verify();
    
    res.json({ 
      status: 'OK', 
      message: 'Office 365 email configuration is valid',
      emailUser: process.env.EMAIL_USER,
      smtpHost: 'smtp.office365.com',
      smtpPort: 587
    });
  } catch (error) {
    console.error('Office 365 email configuration test failed:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Office 365 email configuration test failed',
      error: error.message,
      errorCode: error.code,
      responseCode: error.responseCode,
      emailUser: process.env.EMAIL_USER,
      smtpHost: 'smtp.office365.com',
      smtpPort: 587
    });
  }
});

// Catch-all route for any other requests
app.get('*', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Refined Metal API Server is running',
    endpoints: {
      contact: '/api/contact',
      health: '/api/health',
      testEmail: '/api/test-email'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Refined Metal Server is running on port ${PORT}`);
  console.log(`📧 Contact form endpoint: http://localhost:${PORT}/api/contact`);
  console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
  console.log(`📨 Email test: http://localhost:${PORT}/api/test-email`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📮 Email User: ${process.env.EMAIL_USER || 'NOT SET'}`);
  console.log(`🔄 Server restarted at: ${new Date().toISOString()}`);
});
