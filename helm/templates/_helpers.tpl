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

{{/*
Always return just "backend-documents" as the name
*/}}
{{- define "backend-documents.name" -}}
backend-documents
{{- end }}

{{/*
Always return just "backend-documents" as the fullname — no release name prefix
*/}}
{{- define "backend-documents.fullname" -}}
backend-documents
{{- end }}

{{/*
Always return just "api-gateway" as the name
*/}}
{{- define "api-gateway.name" -}}
api-gateway
{{- end }}

{{/*
Always return just "api-gateway" as the fullname — no release name prefix
*/}}
{{- define "api-gateway.fullname" -}}
api-gateway
{{- end }}