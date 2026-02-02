output "namespace" {
  value = "terraflow-app"
}

output "helm_release_status" {
  value = helm_release.terraflow_app.status
}

output "helm_release_version" {
  value = helm_release.terraflow_app.version
}
