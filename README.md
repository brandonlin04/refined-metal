# Refined Metal - Industrial Steel Solutions Website

A modern, responsive website for Refined Metal, a New York-based manufacturer specializing in high-quality steel products for the construction industry. The site showcases products, provides resources, and includes a contact form with email functionality.

## 🏢 About

Refined Metal is a New York–based manufacturer delivering high-quality steel products at competitive prices. We specialize in roll-formed studs, tracks, joists, and decking, while also offering durable doors, railings, and custom solutions.

**Mission:** To deliver steel solutions that shape stronger, safer, and smarter construction.

## ✨ Features

- **Product Showcases**: Detailed pages for Smart Products (Studs, Tracks, Joists, Decking) and Architectural Products (Doors, Railings)
- **Product Catalogs**: Downloadable PDF catalogs and product identification guides
- **Contact Form**: Secure contact form with email notifications and rate limiting
- **ICCES Reports**: Access to engineering reports and certifications
- **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS
- **Performance Optimized**: Fast loading times with optimized assets and CDN resources

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first CSS framework (via CDN)
- **JavaScript** - Vanilla JS for interactivity
- **AOS (Animate On Scroll)** - Scroll animations
- **Feather Icons** - Icon library
- **Google Fonts** - Inter & Space Grotesk typography

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Nodemailer** - Email service (Office 365 SMTP)
- **express-rate-limit** - Rate limiting for security
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 🔧 Backend Functionality

The Express server (`server.js`) handles:

- **Contact Form Processing**: Validates and sanitizes form submissions, sends emails via Office 365 SMTP to the business and confirmation emails to customers
- **Rate Limiting**: Prevents spam by limiting contact form submissions to 5 per 15 minutes per IP address
- **Security Headers**: Implements security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy)
- **Static File Serving**: Serves all HTML, CSS, images, and PDF files
- **Health Check Endpoint**: Provides server status monitoring
- **Email Configuration Testing**: Endpoint to verify Office 365 email setup

## 📁 Project Structure

```
refined-metal/
├── index.html              # Homepage
├── about.html              # About Us page
├── contact.html            # Contact form page
├── doors.html              # Doors product page
├── railings.html           # Railings product page
├── studs.html              # Studs product page
├── tracks.html             # Tracks product page
├── joists.html             # Joists product page
├── decking.html            # Decking product page
├── icces-report.html       # ICCES reports page
├── privacy-policy.html     # Privacy policy
├── server.js               # Express backend server
├── package.json            # Node.js dependencies
├── startup.sh              # Deployment startup script
├── web.config              # Azure deployment config
├── catalogs/               # Product catalog PDFs
│   ├── door-railings-catalog.pdf
│   ├── steel-catalog.pdf
│   └── product-identification.pdf
├── documents/              # Engineering documents
│   ├── ESR-5724.pdf
│   ├── ESR-5837.pdf
│   └── ESR-5724-True-Copy.pdf
└── images/                 # Image assets
    ├── common/             # Logos and common images
    ├── index/              # Homepage images
    ├── doors/              # Door product images
    ├── railings/           # Railing product images
    ├── studs/              # Stud product images
    ├── tracks/             # Track product images
    ├── joists/             # Joist product images
    └── about/              # About page images
```

## 🔒 Security Features

- **Input Validation**: All form inputs are validated for length, format, and sanitized to prevent XSS attacks
- **Rate Limiting**: Contact form protected against spam and abuse
- **Security Headers**: Multiple security headers set on all responses
- **CORS Configuration**: Restricted to production domains in production environment
- **Request Size Limits**: Maximum 10MB request size to prevent DoS attacks
