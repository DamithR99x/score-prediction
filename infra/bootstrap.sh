#!/usr/bin/env bash
# bootstrap.sh — One-time setup: creates Azure resources and configures GitHub secrets
# Usage: ./infra/bootstrap.sh <github-repo> [resource-group] [location]
#   e.g: ./infra/bootstrap.sh DamithR99x/t20-intelligence-console

set -euo pipefail

# ── Arguments ──────────────────────────────────────────────────────────────────
GITHUB_REPO="${1:?Usage: $0 <owner/repo> [resource-group] [location]}"
RESOURCE_GROUP="${2:-rg-t20-webapp}"
LOCATION="${3:-eastasia}"

# ── Prereq checks ──────────────────────────────────────────────────────────────
for cmd in az gh jq; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' is required but not installed." >&2
    exit 1
  fi
done

echo "==> Checking Azure login..."
az account show --query "name" -o tsv || { echo "Run 'az login' first."; exit 1; }

echo "==> Checking GitHub CLI login..."
gh auth status || { echo "Run 'gh auth login' first."; exit 1; }

SUBSCRIPTION_ID=$(az account show --query "id" -o tsv)
TENANT_ID=$(az account show --query "tenantId" -o tsv)

# ── Resource group ─────────────────────────────────────────────────────────────
echo "==> Creating resource group '$RESOURCE_GROUP' in '$LOCATION'..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

# ── Service Principal with Federated Identity (OIDC — no secrets) ─────────────
SP_NAME="sp-t20-webapp-github"
echo "==> Creating service principal '$SP_NAME'..."
SP_JSON=$(az ad app create --display-name "$SP_NAME" --output json)
APP_ID=$(echo "$SP_JSON" | jq -r '.appId')
OBJECT_ID=$(az ad app show --id "$APP_ID" --query "id" -o tsv)

az ad sp create --id "$APP_ID" --output none

echo "==> Assigning Contributor role on resource group..."
az role assignment create \
  --assignee "$APP_ID" \
  --role "Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
  --output none

echo "==> Adding federated credential for GitHub Actions (main branch)..."
az ad app federated-credential create \
  --id "$OBJECT_ID" \
  --parameters "{
    \"name\": \"github-main\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:${GITHUB_REPO}:ref:refs/heads/main\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }" \
  --output none

# ── Set GitHub secrets ─────────────────────────────────────────────────────────
echo "==> Setting GitHub repository secrets..."
gh secret set AZURE_CLIENT_ID       --repo "$GITHUB_REPO" --body "$APP_ID"
gh secret set AZURE_TENANT_ID       --repo "$GITHUB_REPO" --body "$TENANT_ID"
gh secret set AZURE_SUBSCRIPTION_ID --repo "$GITHUB_REPO" --body "$SUBSCRIPTION_ID"
gh secret set AZURE_RESOURCE_GROUP  --repo "$GITHUB_REPO" --body "$RESOURCE_GROUP"

echo ""
echo "✓ Bootstrap complete!"
echo ""
echo "  GitHub repo   : https://github.com/$GITHUB_REPO"
echo "  Resource group: $RESOURCE_GROUP ($LOCATION)"
echo "  Client ID     : $APP_ID"
echo ""
echo "Push to 'main' to trigger your first deployment."
