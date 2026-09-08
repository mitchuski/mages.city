# Mages City κ space

The City is the community home; UOR kappa-registry is a separate stateful service. Target hostname: `kappa.mages.city`. This deployment package is not active DNS or a running service. The existing apex is static Workers assets and cannot run this Rust server itself.

## Install on the existing always-on host

Build the pinned UOR-Foundation/kappa-registry revision 2af8656 on the target Linux host using `cargo build --release -p kappa-server`. Install the resulting binary at `/opt/mages-kappa/kappa-server`. Keep its upstream attribution and source revision with the binary. Create the dedicated unprivileged mages-kappa service account. Install the adjacent systemd unit and a mode-0600 `/etc/mages/kappa.env`, readable by the service setup. Configure KAPPA_AUTH_TOKENS via its supported @file syntax and provision scoped capability edges through the upstream administration flow. Never give browser clients the root token.

The unit binds only 127.0.0.1:5099, requires authentication, limits blobs to1 MiB, and persists database, blobs and signing keys under /var/lib/mages-kappa. Back up this whole directory; losing the signing key loses the node identity. Do not run upstream service.sh on port5000, which collides with the master preview.

Before opening the tunnel: check anonymous reads/writes are denied, provision a test namespace, run Star's register CLI on a synthetic reading, verify read-back and restart persistence, then check expired/revoked and wrong-namespace grants. A namespace path alone is not confidentiality. The content layer is not VTA admission or a portable signed credential.

Add an exact kappa.mages.city ingress to cloudflared BEFORE the wildcard farm rule, pointing to http://127.0.0.1:5099, and its DNS record only after the service checks pass. Do not alter the FirstPerson farm CNAMEs. No tunnel or DNS change is made by this package.

Star producer/adapter: mitchuski/star-key scripts/star-registry.mjs. Configure STAR_REGISTRY_URL and STAR_REGISTRY_NAMESPACE through the operator runtime, not from imported documents. A checked-in service descriptor remains disabled until the live endpoint is tested. Start with a test namespace; production namespace policy and VTA signing integration require their own receipts and tests.
