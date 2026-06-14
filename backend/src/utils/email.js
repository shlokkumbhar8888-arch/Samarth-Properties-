// ============================================================
// SAMARTH PROPERTIES — Email / Nodemailer Utility
// File: backend/src/utils/email.js
// ============================================================

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transporter;
}

/**
 * Send an email.
 * @param {object} options - { to, subject, html, text }
 */
async function sendEmail({ to, subject, html, text }) {
    try {
        const t = getTransporter();
        const info = await t.sendMail({
            from: `"Samarth Properties" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]+>/g, ''),
        });
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error('[Email Error]', err.message);
        return { success: false, error: err.message };
    }
}

// ── Email Templates ───────────────────────────────────────────

function enquiryNotificationHtml(data) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: #0a1628; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: #c9a96e; margin: 0; font-size: 24px;">New Enquiry Received</h1>
        <p style="color: #ffffff; margin: 8px 0 0;">Samarth Properties</p>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666; width: 35%;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.phone}</td></tr>
          ${data.email ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.email}</td></tr>` : ''}
          ${data.city ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">City</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.city}</td></tr>` : ''}
          ${data.project_name ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Project</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.project_name}</td></tr>` : ''}
          ${data.message ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Message</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.message}</td></tr>` : ''}
          <tr><td style="padding: 8px; color: #666;">Source</td><td style="padding: 8px;">${data.source || 'website'}</td></tr>
        </table>
      </div>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 0 0 6px 6px; text-align: center; color: #888; font-size: 12px;">
        Received at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </div>
    </div>`;
}

function appointmentNotificationHtml(data) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: #0a1628; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: #c9a96e; margin: 0; font-size: 24px;">New Site Visit Booking</h1>
        <p style="color: #ffffff; margin: 8px 0 0;">Samarth Properties</p>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666; width: 35%;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.phone}</td></tr>
          ${data.email ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.email}</td></tr>` : ''}
          ${data.project_name ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Project</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.project_name}</td></tr>` : ''}
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Preferred Date</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #c9a96e;">${data.preferred_date}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Preferred Time</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #c9a96e;">${data.preferred_time}</td></tr>
          ${data.message ? `<tr><td style="padding: 8px; color: #666;">Message</td><td style="padding: 8px;">${data.message}</td></tr>` : ''}
        </table>
      </div>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 0 0 6px 6px; text-align: center; color: #888; font-size: 12px;">
        Received at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </div>
    </div>`;
}

function brochureLeadHtml(data) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: #0a1628; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: #c9a96e; margin: 0; font-size: 24px;">Brochure Download Lead</h1>
        <p style="color: #ffffff; margin: 8px 0 0;">Samarth Properties</p>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666; width: 35%;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.phone}</td></tr>
          ${data.email ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.email}</td></tr>` : ''}
          <tr><td style="padding: 8px; color: #666;">Project</td><td style="padding: 8px;">${data.project_name || 'General'}</td></tr>
        </table>
      </div>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 0 0 6px 6px; text-align: center; color: #888; font-size: 12px;">
        Received at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </div>
    </div>`;
}

async function notifyEnquiry(data) {
    return sendEmail({
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `New Enquiry: ${data.name} — ${data.project_name || 'General'}`,
        html: enquiryNotificationHtml(data),
    });
}

async function notifyAppointment(data) {
    return sendEmail({
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `New Site Visit: ${data.name} on ${data.preferred_date}`,
        html: appointmentNotificationHtml(data),
    });
}

async function notifyBrochureLead(data) {
    return sendEmail({
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `Brochure Download: ${data.name} — ${data.project_name || 'General'}`,
        html: brochureLeadHtml(data),
    });
}

module.exports = {
    sendEmail,
    notifyEnquiry,
    notifyAppointment,
    notifyBrochureLead,
};
