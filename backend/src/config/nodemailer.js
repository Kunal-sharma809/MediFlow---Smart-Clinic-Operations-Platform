const nodemailer = require('nodemailer');

let transporter = null;

const initMailer = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('[Mailer] Transporter initialized with configured SMTP server.');
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Mailer] Ethereal test account created (${testAccount.user}). Emails will be captured.`);
    } catch (err) {
      console.warn(`[Mailer] Could not create Ethereal account (${err.message}). Mailer fallback to console logging.`);
    }
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    await initMailer();
  }

  try {
    if (transporter) {
      const info = await transporter.sendMail({
        from: '"ApexCare Health Platform" <no-reply@apexcare.health>',
        to,
        subject,
        text,
        html,
      });
      console.log(`[Mailer] Email sent to ${to}: ${info.messageId}`);
      if (nodemailer.getTestMessageUrl(info)) {
        console.log(`[Mailer] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      return info;
    }
  } catch (err) {
    console.error(`[Mailer] Error sending email to ${to}:`, err.message);
  }

  // Fallback console log
  console.log(`\n================= [SIMULATED EMAIL SENT] =================`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text || html}`);
  console.log(`==========================================================\n`);
  return { simulated: true };
};

module.exports = { initMailer, sendEmail };
