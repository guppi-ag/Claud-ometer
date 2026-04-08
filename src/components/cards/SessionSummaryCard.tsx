'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, CheckCircle2, Wrench, Radio, AlertCircle, Loader2 } from 'lucide-react';

interface SessionSummary {
  whatWasDone: string[];
  whatWasFixed: string[];
  currentState: string;
}

interface SessionSummaryCardProps {
  sessionId: string;
}

export function SessionSummaryCard({ sessionId }: SessionSummaryCardProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function generate() {
    setState('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/sessions/${sessionId}/summarize`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Unknown error');
      }
      setSummary(data.summary);
      setState('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to generate summary');
      setState('error');
    }
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Session Summary
          </CardTitle>
          {state !== 'loading' && (
            <button
              onClick={generate}
              className="flex items-center gap-1.5 rounded-md bg-primary/10 hover:bg-primary/20
                         px-2.5 py-1 text-xs font-medium text-primary transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              {state === 'done' ? 'Regenerate' : 'Summarize with AI'}
            </button>
          )}
          {state === 'loading' && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating...
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {state === 'idle' && (
          <p className="text-xs text-muted-foreground">
            Click &ldquo;Summarize with AI&rdquo; to generate a quick summary of what happened in this session.
          </p>
        )}
        {state === 'error' && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {state === 'loading' && (
          <div className="space-y-2">
            {[60, 80, 50].map((w, i) => (
              <div key={i} className={`h-3 w-${w === 60 ? '3/5' : w === 80 ? '4/5' : '1/2'} animate-pulse rounded bg-muted`} />
            ))}
          </div>
        )}
        {state === 'done' && summary && (
          <div className="space-y-4">
            {/* What Was Done */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-foreground">What Was Done</span>
                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                  {summary.whatWasDone.length}
                </Badge>
              </div>
              <ul className="space-y-1.5">
                {summary.whatWasDone.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What Was Fixed — only if non-empty */}
            {summary.whatWasFixed.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Wrench className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-foreground">What Was Fixed</span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">
                      {summary.whatWasFixed.length}
                    </Badge>
                  </div>
                  <ul className="space-y-1.5">
                    {summary.whatWasFixed.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                        <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Current State */}
            <Separator />
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Radio className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-foreground">Current State</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{summary.currentState}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
