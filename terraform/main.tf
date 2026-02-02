terraform {
  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
  }
}

provider "kubernetes" {
  config_path = pathexpand("~/.kube/config")
}

provider "helm" {
  kubernetes {
    config_path = pathexpand("~/.kube/config")
  }
}

resource "helm_release" "terraflow_app" {
  name       = "terraflow"
  chart      = "../helm"
  namespace  = "terraflow-app"
  wait       = false
  timeout    = 600

  values = [
    file("${path.module}/values-local.yaml")
  ]
}
