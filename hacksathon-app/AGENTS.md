<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Workflow

- After a successful `npm run build`, prefer deploying to production (`vercel --prod` from the repo root) so Nick can review the change on the live site, rather than spinning up local dev/prod servers for testing. This environment also has no outbound internet to Supabase, so local pages that need the DB can't be eyeballed anyway.

# Writing style

- **Never use em dashes (`—`) anywhere in this project** - not in user-facing copy, emails, metadata, comments, docs, or commit messages. Em dashes read as AI-generated to many people, and we want our content to feel human.
- When you would reach for an em dash, rewrite the sentence, or use a comma, colon, parentheses, a period, or a spaced hyphen (` - `) instead - whichever fits the grammar best.
- This applies to en dashes (`–`) in prose too; prefer plain words or hyphens.
- We always write the product as "Hacks-a-Thon" (never "hackathon").
