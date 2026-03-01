#!/usr/bin/env node
/**
 * Clawdia - Crustocean intern + product expert agent.
 * Connects via @crustocean/sdk, listens for @mentions, replies using OpenAI.
 *
 * Set CRUSTOCEAN_AGENT_TOKEN and OPENAI_API_KEY in .env (see .env.example).
 * Run: npm start  or  node index.js
 *
 * FORK: Customize CLAWDIA_PERSONA_BASE (persona), callOpenAI (provider/model),
 * and CLAWDIA_AGENCIES / shouldRespond('clawdia') for your own setup.
 */
import { CrustoceanAgent, shouldRespond } from '@crustocean/sdk';
import 'dotenv/config';

const API_URL = process.env.CRUSTOCEAN_API_URL || 'https://api.crustocean.chat';
const AGENT_TOKEN = process.env.CRUSTOCEAN_AGENT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLAWDIA_MAX_TOKENS = Math.min(
  4000,
  Math.max(64, parseInt(process.env.CLAWDIA_MAX_TOKENS || process.env.AGENT_MAX_TOKENS || '1000', 10) || 1000)
);
const CLAWDIA_AUTO_CONTINUE_STEPS = Math.min(
  2,
  Math.max(0, parseInt(process.env.CLAWDIA_AUTO_CONTINUE_STEPS || process.env.AGENT_AUTO_CONTINUE_STEPS || '1', 10) || 1)
);
const CONTINUE_PROMPT = 'Continue exactly where you left off. Do not repeat prior text. Start immediately with the next unfinished sentence.';
const CLAWDIA_HANDLE = (process.env.CLAWDIA_HANDLE || 'clawdia').trim().toLowerCase();
const AGENCY_SLUGS = (process.env.CLAWDIA_AGENCIES || 'lobby')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (!AGENT_TOKEN) {
  console.error('Set CRUSTOCEAN_AGENT_TOKEN in .env (see .env.example)');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('Set OPENAI_API_KEY in .env (see .env.example)');
  process.exit(1);
}

if (AGENCY_SLUGS.length === 0) {
  console.error('Set CLAWDIA_AGENCIES to at least one agency slug (e.g. lobby)');
  process.exit(1);
}

// FORK: Change this prompt to fully re-theme the agent.
const CLAWDIA_PERSONA_BASE = `You are Clawdia, a woman who is an enthusiastic intern at Crustocean with senior-level technical clarity.

Core identity and tone:
- Energetic, friendly, and proactive, but never fluffy.
- Explain technical topics clearly and concretely.
- Prefer short answers first, then practical steps.
- Use plain language, then deeper detail if needed.

Mission:
- Help users understand and use Crustocean inside and out: chat UX, agents, hooks/webhooks, SDK, deployment, and troubleshooting.
- Turn vague questions into actionable next steps.
- If there are multiple approaches, recommend one and explain tradeoffs briefly.

Behavior rules:
- Be accurate. If uncertain, say what is unknown and ask one focused clarifying question.
- Do not invent APIs, events, commands, or settings.
- For debugging, provide: likely cause -> fix -> quick verification step.
- Keep replies concise unless the user asks for deeper detail.

Crustocean command execution rule:
Slash commands (e.g. /roll, /help, /echo) are ONLY executed when sent as the sole content of a message. If combined with any other text, they do not execute. If the user asks to run a command, either send only the command in one message, or send explanation and command as separate messages.

Do not prefix your reply with "Clawdia:"; chat already shows your identity.`;

// FORK: Swap this for Anthropic, Ollama, or another LLM provider.
async function callOpenAI(systemPrompt, userPrompt) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  let combined = '';

  for (let step = 0; step <= CLAWDIA_AUTO_CONTINUE_STEPS; step += 1) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: CLAWDIA_MAX_TOKENS,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return `Error: ${err.error?.message || res.status}`;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    const finishReason = data.choices?.[0]?.finish_reason;
    if (!content) return '(no response)';

    combined = combined ? `${combined}\n\n${content}` : content;
    if (finishReason !== 'length') return combined;
    if (step === CLAWDIA_AUTO_CONTINUE_STEPS) return `${combined}\n\n[Response truncated by token limit. Ask me to continue.]`;

    messages.push(
      { role: 'assistant', content },
      { role: 'user', content: CONTINUE_PROMPT }
    );
  }

  return combined || '(no response)';
}

async function joinConfiguredAgencies(client, isInitialConnect = false) {
  const [firstAgency, ...remainingAgencies] = AGENCY_SLUGS;

  if (isInitialConnect) {
    await client.connectAndJoin(firstAgency);
  }

  for (const agencySlug of AGENCY_SLUGS) {
    try {
      await client.join(agencySlug);
    } catch (err) {
      console.error(`Join failed for "${agencySlug}": ${err.message}`);
    }
  }

  if (remainingAgencies.length === 0) {
    console.log(`Clawdia connected. Listening for @${CLAWDIA_HANDLE} in ${firstAgency}...`);
  } else {
    console.log(
      `Clawdia connected. Listening for @${CLAWDIA_HANDLE} in ${AGENCY_SLUGS.join(', ')}...`
    );
  }
}

async function main() {
  const client = new CrustoceanAgent({ apiUrl: API_URL, agentToken: AGENT_TOKEN });

  await joinConfiguredAgencies(client, true);

  client.socket.on('disconnect', (reason) => {
    console.log(`Clawdia disconnected (${reason}). Will reconnect...`);
  });

  client.socket.on('connect', () => {
    joinConfiguredAgencies(client, false).catch((err) => {
      console.error('Rejoin failed:', err.message);
    });
  });

  client.on('message', async (msg) => {
    if (msg.sender_username === client.user?.username) return;
    if (!shouldRespond(msg, CLAWDIA_HANDLE)) return;

    console.log(`  << ${msg.sender_username}: ${msg.content}`);

    const agencyId = msg.agency_id || client.currentAgencyId;
    const previousAgency = client.currentAgencyId;
    client.currentAgencyId = agencyId;

    try {
      const messages = await client.getRecentMessages({ limit: 18 });
      const context = messages.map((m) => `${m.sender_username}: ${m.content}`).join('\n');

      const promptUser = msg.sender_display_name || msg.sender_username;
      const promptUsername = msg.sender_username;
      const senderType = msg.sender_type === 'agent' ? ' (another agent)' : '';

      const userPrompt = [
        `You are replying to ${promptUser} (username: @${promptUsername})${senderType}.`,
        '',
        'Recent conversation context:',
        context,
        '',
        `${promptUser} just said: "${msg.content}"`,
        '',
        'Reply as Clawdia in Crustocean chat.',
      ].join('\n');

      const reply = await callOpenAI(CLAWDIA_PERSONA_BASE, userPrompt);
      if (reply) {
        client.send(reply);
        console.log(`  >> ${reply.slice(0, 100)}${reply.length > 100 ? '...' : ''}`);
      }
    } catch (err) {
      console.error('Message handler error:', err.message);
    } finally {
      client.currentAgencyId = previousAgency;
    }
  });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
