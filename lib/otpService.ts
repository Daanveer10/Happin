// OTP sending service
// Supports email (SendGrid) and SMS (Twilio)

export async function sendEmailOTP(email: string, otp: string): Promise<void> {
  // Use SendGrid if available, otherwise log (for development)
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  
  if (sendGridApiKey) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendGridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email }],
              subject: "Your Happin Login Code",
            },
          ],
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || "noreply@happin.app",
            name: "Happin",
          },
          content: [
            {
              type: "text/html",
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Your Happin Login Code</h2>
                  <p>Your verification code is:</p>
                  <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: #f0f0f0; border-radius: 8px; margin: 20px 0;">
                    ${otp}
                  </div>
                  <p>This code will expire in 5 minutes.</p>
                  <p>If you didn't request this code, please ignore this email.</p>
                </div>
              `,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("SendGrid error:", error);
        throw new Error("Failed to send email");
      }
    } catch (error) {
      console.error("Email sending failed:", error);
      // In development, log the OTP instead of failing
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV] OTP for ${email}: ${otp}`);
      } else {
        throw error;
      }
    }
  } else {
    // No SendGrid configured - log OTP (for development/testing)
    console.log(`[OTP] Email OTP for ${email}: ${otp}`);
    console.log(`[OTP] SENDGRID_API_KEY not configured - OTP logged above. Check Vercel function logs.`);
    // Don't throw - allow testing without SendGrid
  }
}

export async function sendSMSOTP(phone: string, otp: string): Promise<void> {
  // Use Twilio if available
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: twilioPhoneNumber,
            To: phone,
            Body: `Your Happin login code is: ${otp}. This code expires in 5 minutes.`,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Twilio error:", error);
        throw new Error("Failed to send SMS");
      }
    } catch (error) {
      console.error("SMS sending failed:", error);
      // In development, log the OTP instead of failing
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV] OTP for ${phone}: ${otp}`);
      } else {
        throw error;
      }
    }
  } else {
    // No Twilio configured - log OTP (for development/testing)
    console.log(`[OTP] SMS OTP for ${phone}: ${otp}`);
    console.log(`[OTP] Twilio credentials not configured - OTP logged above. Check Vercel function logs.`);
    // Don't throw - allow testing without Twilio
  }
}

