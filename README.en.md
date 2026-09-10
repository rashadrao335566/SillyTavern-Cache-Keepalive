# Automatic Cache Keepalive

English | [简体中文](README.md)

Opt-in background refreshes for the active SillyTavern Chat Completion conversation.

## Installation

In SillyTavern 1.18.0 or a compatible build, open **Extensions → Install extension**, paste this repository URL, and reload the page:

`https://github.com/rashadrao335566/SillyTavern-Cache-Keepalive`

The extension code is shared with the [native source branch](https://github.com/rashadrao335566/SillyTavern/tree/feat/automatic-cache-keepalive). No npm installation is required to use it in SillyTavern.

## Use

Open **Extensions → Automatic cache keepalive**, enable the switch, and send a normal chat message. The default interval is **4 minutes**; the supported range is 0.1–1440 minutes. Choose an interval shorter than your provider's cache lifetime.

The extension retains the last actual request in memory, after prompt assembly and request customization. At each deadline, including while the normal reply is still being generated, it sends a copy of that request with one appended user message. The message is sent in Chinese; its English translation is:

> This is only a cache refresh. Please reply with an acknowledgement.

**The interval starts when a request is dispatched, including response generation time.** For example, a normal request sent at 00:00 and completed at 02:00 is first refreshed around 04:00, not 06:00. Subsequent refresh deadlines also use the previous refresh's dispatch time. Refreshes run concurrently with normal generation using independent abort signals. Background refreshes never overlap each other or create catch-up bursts. Normal completion preserves the current refresh deadline, count and error pause. Manual Resume waits one interval from the click.

No refresh message or reply is added to the chat. Draft text is untouched. Returned tool calls are discarded without execution. Tool definitions, tool choice, model, system prompt, history, images, thinking settings, output budget, stream setting, and routing parameters are retained. Only `n` is reduced to one and the refresh instruction is appended.

After **six completed refreshes of an unchanged context**, automatic refreshes pause. **Resume** starts another cycle. A new normal generation replaces the snapshot and starts a new cycle. Errors and requests lasting longer than 180 seconds pause refreshes; there is no automatic error retry loop.

Switching chats, editing history, changing a model/preset/connection, or changing world info invalidates the saved request. Send a normal message again to establish a new snapshot. During generation, the comparison protects the submitted input and settings while excluding the growing output slot, including an existing slot being swiped or continued. History edits and model/connection changes still invalidate the snapshot. After completion, the sent input remains the baseline; new output and background bookkeeping are excluded. Comparison is limited to message inputs, character prompt text, author notes and connection settings, alongside explicit message/card/world-info edit events. Auxiliary quiet requests are excluded. Request bodies are never written to settings or browser storage.

## Cache behavior and limits

- Comparison tracks chat content and source settings, excluding chat-save timestamps and derived prompt-preview scratch data. Previews never replace the captured final request, and parallel quiet requests cannot overwrite a normal chat snapshot.
- Concurrent refreshes can reuse only matching cache entries that already exist. On Claude, a new cache entry becomes available after the first response begins; an earlier parallel request may write a new entry instead of hitting a cache.
- This keeps the **last real request's input prefix** warm. The model's latest reply was output, not part of that cached input, and is not reconstructed or appended to the snapshot. The next normal turn supplies it through SillyTavern's usual prompt construction.
- The request is sent through the same SillyTavern backend and provider. The provider must support prompt caching; its cache configuration, minimum token threshold, routing, and cache-hit rules still apply. A successful refresh is not proof of a cache hit. Check provider usage such as `cache_read_input_tokens` or `cached_tokens`.
- SillyTavern's provider conversion and depth-based cache markers still apply. Appending a user message can affect trailing message grouping or cache breakpoints. Exact preservation is guaranteed for the original **frontend request messages**, not every provider's final wire representation. Cache hits/TTL have not been verified against a paid provider in the automated tests.
- Billing uses the original model and settings. A model may ignore the acknowledgement instruction and consume up to the original output/thinking budget. Lowering that budget can change thinking configuration and invalidate caches, so this extension does not silently lower it.
- Keep the browser tab open. Suspended tabs, sleep, network outages and browser timer throttling can let a cache expire. Resuming a tab makes at most one refresh request, never a backlog of missed requests.
- Snapshots exist only for requests made after enabling this feature. They are dropped on reload. This supports **Chat Completion** connections, not Text Completion/Kobold/NovelAI connections.
- Use either the built-in version or the standalone extension. A shared ownership guard prevents duplicate timers when both are loaded in one page.

Provider reference: [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching).

## Status panel and language

The panel follows SillyTavern's interface language, displaying Chinese or English separately; other languages currently fall back to English. The status, consecutive refresh count, countdown, request snapshot availability, last refresh's cache result and last success time remain visible even with settings collapsed.

A captured request means a replayable snapshot exists, not that the provider reported a cache hit. Cache results come from the last successfully completed refresh: positive read tokens indicate a hit, an explicitly reported zero indicates no hit, and write tokens are shown separately. Missing fields mean unknown; before a refresh completes, the result is not yet checked. This is not a live probe of provider cache availability.

Common Claude, OpenAI-compatible and Gemini cache usage fields are supported, including SSE usage frames. Missing usage never implies a hit or miss. Model and thinking settings are not changed to obtain usage data.

## Updating

Starting with 1.0.3, settings always show the current version, **Check and update**, and **Reload page**. The update action discovers the actual installation folder and reports updated, already current, permission denied or failure. Reload after updating to load the new code. Built-in installations show source-branch update instructions instead of calling the standalone extension updater.

On older versions without these controls, use **Extensions → Manage extensions → Update all**, then reload. SillyTavern's individual update icon is hidden until a successful check finds an update; its absence does not establish that the extension is current. Manually copied installations without Git metadata need to be installed again through the repository URL.

## Implementations

The native version is a built-in extension with a read-only `CHAT_COMPLETION_REQUEST_READY` event emitted immediately before transport. Its event payload contains `{ type, body }`, where `body` is the serialized final request. The standalone version uses the same code and a narrowly scoped `fetch` observer on stock builds without that event.

## Validation

For development, run `npm ci`, `npm run lint`, `npm test`, and `npm run test:e2e`. Install a Playwright browser with `npx playwright install chromium`, or set `PLAYWRIGHT_CHANNEL=chrome` to use installed Chrome. The browser tests use mocked model responses and cover both the native event and stock fetch observer, including both generation event orders, full-prefix equality, six-refresh pause, manual resume, custom intervals, chat switching, earlier-message edits, quiet request exclusion and disposal.

### Cache timing test

Enable **Test: start timer after reply finishes** to count the existing interval (normally 4 minutes) from normal reply completion. Subsequent refreshes also count from completion. The default remains request-dispatch timing. Switching modes requires a new normal request; Resume in test mode also waits for one. This deliberately delays refreshes to investigate cache lifetime; a hit alone does not establish the provider’s TTL or its starting point.
