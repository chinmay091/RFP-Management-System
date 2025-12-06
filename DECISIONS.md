# Key Design Decisions & Assumptions

## Technology Choices

### Why Node.js + Express?
- Matches my current tech stack at Lorien Finance
- Async/await perfect for AI API calls
- Large ecosystem for email handling
- Easy integration with LangChain

### Why LangChain over Raw OpenAI?
- Structured output parsing with Zod schemas
- Better prompt management
- Type-safe responses
- Mirrors my experience with LangChain + Gemini at Lorien
- Production-ready error handling

### Why PostgreSQL + Sequelize?
- My daily tools at Lorien Finance
- JSONB support for structured_requirements
- Relational data (RFPs ↔ Vendors ↔ Proposals)
- Easy to scale

### Why React + TailwindCSS?
- Component reusability
- Rapid UI development with Tailwind
- Industry standard

## Architecture Decisions

### 1. RFP Data Model
- **structured_requirements as JSONB**: Flexible schema for diverse procurement needs
- **RFPVendor join table**: Many-to-many relationship tracking email status
- **Proposal.parsed_data as JSONB**: AI-extracted data can vary by vendor

### 2. AI Integration Strategy
- **Three AI touchpoints**:
  1. RFP Creation: Natural language → Structured data
  2. Proposal Parsing: Email → Structured proposal
  3. Comparison: Multiple proposals → Evaluation + Recommendation
- **Zod schemas**: Ensure AI outputs are always valid

### 3. Email Flow
- **SMTP for sending**: Reliable, widely supported
- **IMAP for receiving**: Poll-based (simple, no webhooks needed)
- **Vendor matching**: By email address in From field
- **RFP matching**: By subject line or most recent sent RFP

### 4. Scoring Algorithm (AI-Assisted)
AI evaluates on three dimensions:
- **Price Score**: Value for money (not just lowest)
- **Delivery Score**: Meets timeline requirements
- **Completeness Score**: How thorough is the proposal

## Assumptions

### Email
- Vendors reply to the RFP email (not a separate channel)
- Vendor email addresses are unique
- Gmail SMTP/IMAP available (production would use SendGrid)
- Emails are text/HTML (no complex PDF attachments for MVP)

### RFPs
- Single-user system (no multi-tenant)
- RFPs are sent once (no re-sending or updates)
- Budget is USD (no multi-currency)
- Delivery time in days (not hours/weeks)

### Proposals
- One proposal per vendor per RFP
- Vendors include pricing in email body
- AI can extract key info (90%+ accuracy with GPT-4)

### Comparison
- All proposals compared at once (not streaming)
- Recommendation is advisory (human makes final call)
- Scores are relative to RFP requirements

## What I'd Add Next (Given More Time)

### High Priority
1. **PDF Attachment Parsing**: Use pdf-parse or Textract
2. **Multi-User Auth**: JWT + role-based access
3. **Email Templates**: Customizable RFP emails
4. **Proposal Negotiations**: Counter-offers, Q&A threads
5. **Audit Trail**: Who viewed/compared what proposals

### Medium Priority
6. **Webhook-Based Email**: Replace IMAP polling
7. **Budget Alerts**: Notify if over budget
8. **Vendor Performance Tracking**: Historical win rates
9. **Dashboard Analytics**: Charts, trends
10. **Export to PDF**: Download comparison reports

### Nice to Have
11. **Real-time Notifications**: WebSockets for new proposals
12. **Mobile App**: React Native version
13. **AI Chat**: Ask questions about proposals
14. **Integration**: QuickBooks, SAP for procurement
15. **A/B Testing**: Different RFP phrasings

## AI Tools Used

### Development
- **GitHub Copilot**: ~40% of boilerplate code
- **Claude/ChatGPT**: Architecture planning, debugging complex issues
- **Cursor AI**: Component generation and refactoring

### What I Learned
- LangChain's StructuredOutputParser is superior to JSON mode
- IMAP is trickier than expected (async/await with callbacks)
- TailwindCSS utility classes scale well for rapid UI
- Zod schemas catch AI hallucinations early

### Prompt Engineering Insights
- Specific output format instructions reduce parsing errors
- Examples in prompts improve extraction accuracy
- Temperature 0.3 balances creativity and consistency
- Always validate AI outputs (never trust blindly)

## Limitations & Trade-offs

### Current Limitations
1. **No attachment support**: Would need pdf-parse + Textract
2. **Single-user**: Auth would require JWT + user context
3. **Poll-based email**: 30-second intervals, not instant
4. **No retry logic**: Failed emails aren't automatically retried
5. **Memory-only caching**: No Redis for API response caching

### Trade-offs Made
- **LangChain over raw API**: More robust but slightly slower
- **IMAP over webhooks**: Simpler setup, less real-time
- **Client-side state**: No Redux (simpler, faster to build)
- **Monolithic backend**: Single Express app (easier deployment)
- **No TypeScript**: Faster development for MVP

## Testing Strategy

### What I Tested
- RFP creation with various inputs
- Email sending to real Gmail accounts
- Proposal parsing with different formats
- Comparison with 2-5 proposals
- Edge cases (no vendors, single proposal, missing data)

### How I'd Test in Production
- **Unit tests**: Jest for services (AI, email)
- **Integration tests**: Supertest for API routes
- **E2E tests**: Playwright for full user flows
- **Load tests**: k6 for email sending at scale
- **AI accuracy**: Human eval on 100 sample proposals