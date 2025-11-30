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

{{/*
Fabric Orderer helpers
*/}}
{{- define "fabric-orderer.name" -}}
fabric-orderer
{{- end }}

{{- define "fabric-orderer.fullname" -}}
fabric-orderer
{{- end }}

{{/*
Fabric Peer helpers
*/}}
{{- define "fabric-peer.name" -}}
fabric-peer
{{- end }}

{{- define "fabric-peer.fullname" -}}
fabric-peer
{{- end }}

{{/*
Backend Blockchain helpers
*/}}
{{- define "backend-blockchain.name" -}}
backend-blockchain
{{- end }}

{{- define "backend-blockchain.fullname" -}}
backend-blockchain
{{- end }}