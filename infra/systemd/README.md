# Persistent preview on xisora

Four user services run the backend, Casper worker, production Next.js frontend and
one reverse SSH connection carrying ports 18080 (API) and 18082 (frontend). They use
Restart=always and are enabled under default.target. User linger is enabled.

Frontend worktree: /home/himera/projects/casp_iv_frontend_live (not /tmp).
Backend configuration: contracts/.local/backend.env, excluded from Git.
SSH private key: ~/.ssh/caspian-preview-tunnel, excluded from Git. The VPS public-key
entry is restricted to the two loopback listen ports and disallows shell commands.
The pre-existing homebridge tunnel on 22222 is independent and was not modified.

On this machine:

```bash
systemctl --user status caspian-{backend,worker,frontend,tunnel}
journalctl --user -u caspian-tunnel -u caspian-frontend -n 50
```

After deploying new frontend code: build it, then restart caspian-frontend. For
backend code changes restart caspian-backend and caspian-worker. SSH reconnects
on connection failure; it does not require the old password. These services still
require the computer to be powered on and online. They are not a VPS-native deployment.
