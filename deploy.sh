#!/bin/bash

# ========================================
# LMS-Inspira Azure Deployment Script
# Deploys both API (server) and Web (client)
# ========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="rg-innovation-inspirateknologi"
API_APP_NAME="lms-inspira-api"
WEB_APP_NAME="lms-inspira-web"
API_ZIP="api-deploy.zip"
WEB_ZIP="web-deploy.zip"

# Functions
write_success() { echo -e "${GREEN}✓ $1${NC}"; }
write_info() { echo -e "${CYAN}$1${NC}"; }
write_error() { echo -e "${RED}✗ $1${NC}"; }

write_info "======================================"
write_info "LMS-Inspira Azure Deployment"
write_info "======================================"

# ========== STEP 1: BUILD CLIENT ==========
write_info "\n[1/5] Building Client (Vite)..."
cd client
write_info "Installing client dependencies..."
npm install

write_info "Running Vite build..."
npm run build
cd ..
write_success "Client built successfully"

# ========== STEP 2: COPY CLIENT TO DEPLOY FOLDER ==========
write_info "\n[2/5] Copying client build to deployment folder..."
rm -rf client-deploy-min/dist
cp -r client/dist client-deploy-min/dist
write_success "Client files copied"

# ========== STEP 3: COPY SERVER SOURCE TO DEPLOY FOLDER ==========
write_info "\n[3/5] Copying server source to deployment folder..."
rm -rf server-deploy-min/src
cp -r server/src server-deploy-min/src

# Copy node_modules if exists
write_success "Server files copied"

# ========== STEP 4: DEPLOY TO API ==========
write_info "\n[4/5] Deploying API to Azure ($API_APP_NAME)..."
write_info "Creating API deployment package..."
rm -f "$API_ZIP"
cd server-deploy-min
zip -r ../"$API_ZIP" . -q
cd ..

write_info "Uploading API to Azure..."
az webapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "$API_APP_NAME" \
    --src "$API_ZIP"

write_success "API deployed successfully"
rm -f "$API_ZIP"

# ========== STEP 5: DEPLOY TO WEB ==========
write_info "\n[5/5] Deploying Web to Azure ($WEB_APP_NAME)..."
write_info "Creating Web deployment package..."
rm -f "$WEB_ZIP"
cd client-deploy-min
zip -r ../"$WEB_ZIP" . -q
cd ..

write_info "Uploading Web to Azure..."
az webapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "$WEB_APP_NAME" \
    --src "$WEB_ZIP"

write_success "Web deployed successfully"
rm -f "$WEB_ZIP"

# ========== SUCCESS ==========
write_success "\n======================================"
write_success "Deployment completed successfully!"
write_success "======================================"
write_info "\nYour apps are now live at:"
write_info "  API:  https://$API_APP_NAME.azurewebsites.net"
write_info "  Web:  https://$WEB_APP_NAME.azurewebsites.net"
write_info "\nNote: It may take a few minutes for the changes to be live."
