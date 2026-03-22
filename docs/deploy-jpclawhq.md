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
- nginx site: `/etc/nginx/sites-available/griffins1884.org.conf`
- nginx include: `/etc/nginx/snippets/frc1884-scouting.locations.conf`
- controller env file: `/etc/frc1884-scouting/controller.env`

## First-time setup

1. Clone `https://github.com/FRC1884/frc1884-scouting.git` to `/srv/frc1884-scouting`
2. Install `deploy/systemd/frc1884-scouting-controller.service` to `/etc/systemd/system/`
3. Install `deploy/nginx/frc1884-scouting.locations.conf` to `/etc/nginx/snippets/`
4. Include that snippet in `/etc/nginx/sites-available/griffins1884.org.conf` before the existing `location /` block
5. Create `/etc/frc1884-scouting/controller.env` with `DATABASE_URL=postgresql://...`
6. Run `./scripts/deploy-jpclawhq.sh`
7. `sudo systemctl enable --now frc1884-scouting-controller.service`

## Future deploys

Run this on `jpclawhq`:

```bash
cd /srv/frc1884-scouting && ./scripts/deploy-jpclawhq.sh
```

## GitHub auto deploy

`main` deploys through GitHub Actions on every push. The workflow SSHes into `jpclawhq` and runs `./scripts/deploy-jpclawhq.sh`.
