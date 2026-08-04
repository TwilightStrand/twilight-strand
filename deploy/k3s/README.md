# K3s Deployment

## Prerequisites

- k3s cluster with Traefik ingress
- cert-manager for TLS (optional)
- GHCR image pull secret

## Setup

```bash
# 1. Create namespace
kubectl apply -f namespace.yml

# 2. Create GHCR pull secret
kubectl create secret docker-registry ghcr-secret \
  --namespace=twilight-strand \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USER \
  --docker-password=YOUR_GITHUB_PAT

# 3. Create secrets (copy example, fill values)
cp secrets.yml.example secrets.yml
# Edit secrets.yml with real values
kubectl apply -f secrets.yml

# 4. Deploy Postgres
kubectl apply -f postgres.yml

# 5. Run database migrations
kubectl exec -n twilight-strand deploy/twilight-strand -- \
  npx drizzle-kit push

# 6. Deploy app
kubectl apply -f app.yml
```

## Update

Push to `main` branch. GH Actions builds and pushes to GHCR. Then:

```bash
kubectl rollout restart deploy/twilight-strand -n twilight-strand
```

Or set up a webhook/ArgoCD for auto-deploy.

## Without auth/database

Skip steps 2-5. The app works fully without Postgres - auth routes return 503 gracefully, builds save to localStorage.

```bash
kubectl apply -f namespace.yml
kubectl apply -f app.yml  # remove envFrom/secretRef lines
```
