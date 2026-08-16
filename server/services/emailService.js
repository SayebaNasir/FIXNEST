const nodemailer = require('nodemailer');

// Create reusable transporter object using Gmail SMTP or dev fallback
const createTransporter = () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  // Fallback dev transporter: logs emails cleanly to console
  return {
    sendMail: async (mailOptions) => {
      console.log('\n------------------- [EMAIL DISPATCH (DEV MOCK)] -------------------');
      console.log(`FROM:    ${mailOptions.from || process.env.EMAIL_FROM || 'FIXNEST <no-reply@fixnest.com>'}`);
      console.log(`TO:      ${mailOptions.to}`);
      console.log(`SUBJECT: ${mailOptions.subject}`);
      console.log('--------------------------------------------------------------------');
      console.log(mailOptions.text || mailOptions.html.replace(/<[^>]*>?/gm, ' '));
      console.log('--------------------------------------------------------------------\n');
      return { messageId: `mock-${Date.now()}` };
    }
  };
};

const getFromAddress = () => {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.GMAIL_USER) return `FIXNEST Platform <${process.env.GMAIL_USER}>`;
  return 'FIXNEST Support <no-reply@fixnest.com>';
};

const getAppUrl = () => process.env.APP_URL || 'http://localhost:5173';

// Shared HTML Template Wrapper
const wrapHtmlBody = (title, content, actionButton = null) => {
  const appUrl = getAppUrl();
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333333; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; line-height: 1.6; }
        .details-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .details-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
        .details-row:last-child { margin-bottom: 0; }
        .label { font-weight: 600; color: #64748b; }
        .value { font-weight: 600; color: #0f172a; text-align: right; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .badge-accepted { background: #dcfce7; color: #166534; }
        .badge-rejected { background: #fee2e2; color: #991b1b; }
        .badge-completed { background: #e0e7ff; color: #3730a3; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 20px; text-align: center; }
        .btn:hover { background: #1d4ed8; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FIXNEST</h1>
          <p>Home Services & Solutions</p>
        </div>
        <div class="content">
          <h2 style="margin-top:0; color:#1e293b;">${title}</h2>
          ${content}
          ${actionButton ? `<div style="text-align: center;">${actionButton}</div>` : ''}
        </div>
        <div class="footer">
          <p>This is an automated operational notification from FIXNEST.</p>
          <p>&copy; ${new Date().getFullYear()} FIXNEST Inc. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// -------------------------------------------------------------
// 1. REQUEST CONFIRMATIONS (Sent to both Homeowner & Provider)
// -------------------------------------------------------------
const sendBookingRequestConfirmation = async ({ booking, provider, providerUser }) => {
  const transporter = createTransporter();
  const from = getFromAddress();
  const appUrl = getAppUrl();

  const providerEmail = providerUser?.email;

  // Email to Homeowner
  const homeownerHtml = wrapHtmlBody(
    'Booking Request Confirmation',
    `
      <p>Hello <strong>${booking.userName}</strong>,</p>
      <p>Thank you for submitting a service request on FIXNEST! Your request has been successfully dispatched to the provider.</p>
      
      <div class="details-card">
        <div class="details-row"><span class="label">Provider:</span> <span class="value">${provider.name}</span></div>
        <div class="details-row"><span class="label">Service:</span> <span class="value">${provider.serviceType}</span></div>
        <div class="details-row"><span class="label">Date:</span> <span class="value">${booking.date}</span></div>
        <div class="details-row"><span class="label">Time Slot:</span> <span class="value">${booking.time}</span></div>
        <div class="details-row"><span class="label">Address:</span> <span class="value">${booking.userAddress}</span></div>
        <div class="details-row"><span class="label">Rate:</span> <span class="value">${booking.isOffPeak ? `<strike style="color:#94a3b8; margin-right:4px;">৳${booking.originalPrice || booking.price}/hr</strike> <span style="color:#16a34a; font-weight:bold;">৳${booking.finalPrice || booking.price}/hr (10% Off-Peak Discount)</span>` : `৳${booking.price}/hr`}</span></div>
        <div class="details-row"><span class="label">Status:</span> <span class="badge badge-pending">PENDING</span></div>
      </div>

      <p><strong>Description:</strong> ${booking.description}</p>
      <p>The provider will review your request and accept or decline shortly. You will receive an email update once they respond.</p>
    `,
    `<a href="${appUrl}/my-bookings" class="btn">View My Bookings</a>`
  );

  await transporter.sendMail({
    from,
    to: booking.userEmail,
    subject: `[FIXNEST] Request Submitted: ${provider.serviceType} with ${provider.name}`,
    html: homeownerHtml
  });

  // Email to Provider (if provider email exists)
  if (providerEmail) {
    const providerHtml = wrapHtmlBody(
      'New Job Request Received!',
      `
        <p>Hello <strong>${provider.name}</strong>,</p>
        <p>You have received a new service booking request on FIXNEST from <strong>${booking.userName}</strong>.</p>
        
        <div class="details-card">
          <div class="details-row"><span class="label">Client Name:</span> <span class="value">${booking.userName}</span></div>
          <div class="details-row"><span class="label">Client Email:</span> <span class="value">${booking.userEmail}</span></div>
          <div class="details-row"><span class="label">Date:</span> <span class="value">${booking.date}</span></div>
          <div class="details-row"><span class="label">Time Slot:</span> <span class="value">${booking.time}</span></div>
          <div class="details-row"><span class="label">Service Location:</span> <span class="value">${booking.userAddress}</span></div>
          <div class="details-row"><span class="label">Estimated Rate:</span> <span class="value">$${booking.price}/hr</span></div>
          <div class="details-row"><span class="label">Status:</span> <span class="badge badge-pending">ACTION REQUIRED</span></div>
        </div>

        <p><strong>Job Details / Description:</strong> ${booking.description}</p>
        <p>Please log in to your provider dashboard to accept or reject this request.</p>
      `,
      `<a href="${appUrl}/provider/dashboard" class="btn">Manage Requests</a>`
    );

    await transporter.sendMail({
      from,
      to: providerEmail,
      subject: `[FIXNEST] New Job Request from ${booking.userName} (${booking.date})`,
      html: providerHtml
    });
  }
};

// -------------------------------------------------------------
// 2. ACCEPTANCE / REJECTION ALERTS (Sent to Homeowner & Provider)
// -------------------------------------------------------------
const sendBookingStatusAlert = async ({ booking, provider, providerUser, status }) => {
  const transporter = createTransporter();
  const from = getFromAddress();
  const appUrl = getAppUrl();
  const isAccepted = status === 'accepted';
  const badgeClass = isAccepted ? 'badge-accepted' : 'badge-rejected';
  const statusLabel = status.toUpperCase();

  const providerEmail = providerUser?.email;

  // Email to Homeowner
  const homeownerTitle = isAccepted ? 'Your Booking Request Has Been Accepted!' : 'Update on Your Booking Request';
  const homeownerHtml = wrapHtmlBody(
    homeownerTitle,
    `
      <p>Hello <strong>${booking.userName}</strong>,</p>
      <p>${isAccepted 
        ? `Great news! <strong>${provider.name}</strong> has <strong>ACCEPTED</strong> your service booking request.` 
        : `Unfortunately, <strong>${provider.name}</strong> was unable to accept your request at this time.`
      }</p>
      
      <div class="details-card">
        <div class="details-row"><span class="label">Provider:</span> <span class="value">${provider.name}</span></div>
        <div class="details-row"><span class="label">Service:</span> <span class="value">${provider.serviceType}</span></div>
        <div class="details-row"><span class="label">Date:</span> <span class="value">${booking.date}</span></div>
        <div class="details-row"><span class="label">Time:</span> <span class="value">${booking.time}</span></div>
        <div class="details-row"><span class="label">Status:</span> <span class="badge ${badgeClass}">${statusLabel}</span></div>
      </div>

      ${isAccepted 
        ? `<p>Please ensure you are available at your address (<strong>${booking.userAddress}</strong>) during the scheduled time slot.</p>`
        : `<p>You can search for other top-rated service providers on FIXNEST anytime.</p>`
      }
    `,
    `<a href="${appUrl}/my-bookings" class="btn">View Booking Details</a>`
  );

  await transporter.sendMail({
    from,
    to: booking.userEmail,
    subject: `[FIXNEST] Booking ${statusLabel}: ${provider.serviceType} with ${provider.name}`,
    html: homeownerHtml
  });

  // Confirmation email to Provider
  if (providerEmail) {
    const providerHtml = wrapHtmlBody(
      `Job Request Marked as ${statusLabel}`,
      `
        <p>Hello <strong>${provider.name}</strong>,</p>
        <p>You have updated the status of booking ID <code>#${booking._id}</code> to <strong>${statusLabel}</strong>.</p>
        
        <div class="details-card">
          <div class="details-row"><span class="label">Client:</span> <span class="value">${booking.userName}</span></div>
          <div class="details-row"><span class="label">Date:</span> <span class="value">${booking.date}</span></div>
          <div class="details-row"><span class="label">Time Slot:</span> <span class="value">${booking.time}</span></div>
          <div class="details-row"><span class="label">Location:</span> <span class="value">${booking.userAddress}</span></div>
          <div class="details-row"><span class="label">Status:</span> <span class="badge ${badgeClass}">${statusLabel}</span></div>
        </div>
      `,
      `<a href="${appUrl}/provider/dashboard" class="btn">Go to Dashboard</a>`
    );

    await transporter.sendMail({
      from,
      to: providerEmail,
      subject: `[FIXNEST] Confirmation: Job ${statusLabel} (${booking.userName})`,
      html: providerHtml
    });
  }
};

// -------------------------------------------------------------
// 3. COMPLETION REMINDERS (Sent for active/in-progress/scheduled jobs)
// -------------------------------------------------------------
const sendJobCompletionReminder = async ({ booking, provider, providerUser }) => {
  const transporter = createTransporter();
  const from = getFromAddress();
  const appUrl = getAppUrl();
  const providerEmail = providerUser?.email;

  // Reminder to Provider
  if (providerEmail) {
    const providerHtml = wrapHtmlBody(
      'Job Completion & Schedule Reminder',
      `
        <p>Hello <strong>${provider.name}</strong>,</p>
        <p>This is a friendly reminder regarding your upcoming scheduled service for <strong>${booking.userName}</strong>.</p>
        
        <div class="details-card">
          <div class="details-row"><span class="label">Client:</span> <span class="value">${booking.userName}</span></div>
          <div class="details-row"><span class="label">Scheduled Date:</span> <span class="value">${booking.date}</span></div>
          <div class="details-row"><span class="label">Time Slot:</span> <span class="value">${booking.time}</span></div>
          <div class="details-row"><span class="label">Location:</span> <span class="value">${booking.userAddress}</span></div>
          <div class="details-row"><span class="label">Current Status:</span> <span class="badge badge-accepted">${booking.status.toUpperCase()}</span></div>
        </div>

        <p>Once you have completed the job, please remember to mark it as <strong>Completed</strong> in your FIXNEST dashboard so the client can leave a review!</p>
      `,
      `<a href="${appUrl}/provider/dashboard" class="btn">Update Job Status</a>`
    );

    await transporter.sendMail({
      from,
      to: providerEmail,
      subject: `[FIXNEST Reminder] Upcoming Job for ${booking.userName} (${booking.date})`,
      html: providerHtml
    });
  }

  // Reminder to Homeowner
  const homeownerHtml = wrapHtmlBody(
    'Upcoming Service Reminder',
    `
      <p>Hello <strong>${booking.userName}</strong>,</p>
      <p>This is a reminder that your service with <strong>${provider.name}</strong> is scheduled as detailed below:</p>
      
      <div class="details-card">
        <div class="details-row"><span class="label">Provider:</span> <span class="value">${provider.name}</span></div>
        <div class="details-row"><span class="label">Service:</span> <span class="value">${provider.serviceType}</span></div>
        <div class="details-row"><span class="label">Date:</span> <span class="value">${booking.date}</span></div>
        <div class="details-row"><span class="label">Time Slot:</span> <span class="value">${booking.time}</span></div>
        <div class="details-row"><span class="label">Location:</span> <span class="value">${booking.userAddress}</span></div>
      </div>
    `,
    `<a href="${appUrl}/my-bookings" class="btn">View Booking Details</a>`
  );

  await transporter.sendMail({
    from,
    to: booking.userEmail,
    subject: `[FIXNEST Reminder] Upcoming Service with ${provider.name} (${booking.date})`,
    html: homeownerHtml
  });
};

// -------------------------------------------------------------
// 4. FINAL JOB COMPLETION NOTIFICATIONS (Sent to Homeowner & Provider)
// -------------------------------------------------------------
const sendJobCompletionNotification = async ({ booking, provider, providerUser }) => {
  const transporter = createTransporter();
  const from = getFromAddress();
  const appUrl = getAppUrl();
  const providerEmail = providerUser?.email;

  // Email to Homeowner with Review Prompt
  const homeownerHtml = wrapHtmlBody(
    'Job Completed! How was your experience?',
    `
      <p>Hello <strong>${booking.userName}</strong>,</p>
      <p>Your service request with <strong>${provider.name}</strong> has been marked as <strong>COMPLETED</strong>.</p>
      
      <div class="details-card">
        <div class="details-row"><span class="label">Provider:</span> <span class="value">${provider.name}</span></div>
        <div class="details-row"><span class="label">Service:</span> <span class="value">${provider.serviceType}</span></div>
        <div class="details-row"><span class="label">Date:</span> <span class="value">${booking.date}</span></div>
        <div class="details-row"><span class="label">Rate:</span> <span class="value">$${booking.price}/hr</span></div>
        <div class="details-row"><span class="label">Status:</span> <span class="badge badge-completed">COMPLETED</span></div>
      </div>

      <p>Your feedback helps us build a safer and more trustworthy community. Please take a moment to leave a rating and review for <strong>${provider.name}</strong>.</p>
    `,
    `<a href="${appUrl}/my-bookings" class="btn">Leave a Review</a>`
  );

  await transporter.sendMail({
    from,
    to: booking.userEmail,
    subject: `[FIXNEST] Service Completed: Rate & Review ${provider.name}`,
    html: homeownerHtml
  });

  // Email to Provider confirming completion & prompting homeowner review
  if (providerEmail) {
    const providerHtml = wrapHtmlBody(
      'Job Successfully Completed!',
      `
        <p>Hello <strong>${provider.name}</strong>,</p>
        <p>Great job! You have completed the service for <strong>${booking.userName}</strong>.</p>
        
        <div class="details-card">
          <div class="details-row"><span class="label">Client:</span> <span class="value">${booking.userName}</span></div>
          <div class="details-row"><span class="label">Service:</span> <span class="value">${provider.serviceType}</span></div>
          <div class="details-row"><span class="label">Date:</span> <span class="value">${booking.date}</span></div>
          <div class="details-row"><span class="label">Status:</span> <span class="badge badge-completed">COMPLETED</span></div>
        </div>

        <p>You can also leave a rating and review for client <strong>${booking.userName}</strong> on your dashboard.</p>
      `,
      `<a href="${appUrl}/provider/dashboard" class="btn">Rate Homeowner</a>`
    );

    await transporter.sendMail({
      from,
      to: providerEmail,
      subject: `[FIXNEST] Job Completion Confirmed: ${booking.userName}`,
      html: providerHtml
    });
  }
};

// -------------------------------------------------------------
// 5. RESCHEDULE NOTIFICATIONS (Sent to Homeowner & Provider)
// -------------------------------------------------------------
const sendRescheduleNotification = async ({ booking, provider, providerUser, oldDate, oldTime, initiatedBy }) => {
  const transporter = createTransporter();
  const from = getFromAddress();
  const appUrl = getAppUrl();
  const providerEmail = providerUser?.email;
  const initiatorLabel = initiatedBy === 'provider' ? provider.name : booking.userName;

  // Email to Provider — always sent, so they can update their schedule
  if (providerEmail) {
    const providerHtml = wrapHtmlBody(
      'Booking Rescheduled',
      `
        <p>Hello <strong>${provider.name}</strong>,</p>
        <p><strong>${initiatorLabel}</strong> has rescheduled the following booking.</p>

        <div class="details-card">
          <div class="details-row"><span class="label">Client:</span> <span class="value">${booking.userName}</span></div>
          <div class="details-row"><span class="label">Previous Slot:</span> <span class="value">${oldDate} at ${oldTime}</span></div>
          <div class="details-row"><span class="label">New Slot:</span> <span class="value">${booking.date} at ${booking.time}</span></div>
          <div class="details-row"><span class="label">Location:</span> <span class="value">${booking.userAddress}</span></div>
          <div class="details-row"><span class="label">Status:</span> <span class="badge badge-accepted">${booking.status.toUpperCase()}</span></div>
        </div>

        <p>Please update your schedule accordingly.</p>
      `,
      `<a href="${appUrl}/provider/dashboard" class="btn">View Job Details</a>`
    );

    await transporter.sendMail({
      from,
      to: providerEmail,
      subject: `[FIXNEST] Booking Rescheduled: ${booking.userName} (${booking.date})`,
      html: providerHtml
    });
  }

  // Email to Homeowner
  const homeownerHtml = wrapHtmlBody(
    'Your Booking Has Been Rescheduled',
    `
      <p>Hello <strong>${booking.userName}</strong>,</p>
      <p><strong>${initiatorLabel}</strong> has rescheduled your service booking.</p>

      <div class="details-card">
        <div class="details-row"><span class="label">Provider:</span> <span class="value">${provider.name}</span></div>
        <div class="details-row"><span class="label">Previous Slot:</span> <span class="value">${oldDate} at ${oldTime}</span></div>
        <div class="details-row"><span class="label">New Slot:</span> <span class="value">${booking.date} at ${booking.time}</span></div>
      </div>

      <p>If this new time doesn't work for you, you can reschedule again from your bookings page.</p>
    `,
    `<a href="${appUrl}/my-bookings" class="btn">View Booking Details</a>`
  );

  await transporter.sendMail({
    from,
    to: booking.userEmail,
    subject: `[FIXNEST] Booking Rescheduled: ${provider.serviceType} with ${provider.name}`,
    html: homeownerHtml
  });
};

module.exports = {
  sendBookingRequestConfirmation,
  sendBookingStatusAlert,
  sendJobCompletionReminder,
  sendJobCompletionNotification,
  sendRescheduleNotification
};
