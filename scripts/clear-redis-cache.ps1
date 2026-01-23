# Clear Redis cache script

Write-Host "Clearing Redis cache..." -ForegroundColor Yellow

try {
    # Clear all Redis cache
    kubectl exec -it deployment/redis -n terraflow-app -- redis-cli FLUSHALL
    Write-Host "SUCCESS: Redis cache cleared" -ForegroundColor Green
} catch {
    Write-Host "FAILED: Could not clear Redis cache" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Cache cleared. Next API call will fetch fresh data from database." -ForegroundColor Cyan