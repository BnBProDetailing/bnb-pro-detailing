const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// Configure Nodemailer with your email service
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Handle booking form submissions
app.post('/api/send-booking', async (req, res) => {
    const { name, phone, email, vehicle, service, date, message } = req.body;

    // Validate required fields
    if (!name || !phone || !vehicle || !service || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Email content for business
        const businessEmailContent = `
            <h2>New Booking Request</h2>
            <p><strong>Customer Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email || 'Not provided')}</p>
            <p><strong>Vehicle Type:</strong> ${escapeHtml(vehicle)}</p>
            <p><strong>Service Requested:</strong> ${escapeHtml(service)}</p>
            <p><strong>Preferred Date:</strong> ${escapeHtml(date)}</p>
            <p><strong>Vehicle Details & Special Requests:</strong></p>
            <p>${escapeHtml(message || 'None')}</p>
        `;

        // Email content for customer
        const customerEmailContent = `
            <h2>Booking Confirmation</h2>
            <p>Dear ${escapeHtml(name)},</p>
            <p>Thank you for submitting your booking request to B&B Pro Detailing!</p>
            <p><strong>Your Booking Details:</strong></p>
            <ul>
                <li><strong>Vehicle Type:</strong> ${escapeHtml(vehicle)}</li>
                <li><strong>Service:</strong> ${escapeHtml(service)}</li>
                <li><strong>Preferred Date:</strong> ${escapeHtml(date)}</li>
            </ul>
            <p>We will review your request and contact you at ${escapeHtml(phone)} within 2 hours to confirm your appointment.</p>
            <p>Thank you for choosing B&B Pro Detailing for your luxury car care needs!</p>
            <p>Best regards,<br>B&B Pro Detailing Team<br>(904) 497-7004</p>
        `;

        // Send email to business
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.BUSINESS_EMAIL,
            subject: `New Booking Request from ${name}`,
            html: businessEmailContent
        });

        // Send confirmation email to customer (if email provided)
        if (email) {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'B&B Pro Detailing - Booking Confirmation',
                html: customerEmailContent
            });
        }

        res.json({ success: true, message: 'Booking request submitted successfully!' });
    } catch (error) {
        console.error('Email send error:', error);
        res.status(500).json({ error: 'Failed to send booking request. Please try again.' });
    }
});

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
