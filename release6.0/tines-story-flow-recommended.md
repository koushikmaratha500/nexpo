# Recommended Tines Story flow (WhatsApp)

> Compare with your current 4 steps and adjust order.

---

## Your current flow

```text
1. Webhook (OpenWA)
2. HTTP → /api/webhooks/tines-bridge
3. AI Agent (parse)
4. HTTP → OpenWA send-text
```

## Verdict: **partially correct** — order and missing steps need changes

| Step | OK? | Issue |
|------|-----|-------|
| Webhook | ✅ | Correct entry point |
| tines-bridge early | ⚠️ | OK for logging; should also **resolve user** or call dedicated lookup API |
| AI before auth | ❌ | Must check **linked user** before AI + Command API |
| send-text only | ⚠️ | Missing **Command API** call between AI and reply for CREATE_* intents |
| No Command API | ❌ | **Not implemented in Nexpo yet** — cannot save transactions |

---

## Recommended flow (target)

```text
1. Webhook          ← OpenWA message.received
2. HTTP Lookup      ← POST /api/internal/bot/resolve-user (TO BUILD)
       ├─ not linked → send-text (link URL) → END
       └─ linked → continue
3. AI Agent         ← parse message (only if linked OR help intent)
4. HTTP Command     ← POST /api/internal/bot/command (TO BUILD)
5. HTTP send-text   ← format success/error for WhatsApp
```

Optional parallel: step 2 can also POST to `tines-bridge` for audit logging.

---

## Minimal POC flow (today, without Command API)

```text
1. Webhook
2. AI Agent (parse only — dev/testing)
3. send-text with JSON summary: "Parsed: ₹500 Food Lunch (not saved yet)"
```

Use this to validate AI prompts before Nexpo Phase 1 is done.

---

## APIs that exist vs missing

| Endpoint | Status |
|----------|--------|
| `POST /api/webhooks/tines-bridge` | ✅ Logs only |
| `POST /api/webhooks/openwa` | ✅ HMAC direct from OpenWA |
| `POST /api/internal/bot/command` | ❌ **Not built** |
| `POST /api/internal/bot/resolve-user` | ❌ **Not built** |
| `GET/POST bot link web UI` | ❌ **Not built** |
| `ChannelAccount` table | ❌ Schema draft only |

---

## Next implementation order (Nexpo)

1. **Phase 1** — Command API + `BotCommandEngine` + tests
2. **Phase 4** — `ChannelAccount` + link token + settings page
3. **Phase 1b** — `POST /api/internal/bot/resolve-user` for Tines lookup
4. **Tines** — Reorder Story per diagram above
5. **Phase 2** — Events back to Tines for alerts
