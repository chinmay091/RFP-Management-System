// const { ChatOpenAI } = require('@langchain/openai');
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { z } = require('zod');

// Initialize OpenAI model
// const model = new ChatOpenAI({
//   openAIApiKey: process.env.OPENAI_API_KEY,
//   // modelName: 'gpt-4o',
//   modelName: 'gemini-2.0-flash',
//   temperature: 0.3,
// });

const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-2.0-flash",
      temperature: 0.3,
    });

class AIService {
  /**
   * Parse natural language procurement description into structured RFP using LangChain
   */
  async parseRFPFromNaturalLanguage(userInput) {
    try {
      // Define the output schema using Zod
      const rfpSchema = z.object({
        title: z.string().describe('Brief, professional RFP title'),
        description: z.string().describe('Clean summary of requirements'),
        items: z
          .array(
            z.object({
              name: z.string().describe('Item name'),
              quantity: z.number().describe('Quantity needed'),
              specifications: z.string().describe('Detailed specifications'),
            })
          )
          .describe('List of items required'),
        total_budget: z
          .number()
          .nullable()
          .describe('Total budget in USD (numeric value only)'),
        delivery_days: z
          .number()
          .nullable()
          .describe('Delivery timeline in days (numeric value only)'),
        payment_terms: z
          .string()
          .nullable()
          .describe('Payment terms (e.g., Net 30, Net 60)'),
        warranty_requirements: z
          .string()
          .nullable()
          .describe('Warranty requirements'),
      });

      // Create output parser
      const parser = StructuredOutputParser.fromZodSchema(rfpSchema);

      // Get format instructions
      const formatInstructions = parser.getFormatInstructions();

      // Create prompt template
      const promptTemplate = PromptTemplate.fromTemplate(
        `You are an expert procurement assistant. Extract structured RFP details from the following natural language description.

User Input: {userInput}

{formatInstructions}

Important Rules:
- Extract ALL numeric values as plain numbers (no currency symbols, no "days" text)
- If information is missing or unclear, use null
- Be precise and professional
- Keep descriptions concise and clear
- Title should be professional and summarize the procurement need`
      );

      // Format the prompt
      const prompt = await promptTemplate.format({
        userInput: userInput,
        formatInstructions: formatInstructions,
      });

      // Invoke the model
      const response = await model.invoke(prompt);

      // Parse the response
      const parsedData = await parser.parse(response.content);

      console.log('✅ LangChain AI parsed RFP successfully');
      return {
        success: true,
        data: parsedData,
      };
    } catch (error) {
      console.error('❌ LangChain AI Service Error:', error.message);
      return {
        success: false,
        error: 'Failed to parse RFP with AI',
        details: error.message,
      };
    }
  }

  /**
   * Generate a professional RFP email body using LangChain
   */
  async generateRFPEmailBody(rfpData) {
    try {
      // Create prompt template for email generation
      const emailTemplate = PromptTemplate.fromTemplate(
        `You are a professional procurement manager writing an RFP email to vendors.

Your task is to generate ONLY the main body content of the email based on the RFP details below.

IMPORTANT RULES:
1. Do NOT include any greeting (no “Dear …”).
2. Do NOT include any closing (no “Sincerely”, no sign-off).
3. Do NOT repeat the RFP details in a standalone block. I will render them separately in HTML.
4. Do NOT restate headings like “RFP Details”, “Items Required”, or others unless smoothly integrated into the paragraph.
5. Do NOT rewrite the items section in tabular or repeated formats. Summaries are acceptable, duplication is not.
6. Introduce the RFP purpose in 1–2 sentences.
7. Provide a clear, business-friendly overview of the requirements.
8. Provide a call-to-action asking for proposal submission with:
   - Itemized pricing
   - Delivery timeline
   - Payment terms
   - Warranty details
9. Keep tone professional, clear, and concise.
10. Assume the company name is “RFP Management System,” but use it minimally and naturally.

RFP Title: {title}
Total Budget: {budget}
Delivery Deadline: {deadline}
Payment Terms: {paymentTerms}
Warranty Requirements: {warranty}

Items Required:
{items}

Return ONLY the body content, formatted in clean paragraphs with no greeting and no closing.
`
      );

      // Format items for email
      const itemsText = rfpData.structured_requirements.items
        .map(
          (item, idx) =>
            `${idx + 1}. ${item.name} - Quantity: ${item.quantity}, Specifications: ${item.specifications}`
        )
        .join('\n');

      // Format the prompt
      const prompt = await emailTemplate.format({
        title: rfpData.title,
        budget: rfpData.total_budget
          ? `$${parseFloat(rfpData.total_budget).toLocaleString()}`
          : 'To be discussed',
        deadline: rfpData.delivery_deadline
          ? new Date(rfpData.delivery_deadline).toLocaleDateString()
          : 'Not specified',
        paymentTerms: rfpData.payment_terms || 'To be discussed',
        warranty: rfpData.warranty_requirements || 'To be discussed',
        items: itemsText,
      });

      // Invoke the model
      const response = await model.invoke(prompt);

      console.log('✅ LangChain generated email body successfully');
      return response.content.trim();
    } catch (error) {
      console.error('❌ LangChain Email Generation Error:', error.message);
      throw error;
    }
  }

  /**
   * Parse vendor proposal email using LangChain (for Phase 3)
   */
  async parseVendorProposal(emailContent, rfpData) {
    try {
      // Define the output schema for vendor proposals
      const proposalSchema = z.object({
        vendor_name: z
          .string()
          .nullable()
          .describe('Vendor company name if mentioned'),
        items: z
          .array(
            z.object({
              name: z.string().describe('Item name'),
              unit_price: z.number().describe('Price per unit in USD'),
              quantity: z.number().describe('Quantity offered'),
              total_price: z
                .number()
                .describe('Total price for this item (unit_price * quantity)'),
            })
          )
          .describe('List of items with pricing'),
        total_price: z
          .number()
          .describe('Total proposal price for all items'),
        delivery_days: z
          .number()
          .nullable()
          .describe('Delivery time in days'),
        payment_terms: z
          .string()
          .nullable()
          .describe('Payment terms offered'),
        warranty: z.string().nullable().describe('Warranty offered'),
        additional_notes: z
          .string()
          .nullable()
          .describe('Any additional information, conditions, or notes'),
      });

      // Create output parser
      const parser = StructuredOutputParser.fromZodSchema(proposalSchema);
      const formatInstructions = parser.getFormatInstructions();

      // Create prompt template
      const promptTemplate = PromptTemplate.fromTemplate(
        `You are an expert at extracting structured data from vendor proposal emails.

Original RFP Requirements:
Title: {rfpTitle}
Items Requested: {rfpItems}

Vendor Email Content:
{emailContent}

{formatInstructions}

Important Rules:
- Extract ALL pricing as numeric values (no currency symbols)
- Calculate total_price accurately
- If delivery time is mentioned as "X days" or "X weeks", convert to days
- Extract payment terms exactly as stated
- Be thorough in capturing all items and pricing
- If information is not provided, use null`
      );

      // Format RFP items for context
      const rfpItemsText = rfpData.structured_requirements?.items
        ? rfpData.structured_requirements.items
            .map((item) => `${item.name} (Qty: ${item.quantity})`)
            .join(', ')
        : 'Not specified';

      // Format the prompt
      const prompt = await promptTemplate.format({
        rfpTitle: rfpData.title,
        rfpItems: rfpItemsText,
        emailContent: emailContent,
        formatInstructions: formatInstructions,
      });

      // Invoke the model
      const response = await model.invoke(prompt);

      // Parse the response
      const parsedData = await parser.parse(response.content);

      console.log('✅ LangChain parsed vendor proposal successfully');
      return {
        success: true,
        data: parsedData,
      };
    } catch (error) {
      console.error('❌ LangChain Proposal Parsing Error:', error.message);
      return {
        success: false,
        error: 'Failed to parse vendor proposal',
        details: error.message,
      };
    }
  }

  /**
   * Compare and evaluate vendor proposals using LangChain (for Phase 4)
   */
  async compareAndEvaluateProposals(rfpData, proposals) {
    try {
      // Define the output schema for comparison
      const comparisonSchema = z.object({
        evaluations: z
          .array(
            z.object({
              vendor_id: z.string().describe('Vendor UUID'),
              vendor_name: z.string().describe('Vendor name'),
              score: z
                .number()
                .min(0)
                .max(100)
                .describe('Overall score out of 100'),
              price_score: z
                .number()
                .min(0)
                .max(100)
                .describe('Price competitiveness score'),
              delivery_score: z
                .number()
                .min(0)
                .max(100)
                .describe('Delivery timeline score'),
              completeness_score: z
                .number()
                .min(0)
                .max(100)
                .describe('Proposal completeness score'),
              pros: z
                .array(z.string())
                .describe('List of advantages/strengths'),
              cons: z.array(z.string()).describe('List of disadvantages/weaknesses'),
              summary: z.string().describe('Brief evaluation summary'),
            })
          )
          .describe('Individual evaluations for each vendor'),
        recommendation: z.object({
          vendor_id: z.string().describe('Recommended vendor UUID'),
          vendor_name: z.string().describe('Recommended vendor name'),
          reasoning: z
            .string()
            .describe('Detailed reasoning for the recommendation'),
          confidence_level: z
            .enum(['high', 'medium', 'low'])
            .describe('Confidence level in recommendation'),
        }),
        overall_analysis: z
          .string()
          .describe('Overall market analysis and insights'),
      });

      // Create output parser
      const parser = StructuredOutputParser.fromZodSchema(comparisonSchema);
      const formatInstructions = parser.getFormatInstructions();

      // Format proposals for the prompt
      const proposalsText = proposals
        .map((p, idx) => {
          return `
Proposal ${idx + 1}:
- Vendor: ${p.vendor.name} (ID: ${p.vendor_id})
- Total Price: $${parseFloat(p.total_price || 0).toLocaleString()}
- Delivery Time: ${p.delivery_time || 'Not specified'} days
- Payment Terms: ${p.parsed_data?.payment_terms || 'Not specified'}
- Warranty: ${p.parsed_data?.warranty || 'Not specified'}
- Items: ${JSON.stringify(p.parsed_data?.items || [], null, 2)}
`;
        })
        .join('\n---\n');

      // Create prompt template
      const promptTemplate = PromptTemplate.fromTemplate(
        `You are an expert procurement analyst evaluating vendor proposals.

RFP Requirements:
- Title: {rfpTitle}
- Budget: ${'{budget}'}
- Required Delivery: {deliveryDays} days
- Items Needed: {items}

Vendor Proposals:
{proposals}

{formatInstructions}

Evaluation Criteria:
1. Price Score (0-100): How competitive is the pricing? Lower is better but consider value.
2. Delivery Score (0-100): How well does delivery timeline match requirements?
3. Completeness Score (0-100): How complete and detailed is the proposal?
4. Overall Score (0-100): Weighted average considering all factors

Provide:
- Individual scores and evaluations for each vendor
- Clear pros and cons for each
- A final recommendation with strong reasoning
- Overall market analysis

Be objective, data-driven, and consider total cost of ownership, not just price.`
      );

      // Format RFP items
      const itemsText = rfpData.structured_requirements?.items
        ? rfpData.structured_requirements.items
            .map((item) => `${item.name} (${item.quantity} units)`)
            .join(', ')
        : 'Not specified';

      // Format the prompt
      const prompt = await promptTemplate.format({
        rfpTitle: rfpData.title,
        budget: rfpData.total_budget
          ? `$${parseFloat(rfpData.total_budget).toLocaleString()}`
          : 'Not specified',
        deliveryDays: rfpData.delivery_deadline
          ? Math.ceil(
              (new Date(rfpData.delivery_deadline) - new Date()) /
                (1000 * 60 * 60 * 24)
            )
          : 'Not specified',
        items: itemsText,
        proposals: proposalsText,
        formatInstructions: formatInstructions,
      });

      // Invoke the model
      const response = await model.invoke(prompt);

      // Parse the response
      const parsedData = await parser.parse(response.content);

      console.log('✅ LangChain evaluated proposals successfully');
      return {
        success: true,
        data: parsedData,
      };
    } catch (error) {
      console.error('❌ LangChain Evaluation Error:', error.message);
      return {
        success: false,
        error: 'Failed to evaluate proposals',
        details: error.message,
      };
    }
  }
}

module.exports = new AIService();