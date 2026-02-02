# TerraFlow Terraform Deployment

## Prerequisites
- Docker Desktop with Kubernetes enabled
- kubectl configured

## Setup

1. **Install Terraform**
   ```bash
   # Install Homebrew first if not installed
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Install Terraform
   brew tap hashicorp/tap
   brew install hashicorp/tap/terraform
   
   # Verify installation
   terraform version
   ```

2. **Enable Kubernetes in Docker Desktop**
   - Open Docker Desktop
   - Go to Settings → Kubernetes
   - Check "Enable Kubernetes"
   - Click "Apply & Restart"

3. **Build Docker Images FIRST**
   ```bash
   cd ..
   ./deploy-build.sh
   ```

4. **Initialize Terraform**
   ```bash
   cd terraform
   terraform init
   ```

5. **Deploy with Terraform**
   ```bash
   terraform plan
   terraform apply
   ```

6. **Verify**
   ```bash
   kubectl get pods -n terraflow-app
   kubectl get svc -n terraflow-app
   ```

## Destroy
```bash
terraform destroy
```
