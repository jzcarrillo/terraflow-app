{{/*
Always return just "backend-landregistry" as the name
*/}}
{{- define "backend-landregistry.name" -}}
backend-landregistry
{{- end }}

{{/*
Always return just "backend-landregistry" as the fullname — no release name prefix
*/}}
{{- define "backend-landregistry.fullname" -}}
backend-landregistry
{{- end }}