const { RFP, Vendor, RFPVendor, Proposal } = require('../models');
const emailService = require('../services/emailService');
const aiService = require('../services/aiService');

function extractSenderEmail(from) {
  if (!from) return null;

  // Case 1: Parsed object structure → always safest
  if (typeof from === "object" && from?.value?.[0]?.address) {
    return from.value[0].address;
  }

  // Case 2: Maybe parser gave a text version
  const text = typeof from === "object" ? from.text : from;

  if (typeof text === "string") {
    const match =
      text.match(/<(.+?)>/) ||
      text.match(/([^\s]+@[^\s]+)/);

    return match ? match[1] : null;
  }

  return null;
}


class EmailController {
  /**
   * Send RFP to selected vendors
   */
  async sendRFPToVendors(req, res) {
    try {
      const { rfpId } = req.params;
      const { vendorIds } = req.body;

      if (!vendorIds || vendorIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one vendor must be selected',
        });
      }

      // Fetch RFP
      const rfp = await RFP.findByPk(rfpId);
      if (!rfp) {
        return res.status(404).json({
          success: false,
          message: 'RFP not found',
        });
      }

      // Fetch vendors
      const vendors = await Vendor.findAll({
        where: { id: vendorIds },
      });

      if (vendors.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No valid vendors found',
        });
      }

      // Generate email body using AI
      console.log('🔄 Generating email body with AI...');
      const emailBody = await aiService.generateRFPEmailBody(rfp.toJSON());

      const results = [];

      // Send emails to each vendor
      for (const vendor of vendors) {
        console.log(`📧 Sending email to ${vendor.name} (${vendor.email})`);
        
        const emailResult = await emailService.sendRFPEmail(
          vendor.email,
          vendor.name,
          rfp.toJSON(),
          emailBody
        );

        // Create or update RFPVendor relationship
        await RFPVendor.upsert({
          rfp_id: rfpId,
          vendor_id: vendor.id,
          sent_at: new Date(),
          email_status: emailResult.success ? 'sent' : 'failed',
        });

        results.push({
          vendor: vendor.name,
          email: vendor.email,
          status: emailResult.success ? 'sent' : 'failed',
          error: emailResult.error,
        });
      }

      // Update RFP status to 'sent'
      rfp.status = 'sent';
      await rfp.save();

      const successCount = results.filter((r) => r.status === 'sent').length;

      return res.json({
        success: true,
        message: `RFP sent to ${successCount} out of ${vendors.length} vendor(s)`,
        results,
      });
    } catch (error) {
      console.error('Error sending RFP:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send RFP',
        error: error.message,
      });
    }
  }

  /**
   * Fetch and process new vendor emails
   */
  async fetchVendorEmails(req, res) {
    try {
      console.log('🔄 Fetching new emails...');
      const emails = await emailService.fetchUnreadEmails();

      if (emails.length === 0) {
        return res.json({
          success: true,
          message: 'No new emails found',
          count: 0,
        });
      }

      const processedEmails = [];

      for (const email of emails) {
        console.log(`📧 Processing email from: ${email.from}`);

        // Extract email address
        const senderEmail = extractSenderEmail(email.from);

        if (!senderEmail) {
          console.log("⚠️ Unable to extract sender email from:", email.from);
          continue;
        }

        // Find vendor by email
        const vendor = await Vendor.findOne({
          where: { email: senderEmail },
        });

        if (!vendor) {
          console.log(`⚠️ Email from unknown vendor: ${senderEmail}`);
          continue;
        }

        // Try to match with an RFP based on subject
        const rfpMatch = email.subject.match(/RFP.*?:/);
        let rfp = null;

        if (rfpMatch) {
          // Try to find RFP by title
          rfp = await RFP.findOne({
            where: { status: 'sent' },
            include: [
              {
                association: 'vendors',
                where: { id: vendor.id },
              },
            ],
          });
        }

        if (!rfp) {
          // Get the most recent RFP sent to this vendor
          rfp = await RFP.findOne({
            where: { status: 'sent' },
            include: [
              {
                association: 'vendors',
                where: { id: vendor.id },
              },
            ],
            order: [['created_at', 'DESC']],
          });
        }

        if (!rfp) {
          console.log(`⚠️ No matching RFP found for vendor: ${vendor.name}`);
          continue;
        }

        // Parse email content with AI
        console.log(`🤖 Parsing proposal with AI...`);
        const parseResult = await aiService.parseVendorProposal(
          email.text || email.html,
          rfp.toJSON()
        );

        if (!parseResult.success) {
          console.error(`❌ Failed to parse proposal from ${vendor.name}`);
          continue;
        }

        // Create proposal
        const proposal = await Proposal.create({
          rfp_id: rfp.id,
          vendor_id: vendor.id,
          raw_email_content: email.text || email.html,
          parsed_data: parseResult.data,
          total_price: parseResult.data.total_price,
          delivery_time: parseResult.data.delivery_days,
          status: 'parsed',
          received_at: email.date,
        });

        console.log(`✅ Created proposal from ${vendor.name}`);

        processedEmails.push({
          vendor: vendor.name,
          rfp: rfp.title,
          proposalId: proposal.id,
        });
      }

      return res.json({
        success: true,
        message: `Processed ${processedEmails.length} proposal(s)`,
        count: processedEmails.length,
        proposals: processedEmails,
      });
    } catch (error) {
      console.error('Error fetching emails:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch emails',
        error: error.message,
      });
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfig(req, res) {
    try {
      const testEmail = req.body.email || process.env.EMAIL_USER;

      const info = await emailService.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: testEmail,
        subject: 'RFP System - Email Test',
        text: 'This is a test email from your RFP Management System.',
        html: '<p>This is a test email from your <strong>RFP Management System</strong>.</p>',
      });

      return res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: info.messageId,
      });
    } catch (error) {
      console.error('Email test failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: error.message,
      });
    }
  }
}

module.exports = new EmailController();