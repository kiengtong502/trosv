"""Check the default Compose config (no TRUSTED_PROXIES opt-in) from stdin."""

import json
import sys


services = json.load(sys.stdin)["services"]
for name in ("backend", "frontend", "reverb"):
    if not services[name].get("ports"):
        raise AssertionError(f"{name}: local demo port is missing")
for name, service in services.items():
    for port in service.get("ports", []):
        if name == "caddy":
            if int(port["target"]) not in (80, 443):
                raise AssertionError("Caddy may only publish HTTP/HTTPS")
        elif port.get("host_ip") not in ("127.0.0.1", "::1"):
            raise AssertionError(f"{name}: auxiliary port must bind to loopback")
if services["backend"]["environment"].get("TRUSTED_PROXIES") not in (None, ""):
    raise AssertionError("Default backend must not trust forwarded headers")
print("PASS: auxiliary ports bind to loopback; proxy trust is opt-in")
