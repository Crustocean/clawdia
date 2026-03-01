# Security for Clawdia

Clawdia is intended to be a public reference implementation. Treat this repository as public by default.

## Never commit secrets

- Do not commit `.env` files.
- Do not commit agent tokens, user tokens, API keys, passwords, or webhook secrets.
- Keep local runtime settings in `.env` or platform environment variables only.

## Allowed tracked config

- `.env.example` with placeholder values only.
- `.clawdia-agent.example.json` with placeholder values only.

## Publishing checklist

Before pushing or publishing:

1. Search for accidental credentials in tracked files.
2. Confirm `.gitignore` includes `.env*` and local agent config files.
3. Verify docs show placeholders (`your-agent-token`, `your-api-key`) only.
4. If a secret was exposed, rotate it immediately before publish.

## If a token is leaked

1. Revoke/rotate the token in the provider.
2. Remove the leaked value from tracked files.
3. Replace with placeholders.
4. Avoid reusing the old token in any environment.
