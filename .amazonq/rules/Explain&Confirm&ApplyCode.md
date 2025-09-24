# Amazon Q Code Change Rules

## Rule: No Direct Code Changes Without Confirmation

**IMPORTANT:** Do not apply any code changes directly to files without explicit user confirmation.

### Process to Follow:

1. **EXPLAIN FIRST** - Show the proposed changes with before/after code snippets
2. **ADD COMMENTS** - Explain why each change is needed
3. **SHOW SAMPLE RESULTS** - Provide example output/results of running the code to verify alignment with expectations
4. **WAIT FOR CONFIRMATION** - User must explicitly say "apply" or "update" 
5. **THEN APPLY** - Only after user confirms, make the actual file changes
6. **AUTO BUILD** - After applying changes, automatically run: `npm --prefix "C:\terraflow" run build`

### Example Format:
```
## Proposed Changes:

**BEFORE:**
```javascript
// old code here
```

**AFTER:**
```javascript  
// new code here
// Comment: This change fixes XYZ issue
```

**Reason:** Explanation of why this change is needed

**Do you want me to apply these changes? (Yes/No)**
```

### Exceptions:
- Only apply changes immediately if user explicitly requests "update the file now" or similar direct commands
- Always ask for confirmation on security-related changes
- Always ask for confirmation on structural changes

This rule ensures user has full control over their codebase.