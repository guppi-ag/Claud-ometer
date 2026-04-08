import { NextResponse } from 'next/server';
import { getSessionDetail } from '@/lib/claude-data/reader';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionDetail(id);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not set in environment' },
        { status: 500 }
      );
    }

    // Build condensed conversation — user messages get more room, assistant truncated
    const messages = session.messages || [];
    let conversationText = '';
    let charCount = 0;
    const MAX_CHARS = 8000;

    for (const msg of messages) {
      if (charCount >= MAX_CHARS) {
        conversationText += '\n[... conversation truncated ...]\n';
        break;
      }
      const prefix = msg.role === 'user' ? 'USER' : 'CLAUDE';
      const limit = msg.role === 'user' ? 1200 : 600;
      const content = msg.content.length > limit
        ? msg.content.slice(0, limit) + '...'
        : msg.content;
      const line = `${prefix}: ${content}\n\n`;
      conversationText += line;
      charCount += line.length;
    }

    const prompt = `Analyze this Claude Code session and return a structured JSON summary.

Project: ${session.projectName}
Duration: ${Math.round(session.duration / 60000)} minutes
Tool calls: ${session.toolCallCount}
Messages: ${session.messageCount}

CONVERSATION:
${conversationText}

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "whatWasDone": ["action 1", "action 2"],
  "whatWasFixed": ["fix 1", "fix 2"],
  "currentState": "One or two sentences on final state or outcome."
}

Rules:
- whatWasDone: 2-6 concise bullet points of tasks completed
- whatWasFixed: specific bugs, errors, or issues resolved — empty array [] if none
- currentState: where things stand at end of session`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return NextResponse.json({ error: 'Anthropic API call failed' }, { status: 500 });
    }

    const data = await response.json();
    const text: string = data.content?.[0]?.text ?? '';

    let summary;
    try {
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      summary = JSON.parse(clean);
    } catch {
      console.error('Failed to parse summary JSON:', text);
      return NextResponse.json({ error: 'Failed to parse summary response' }, { status: 500 });
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
