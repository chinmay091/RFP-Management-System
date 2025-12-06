const nodemailer = require("nodemailer");
const Imap = require("imap");
const { simpleParser } = require("mailparser");

class EmailService {
  constructor() {
    // SMTP Transporter for sending emails
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify SMTP connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error("❌ SMTP connection failed:", error.message);
      } else {
        console.log("✅ SMTP server is ready to send emails");
      }
    });
  }

  /**
   * Send RFP email to a vendor
   */
  async sendRFPEmail(vendorEmail, vendorName, rfpData, emailBody) {
    try {
      const subject = `RFP: ${rfpData.title}`;

      const mailOptions = {
        from: `"RFP Management System" <${process.env.EMAIL_FROM}>`,
        to: vendorEmail,
        subject: subject,
        text: emailBody,
        html: this.generateEmailHTML(vendorName, rfpData, emailBody),
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Email sent to ${vendorEmail}: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(
        `❌ Failed to send email to ${vendorEmail}:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate HTML email body
   */
  generateEmailHTML(vendorName, rfpData, emailBody) {
    const items = rfpData.structured_requirements?.items || [];
    const itemsHTML = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.specifications}</td>
        </tr>
      `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background-color: #f3f4f6; padding: 10px; text-align: left; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Request for Proposal</h1>
          </div>
          <div class="content">
            <p>Dear ${vendorName},</p>
            <p>${emailBody.split("\n\n")[0]}</p>
            
            <div class="details">
              <h3>RFP Details</h3>
              <p><strong>Title:</strong> ${rfpData.title}</p>
              <p><strong>Budget:</strong> $${parseFloat(
                rfpData.total_budget || 0
              ).toLocaleString()}</p>
              <p><strong>Delivery Deadline:</strong> ${
                rfpData.delivery_deadline
                  ? new Date(rfpData.delivery_deadline).toLocaleDateString()
                  : "Not specified"
              }</p>
              <p><strong>Payment Terms:</strong> ${
                rfpData.payment_terms || "To be discussed"
              }</p>
              <p><strong>Warranty:</strong> ${
                rfpData.warranty_requirements || "To be discussed"
              }</p>
            </div>

            ${
              items.length > 0
                ? `
              <h3>Items Required:</h3>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Specifications</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
            `
                : ""
            }

            <p>${emailBody.split("\n\n").slice(1).join("\n\n")}</p>
          </div>
          <div class="footer">
            <p>This is an automated email from RFP Management System</p>
            <p>Please reply to this email with your proposal</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Connect to IMAP and fetch unread emails
   */
  async fetchUnreadEmails() {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASSWORD,
        host: process.env.IMAP_HOST,
        port: process.env.IMAP_PORT,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      });

      const emails = [];

      imap.once("ready", () => {
        console.log("✅ IMAP connection established");

        imap.openBox("INBOX", false, (err, box) => {
          if (err) {
            console.error("❌ Failed to open inbox:", err);
            imap.end();
            return reject(err);
          }

          // Search for unseen emails
          imap.search(["UNSEEN"], (err, results) => {
            if (err) return reject(err);

            if (!results || results.length === 0) {
              return resolve([]);
            }

            // Only process last 50 emails
            const last50 = results.slice(-50);

            const f = imap.fetch(last50, { bodies: "", markSeen: true });

            f.on("message", function (msg, seqno) {
              let buffer = "";
              let attributes = null;

              msg.on("body", function (stream) {
                stream.on("data", function (chunk) {
                  buffer += chunk.toString("utf8");
                });
              });

              msg.on("attributes", function (attrs) {
                attributes = attrs;
              });

              msg.on("end", async function () {
                simpleParser(buffer, (err, mail) => {
                  if (err) return console.error("Parse error:", err);
                  emails.push(mail);
                });
              });
            });

            f.once("error", (err) => reject(err));
            f.once("end", () => resolve(emails));
          });
        });
      });

      imap.once("error", (err) => {
        console.error("❌ IMAP connection error:", err);
        reject(err);
      });

      imap.once("end", () => {
        console.log("📪 IMAP connection ended");
        resolve(emails);
      });

      imap.connect();
    });
  }

  /**
   * Mark email as read (optional)
   */
  async markAsRead(messageId) {
    // Implementation if needed
  }
}

module.exports = new EmailService();
