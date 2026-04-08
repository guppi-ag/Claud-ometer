# Claud-ometer Setup Notes
> Last updated: 2026-03-28

## What It Is
Local Next.js dashboard that reads `~/.claude/projects` on the Mac and displays
Claude Code token usage, costs, sessions, and project breakdowns.

**Must run on the MacBook** — it reads local filesystem data. Cannot be deployed
to Guppi or any remote server.

---

## How It Runs
Configured as a **launchd agent** — starts automatically on login, runs 24/7
in the background. No terminal needed.

**URL:** `http://localhost:3456`

---

## Files Created

### launchd plist
`~/Library/LaunchAgents/com.anthony.claud-ometer.plist`

Configured with:
- Node path: `/opt/homebrew/bin/node`
- App path: `/Users/anthonygraham/Documents/Apps/Claud-ometer`
- Port: `3456`
- `RunAtLoad: true` — starts on login
- `KeepAlive: true` — restarts if it crashes
- Logs: `/tmp/claud-ometer.log` and `/tmp/claud-ometer.error.log`

---

## Initial Setup Commands (already done — for reference only)

```bash
# 1. Build production app
cd ~/Documents/Apps/Claud-ometer && npm run build

# 2. Load the launchd agent
launchctl load ~/Library/LaunchAgents/com.anthony.claud-ometer.plist

# 3. Verify running (second column should be 0)
launchctl list | grep claud-ometer
```

---

## Useful Commands

```bash
# Check if running
launchctl list | grep claud-ometer

# View logs
tail -f /tmp/claud-ometer.log
tail -f /tmp/claud-ometer.error.log

# Restart
launchctl unload ~/Library/LaunchAgents/com.anthony.claud-ometer.plist
launchctl load ~/Library/LaunchAgents/com.anthony.claud-ometer.plist

# Stop permanently
launchctl unload ~/Library/LaunchAgents/com.anthony.claud-ometer.plist

# Rebuild after code changes
cd ~/Documents/Apps/Claud-ometer && npm run build
launchctl unload ~/Library/LaunchAgents/com.anthony.claud-ometer.plist
launchctl load ~/Library/LaunchAgents/com.anthony.claud-ometer.plist
```

---

## Notes
- Port `3456` chosen to avoid conflicts with local dev servers
- If Node path ever changes, update the plist and reload
- After any code changes, must rebuild (`npm run build`) and reload launchd
- Data source: `~/.claude/projects` — Claude Code session JSONL files
