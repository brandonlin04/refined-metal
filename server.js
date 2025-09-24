const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// Serve static files from the root directory
app.use(express.static('.'));

// Route for homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for about page
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

// Route for studs page
app.get('/studs', (req, res) => {
    res.sendFile(path.join(__dirname, 'studs.html'));
});

// Route for tracks page
app.get('/tracks', (req, res) => {
    res.sendFile(path.join(__dirname, 'tracks.html'));
});

// Route for joists page
app.get('/joists', (req, res) => {
    res.sendFile(path.join(__dirname, 'joists.html'));
});

// Route for decking page
app.get('/decking', (req, res) => {
    res.sendFile(path.join(__dirname, 'decking.html'));
});

// Route for doors page
app.get('/doors', (req, res) => {
    res.sendFile(path.join(__dirname, 'doors.html'));
});

// Route for railings page
app.get('/railings', (req, res) => {
    res.sendFile(path.join(__dirname, 'railings.html'));
});

// Route for ICCES report page
app.get('/icces-report', (req, res) => {
    res.sendFile(path.join(__dirname, 'icces-report.html'));
});

// Route for contact page
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

// Route for privacy policy page
app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});

// Redirect old .html URLs to clean URLs
app.get('/index.html', (req, res) => {
    res.redirect('/');
});

app.get('/about.html', (req, res) => {
    res.redirect('/about');
});

app.get('/studs.html', (req, res) => {
    res.redirect('/studs');
});

app.get('/tracks.html', (req, res) => {
    res.redirect('/tracks');
});

app.get('/joists.html', (req, res) => {
    res.redirect('/joists');
});

app.get('/decking.html', (req, res) => {
    res.redirect('/decking');
});

app.get('/doors.html', (req, res) => {
    res.redirect('/doors');
});

app.get('/railings.html', (req, res) => {
    res.redirect('/railings');
});

app.get('/icces-report.html', (req, res) => {
    res.redirect('/icces-report');
});

app.get('/contact.html', (req, res) => {
    res.redirect('/contact');
});

app.get('/privacy-policy.html', (req, res) => {
    res.redirect('/privacy-policy');
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Refined Metal website is running at http://localhost:${PORT}`);
    console.log('✨ Clean URLs enabled - no more .html extensions!');
});
