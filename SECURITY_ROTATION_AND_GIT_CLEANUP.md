Security rotation & git history cleanup playbook

Goal: Immediately stop any active abuse (spam from your email), rotate all exposed credentials, and remove secrets from git history safely.

IMPORTANT PRECAUTIONS
- Always rotate (change/revoke) credentials before rewriting git history. If you rewrite history first without rotating, secrets remain valid until rotated.
- Communicate with collaborators: history rewrite requires a force-push and everyone must rebase or re-clone.
- Make backups: create an offline snapshot of the repo before any history rewrite.
- Do not paste secrets in chat or share them here.

High-level steps
1) Emergency credentials rotation (do this immediately)
2) Lock down email account and revoke app access
3) Confirm abuse has stopped (check Sent folder, mail server logs)
4) Remove secrets from git history (BFG or git filter-repo)
5) Force-push cleaned history and notify collaborators
6) Audit and harden repository settings and CI

Detailed step-by-step

A. Emergency rotation (immediately)
1. Change password for the email account used as SMTP (Gmail/GSuite):
   - Sign in to Google Account -> Security -> Password -> change.
   - Revoke app passwords and OAuth tokens: Security -> Third-party apps with account access -> Remove access.
2. Rotate SMTP credentials (if provided by a separate SMTP provider): login to SMTP provider and create new credentials; delete old ones.
3. Rotate other API keys in `.env` (Firebase, AWS, Xendit, etc.) — revoke old keys.
4. If using Gmail+SMTP via OAuth: revoke tokens and reset OAuth client credentials if possible.

B. Lockdown email and accounts
1. Enable 2FA (TOTP) on the email account.
2. Check Gmail "Sent" and "Forwarding and POP/IMAP" and disable any forwarders or filters that auto-send.
3. Check account activity (recent logins) and devices; sign out everywhere.

C. Collect evidence (optional but useful)
- Save examples of offending emails (Full headers): in Gmail: Open message -> More -> Show original -> Save as .eml
- Note timestamps and any "Received" headers for analysis.

D. Clean git history (only after secrets rotated)
1. Make a backup of the repo (just copy the folder off-site).
2. Ensure you rotated/sealed secrets already.
3. Choose a tool: BFG or git-filter-repo (prefer `git-filter-repo` if available).

Using BFG (quick):
- Install Java and BFG jar.
- Run:
  ```bash
  # Replace 'password' or regex with your patterns
  java -jar bfg.jar --delete-files .env
  java -jar bfg.jar --replace-text passwords.txt
  git reflog expire --expire=now --all && git gc --prune=now --aggressive
  git push --force
  ```

Using git-filter-repo (recommended):
- Install: `pip install git-filter-repo` or use package manager
- Example to remove `.env` and replace secrets:
  ```bash
  git filter-repo --invert-paths --path .env
  # OR to replace secrets in files
  git filter-repo --replace-text replacements.txt
  ```
- After running filter-repo:
  ```bash
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  git push --force --all
  git push --force --tags
  ```

E. Post-cleanup
- Notify collaborators to reclone or rebase their work.
- Verify no secrets remain: run `git grep -i "SMTP_" $(git rev-list --all)` locally.
- Enable repository protection: branch protection, remove unnecessary collaborators, enable secret scanning.

Commands I can run for you (I will NOT run history rewrite without explicit confirmation)
- Show commits that touched `.env` (I already found `1d5374a` which deleted .env). I can show the full content of the tracked `.env` commit if you want (but DO NOT paste secrets here).
- After you confirm rotation, I can run `git filter-repo` steps and force-push the cleaned history. I'll coordinate messages to collaborators.

If you want me to proceed now, tell me:
- Confirm that you have rotated all credentials mentioned above OR you want me to pause and help you rotate first.
- Whether you prefer `git-filter-repo` (recommended) or `BFG`.

