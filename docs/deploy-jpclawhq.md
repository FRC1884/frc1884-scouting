# Deploy To jpclawhq

Production host: `jpclawhq` (`46.225.177.225`)

Domain path:

- `https://griffins1884.org/scouting`

App runtime:

- GitHub repo: `https://github.com/FRC1884/frc1884-scouting.git`
- repo path: `/srv/frc1884-scouting`
- deploy branch: `main`
- controller port: `3011`
- controller service: `frc1884-scouting-controller.service`
- webhook port: `3012`
- webhook service: `frc1884-scouting-webhook.service`
- nginx site: `/etc/nginx/sites-available/griffins1884.org.conf`
- nginx include: `/etc/nginx/snippets/frc1884-scouting.locations.conf`
- controller env file: `/etc/frc1884-scouting/controller.env`
- webhook env file: `/etc/frc1884-scouting/webhook.env`

## First-time setup

1. Clone `https://github.com/FRC1884/frc1884-scouting.git` to `/srv/frc1884-scouting`
2. Install `deploy/systemd/frc1884-scouting-controller.service` to `/etc/systemd/system/`
3. Install `deploy/systemd/frc1884-scouting-webhook.service` to `/etc/systemd/system/`
4. Install `deploy/nginx/frc1884-scouting.locations.conf` to `/etc/nginx/snippets/`
5. Include that snippet in `/etc/nginx/sites-available/griffins1884.org.conf` before the existing `location /` block
6. Create `/etc/frc1884-scouting/controller.env` with `DATABASE_URL=postgresql://...`
7. Create `/etc/frc1884-scouting/webhook.env` with `GITHUB_WEBHOOK_SECRET=...`
8. Run `./scripts/deploy-jpclawhq.sh`
9. `sudo systemctl enable --now frc1884-scouting-controller.service frc1884-scouting-webhook.service`

## Future deploys

Run this on `jpclawhq`:

```bash
cd /srv/frc1884-scouting && ./scripts/deploy-jpclawhq.sh
```

## GitHub auto deploy

Configure a repository webhook for:

- URL: `https://griffins1884.org/github-webhook/frc1884-scouting`
- content type: `application/json`
- secret: the same value stored in `/etc/frc1884-scouting/webhook.env`
- event: `push`

GitHub documents repository webhook setup, `push` event payloads, and HMAC signature validation here:

- https://docs.github.com/webhooks/creating
- https://docs.github.com/webhooks/event-payloads#push
- https://docs.github.com/en/enterprise-server%403.15/webhooks/using-webhooks/validating-webhook-deliveries
