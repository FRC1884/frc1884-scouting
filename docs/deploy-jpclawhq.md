# Deploy to jpclawhq

Production remains at https://griffins1884.org/scouting/, with app port 3011
and signed GitHub webhook port 3012. Nginx routing, authentication, TLS,
and GitHub webhook secrets do not change.

## Isolation

The runtime uses nonlogin account frc1884-scouting. The root-owned webhook program
uses frc1884-scouting-webhook and can only write a fixed deployment request.
frc1884-scouting-deploy owns the checkout and builds the fixed main branch without
sudo. Its successful build creates a fixed activation marker. Root-owned
systemd units consume that marker and restart only frc1884-scouting-controller.service.
Root never executes checkout code, npm/yarn lifecycle hooks, or payload fields.

The runtime sees only its own checkout under /srv and its own writable state
under /var/lib. The webhook sees its request directory, not the checkout.
The builder sees its checkout, cache, request directory, and activation directory.
Private /tmp, hidden home directories, zero capabilities, and NoNewPrivileges
apply to all three accounts. All unit files, receiver code, and deployment
entry points are root-owned. Existing secret-provider drop-ins stay in place:
systemd reads the environment files before applying the mount restrictions.
The process cannot open the provider's secret directory itself.

A compromised application can still use its own injected database/API credentials.
The controller database and its schema remain unchanged.

## Migrate an existing installation

These commands are an operator migration, not application code. Review the
candidate checkout first; run its installation commands as Mariano with sudo.
Do not run any repository build script as root. Stop the webhook during the
cutover so it cannot dispatch the old sudo deployment path.

From the reviewed candidate checkout:

```bash
app=frc1884-scouting
sudo systemctl stop "$app-webhook.service"
sudo systemctl stop frc1884-scouting-controller.service

# Stop if any reserved UID/GID already exists; do not reuse retired identities.
for identity in 61040 61041 61042 61046; do
  if getent passwd "$identity" || getent group "$identity"; then
    echo "Reserved identity already exists: $identity" >&2
    exit 1
  fi
done
sudo groupadd --gid 61040 "$app"
sudo groupadd --gid 61041 "$app-webhook"
sudo groupadd --gid 61042 "$app-deploy"
sudo groupadd --gid 61046 "$app-trigger"
sudo useradd --uid 61040 --gid "$app" --no-create-home --home-dir /nonexistent --shell /usr/sbin/nologin "$app"
sudo useradd --uid 61041 --gid "$app-webhook" --no-create-home --home-dir /nonexistent --shell /usr/sbin/nologin "$app-webhook"
sudo useradd --uid 61042 --gid "$app-deploy" --no-create-home --home-dir /nonexistent --shell /usr/sbin/nologin "$app-deploy"
sudo usermod -a -G "$app-trigger" "$app-webhook"
sudo usermod -a -G "$app-trigger" "$app-deploy"

sudo install -d -o root -g "$app-trigger" -m 2770 "/var/lib/$app-request"
sudo install -d -o root -g "$app-deploy" -m 2770 "/var/lib/$app-activate"
# Scouting stores business data in PostgreSQL; no local data move is needed.
sudo chown -hR "$app-deploy:$app-deploy" "/srv/$app"
sudo chmod -R go-w "/srv/$app"
sudo install -d -o root -g root -m 0755 "/usr/local/libexec/$app"
sudo install -o root -g root -m 0644 scripts/github-webhook-server.mjs "/usr/local/libexec/$app/"
sudo install -o root -g root -m 0755 scripts/deploy-jpclawhq.sh "/usr/local/libexec/$app/"
sudo install -o root -g root -m 0644 deploy/systemd/*.service deploy/systemd/*.path /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemd-analyze verify /etc/systemd/system/"$app"*.service /etc/systemd/system/"$app"*.path
sudo systemctl enable --now "$app-activate.path" "$app-deploy.path"
sudo systemctl start frc1884-scouting-controller.service "$app-webhook.service"
```

Account/group creation is a first-time operation; check getent before resuming
an interrupted migration. Existing checkout ownership changes preserve source,
Git state, and build artifacts. Check deployed Git state before migration;
the deployment builder fast-forwards main, preserving unrelated local edits and
refusing changes that conflict with them.
Do not discard local changes to make deployment succeed. Repository origin stays
the existing public HTTPS URL, so no personal SSH or GitHub credentials are needed.

Verify controller.env still sets HOST=127.0.0.1.

Preserve the existing files under /etc/systemd/system/*.service.d, including
zz-1password-environment.conf. Scouting's deploy service receives the same
controller DATABASE_URL through the existing secret-provider unit because Prisma
must synchronize its own schema. It receives no 1Password service token.

After starting, check effective User, Group, NoNewPrivileges, CapabilityBoundingSet,
mount restrictions, and running process UIDs for all three services.
Check the existing public routes, authenticated write routes, and signed webhook
path through nginx. Trigger one real deployment after reviewed changes exist on
main and inspect both the build and activation journals. Verify each runtime
cannot read another app's state, home directories, provider secrets, or an SSH
agent, and cannot write its checkout, unit files, or installed receiver.

## Deploy and diagnose

A valid signed GitHub push for FRC1884/frc1884-scouting, refs/heads/main, creates the
request marker. Multiple pending requests coalesce into one deployment of the
latest main. Payload values are never shell syntax or deployment arguments.

For a manual deploy, use the fixed unit:

```bash
sudo systemctl start frc1884-scouting-deploy.service
sudo journalctl -u frc1884-scouting-deploy.service -u frc1884-scouting-activate.service -n 80 --no-pager
```

The activation path reacts only after a successful build. Deployment builds run
in the existing checkout, so an unsuccessful build can leave partial artifacts;
inspect the build failure before retrying. This migration does not introduce
atomic release directories. No nginx reload is needed for application builds.

Runtime code has no sudo access. Do not add any sudoers rule for these accounts.
Changes to installed units, deployment entry points, or receiver code require
an explicit operator installation from reviewed source.

## Rollback

Stop the webhook and both new path units before reverting. Restore the prior
reviewed runtime and webhook unit files from the previously deployed revision;
keep existing secret-provider drop-ins. Do not install the old receiver as the
new restricted account, because the old receiver requires sudo and executes
mutable repository scripts.

```bash
app=frc1884-scouting
sudo systemctl stop "$app-webhook.service" "$app-deploy.path" "$app-activate.path"
sudo systemctl stop "$app-deploy.service" frc1884-scouting-controller.service
sudo systemctl disable "$app-deploy.path" "$app-activate.path"
# PostgreSQL remains in place.
sudo chown -hR mariano:mariano "/srv/$app"
# From a separate checkout of the prior deployed revision:
sudo install -o root -g root -m 0644 deploy/systemd/frc1884-scouting-controller.service deploy/systemd/frc1884-scouting-webhook.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start frc1884-scouting-controller.service
```

Leave the webhook stopped until an operator explicitly accepts restoring the old
privileged deployment path or repairs the new one. Rollback restores runtime
availability without immediately restoring that risk. Keep the new nonlogin
accounts and installed files until the final disposition is decided; no account
or data deletion is required for rollback.

## Disposable webhook end-to-end check

```bash
node --test tests/github-webhook.e2e.mjs
bash -n scripts/deploy-jpclawhq.sh
git diff --check
```

The scenario starts the real HTTP receiver with a disposable secret and request
directory. It checks HMAC filtering, ignored events/repos/refs, malformed JSON
recovery, a hostile SHA treated as data, pending-request coalescing, and a queue
filesystem failure. It creates no live requests or deployments. Test output
records the scenario result. The root systemd dispatch and filesystem sandbox
also require the post-migration checks above on Linux.
