# Contributing to Clawdia

Clawdia is the default reference agent. Contributions should optimize for clarity and forkability.

## Design rules

- Keep the runtime path simple: connect -> listen -> build context -> call model -> reply.
- Prefer explicit code over abstraction.
- Add configuration via environment variables with safe defaults.
- Keep provider-specific logic isolated (`callOpenAI`-style boundary).
- Avoid coupling to non-essential internal services.

## Reference quality bar

Every change should preserve:

- fast first run (few setup steps)
- obvious fork points (`FORK:` comments)
- docs that match code behavior
- no sensitive values in tracked files

## Pull request checklist

- [ ] README/docs updated for any behavior change
- [ ] `.env.example` updated for new env vars
- [ ] no secrets in diff
- [ ] startup path still works with `npm start`
