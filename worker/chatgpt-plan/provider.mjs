// Adapted from the owner's SenNote plan worker. TomEng sends only a lesson and transcript.
import { RESOURCE } from "./auth.mjs";
import { isPlanLimitError } from "./policy.mjs";
const CALL_TIMEOUT_MS = 180_000;
export class ProviderAuthError extends Error {
    constructor() { super("PROVIDER_401"); }
}
export class ProviderLimitError extends Error {
    constructor(detail) { super(`PLAN_LIMIT: ${detail.slice(0, 200)}`); }
}
export class ProviderTransientError extends Error {
    constructor(detail) { super(`PROVIDER_ERROR: ${detail.slice(0, 300)}`); }
}
export async function callDeepModel(input) {
    const t0 = Date.now();
    let res;
    try {
        res = await fetch(`${RESOURCE}/responses`, {
            method: "POST",
            headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json", Accept: "text/event-stream" },
            body: JSON.stringify(input.body),
            signal: AbortSignal.timeout(input.timeoutMs ?? CALL_TIMEOUT_MS),
        });
    }
    catch (error) {
        throw new ProviderTransientError(error instanceof Error ? error.message : String(error));
    }
    if (res.status === 401)
        throw new ProviderAuthError();
    if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        if (isPlanLimitError(text) || res.status === 429)
            throw new ProviderLimitError(`${res.status} ${text}`);
        throw new ProviderTransientError(`${res.status} ${text}`);
    }
    let text = "", usage = null, finalStatus = null, failure = null, firstTokenMs = null, buf = "";
    const decoder = new TextDecoder();
    for await (const chunk of res.body) {
        buf += decoder.decode(chunk, { stream: true });
        let i;
        while ((i = buf.indexOf("\n\n")) >= 0) {
            const block = buf.slice(0, i);
            buf = buf.slice(i + 2);
            const data = block.split("\n").filter(l => l.startsWith("data:")).map(l => l.slice(5).trim()).join("");
            if (!data || data === "[DONE]")
                continue;
            let ev;
            try {
                ev = JSON.parse(data);
            }
            catch {
                continue;
            }
            if (ev.type === "response.output_text.delta") {
                if (firstTokenMs === null)
                    firstTokenMs = Date.now() - t0;
                text += ev.delta ?? "";
            }
            else if (ev.type === "response.completed") {
                usage = ev.response?.usage ?? null;
                finalStatus = "completed";
            }
            else if (ev.type === "response.incomplete") {
                usage = ev.response?.usage ?? null;
                finalStatus = "incomplete";
                failure = ev.response?.incomplete_details;
            }
            else if (ev.type === "response.failed" || ev.type === "error") {
                finalStatus = "failed";
                failure = ev.response?.error ?? ev.error ?? ev;
            }
        }
    }
    if (finalStatus !== "completed") {
        const detail = JSON.stringify(failure ?? finalStatus);
        if (isPlanLimitError(detail))
            throw new ProviderLimitError(detail);
        throw new ProviderTransientError(`stream ${finalStatus ?? "ended"} ${detail}`);
    }
    let output;
    try {
        output = JSON.parse(text);
    }
    catch {
        throw new ProviderTransientError("OUTPUT_NOT_JSON");
    }
    return { output, usage, latencyMs: Date.now() - t0, firstTokenMs };
}
