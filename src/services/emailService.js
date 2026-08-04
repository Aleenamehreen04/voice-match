// src/services/emailService.js
// Sends emails via Resend (https://resend.com) — free tier, no card needed.
// If REACT_APP_RESEND_API_KEY isn't set, these functions quietly skip
// sending and log a warning instead of breaking the app.

const RESEND_API_KEY = process.env.REACT_APP_RESEND_API_KEY || '';
const RESEND_URL = 'https://api.resend.com/emails';
// Resend's free tier only lets you send FROM this address until you
// verify your own domain. Fine for a demo/hackathon.
const FROM_EMAIL = 'onboarding@resend.dev';

export const sendEmail = async (to, subject, htmlContent) => {
  if (!RESEND_API_KEY) {
    console.warn('No Resend API key set (REACT_APP_RESEND_API_KEY) — skipping email send.');
    return false;
  }

  try {
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Email send failed:', response.status, errText);
      return false;
    }

    console.log('✅ Email sent to', to);
    return true;
  } catch (error) {
    console.error('Email service error:', error.message);
    return false;
  }
};

export const sendApplicationAccepted = async (studentEmail, studentName, gigTitle, companyName, score) => {
  const subject = `🎉 Congratulations! You've been accepted for ${gigTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #1a1a2e; color: white; border-radius: 12px;">
      <h1 style="color: #FBBF24; text-align: center;">🎉 Congratulations, ${studentName}!</h1>
      <p style="font-size: 17px; text-align: center;">
        You've been selected for the <strong>${gigTitle}</strong> internship at <strong>${companyName}</strong> after your interview.
      </p>
      ${score ? `<p style="text-align:center; color:#FBBF24; font-size:15px;">Interview score: ${score}%</p>` : ''}
      <div style="background: #2d2d44; padding: 18px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #FBBF24; margin-top:0;">📋 Next Steps</h3>
        <ul style="color: #d1d5db; line-height: 1.8;">
          <li>Check your VoiceMatch profile and dashboard</li>
          <li>Keep an eye out for onboarding details from the company</li>
        </ul>
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 13px;">This is an automated message from VoiceMatch.</p>
    </div>
  `;
  return sendEmail(studentEmail, subject, html);
};

export const sendApplicationRejected = async (studentEmail, studentName, gigTitle, companyName) => {
  const subject = `Update on your application for ${gigTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #1a1a2e; color: white; border-radius: 12px;">
      <h1 style="color: #FBBF24; text-align: center;">📝 Application Update</h1>
      <p style="font-size: 17px; text-align: center;">
        Thanks for interviewing for <strong>${gigTitle}</strong> at <strong>${companyName}</strong>.
      </p>
      <div style="background: #2d2d44; padding: 18px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="color: #d1d5db;">This time, the role isn't the right fit — but don't stop here.</p>
        <p style="color: #9ca3af;">💡 Keep applying — new internships are added regularly on VoiceMatch.</p>
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 13px;">This is an automated message from VoiceMatch.</p>
    </div>
  `;
  return sendEmail(studentEmail, subject, html);
};
