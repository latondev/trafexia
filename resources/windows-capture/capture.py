"""Export completed local-capture HTTP flows to Trafexia over stdout."""
import json
import sys
from mitmproxy import http

PREFIX = "TRAFEXIA_FLOW:"
BODY_LIMIT = 256 * 1024


def running():
    print("TRAFEXIA_READY", flush=True)


def body(message):
    if message is None or message.raw_content is None:
        return None
    try:
        content = message.content
        text = content[:BODY_LIMIT].decode("utf-8", errors="replace")
        if len(content) > BODY_LIMIT:
            text += "\n[Body truncated by Trafexia at 256 KiB]"
        return text
    except (ValueError, OSError):
        return "[Body could not be decoded]"


def export(flow: http.HTTPFlow):
    req, res = flow.request, flow.response
    end = res.timestamp_end if res else None
    end = end or (flow.error.timestamp if flow.error else req.timestamp_end)
    record = {
        "timestamp": round(req.timestamp_start * 1000),
        "method": req.method,
        "url": req.pretty_url,
        "host": req.pretty_host,
        "path": req.path,
        "status": res.status_code if res else 0,
        "requestHeaders": dict(req.headers),
        "requestBody": body(req),
        "responseHeaders": dict(res.headers) if res else {},
        "responseBody": body(res) if res else str(flow.error),
        "contentType": res.headers.get("content-type", "") if res else "",
        "duration": max(0, round(((end or req.timestamp_start) - req.timestamp_start) * 1000)),
        "size": len(res.raw_content or b"") if res else 0,
    }
    sys.stdout.write(PREFIX + json.dumps(record, ensure_ascii=True) + "\n")
    sys.stdout.flush()


def response(flow: http.HTTPFlow):
    export(flow)


def error(flow: http.HTTPFlow):
    export(flow)
