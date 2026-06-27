<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Workflow

- **Deploy via push-to-deploy, and do it by default.** Nick tests on the production server, so the expectation is: once a change is built and working, commit and push it without asking each time (he should not have to prompt "now commit and push"). Vercel's Git integration is connected to this repo (`murtopia/hacksathon-com`), and pushing `main` auto-deploys to production (verified working). The flow for shipping a change is: run a successful `npm run build` to catch errors locally, then `git commit` and `git push origin main`. The push triggers the production deploy, so Nick can review it on the live site. Commit only the files for the change at hand (use explicit paths) since other agents may be working in the same tree, and confirm `.env.local` stays git-ignored. Note: the git root is one level above this app (`hacksathon-app/`); Vercel's Root Directory is set to `hacksathon-app`, so deploys build correctly from the subdirectory.
- **Avoid `vercel --prod`.** We used to deploy uncommitted work via the CLI, which bypassed git and left commits unpushed. Don't do that anymore - commit and push instead so production always maps to a pushed commit (and the code is backed up on GitHub). Only fall back to the CLI if push-to-deploy is confirmed broken.
- Don't spin up local dev/prod servers for testing: this environment has no outbound internet to Supabase, so local pages that need the DB can't be eyeballed anyway.

# Writing style

- **Never use em dashes (`—`) anywhere in this project** - not in user-facing copy, emails, metadata, comments, docs, or commit messages. Em dashes read as AI-generated to many people, and we want our content to feel human.
- When you would reach for an em dash, rewrite the sentence, or use a comma, colon, parentheses, a period, or a spaced hyphen (` - `) instead - whichever fits the grammar best.
- This applies to en dashes (`–`) in prose too; prefer plain words or hyphens.
- We always write the product as "Hacks-a-Thon" (never "hackathon").
