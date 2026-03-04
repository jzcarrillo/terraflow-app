# Mortgage Simplification - Option 1 Implementation Guide

## Summary
Remove Interest Rate and Term Years fields, add Details field. Keep Amount for calculations.

## Database Changes

### SQL Migration
```sql
-- Add details column
ALTER TABLE mortgages ADD COLUMN IF NOT EXISTS details TEXT;

-- Make interest_rate and term_years nullable (backward compatibility)
ALTER TABLE mortgages ALTER COLUMN interest_rate DROP NOT NULL;
ALTER TABLE mortgages ALTER COLUMN term_years DROP NOT NULL;
```

Run: `psql -U postgres -d terraflow_db -f /tmp/mortgage_schema_update.sql`

## Backend Changes

### 1. Schema (✅ DONE)
**File**: `backend-landregistry/schemas/mortgages.js`
- Removed: interest_rate, term_years
- Added: details (optional)

### 2. Service (✅ DONE)
**File**: `backend-landregistry/services/mortgage.js`
- Updated INSERT query to use new fields
- Updated allowed fields in updateMortgage: ['amount', 'bank_name', 'details']

## Frontend Changes Needed

### 1. Update Mortgage Form Schema
**File**: `frontend/src/app/mortgages/page.js`

**Line 32-39** - Replace schema:
```javascript
const mortgageSchema = z.object({
  land_title_id: z.string().min(1, "Land title is required"),
  bank_name: z.string().min(1, "Bank name is required"),
  amount: z.string().min(1, "Amount is required"),
  owner_name: z.string().min(1, "Owner name is required"),
  details: z.string().optional()
})
```

### 2. Update Create Form
**Line 350-400** - Replace Interest Rate and Term fields with Details:

**Remove:**
```javascript
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
  <Typography>Interest Rate (%):</Typography>
  <input type="number" {...register('interest_rate')} />
</Box>

<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
  <Typography>Term (Months):</Typography>
  <input type="number" {...register('term_years')} />
</Box>
```

**Add:**
```javascript
<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
  <Typography sx={{ minWidth: 180, mt: 1, fontSize: '16px', fontWeight: 500 }}>Details:</Typography>
  <Box sx={{ flex: 1 }}>
    <textarea 
      rows={4}
      {...register('details')}
      placeholder="Enter mortgage details (interest rate, terms, conditions, etc.)"
      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '4px', backgroundColor: 'white', outline: 'none', resize: 'vertical', color: 'black', fontSize: '16px' }}
    />
    {errors.details && <Typography variant="caption" color="error">{errors.details.message}</Typography>}
  </Box>
</Box>
```

### 3. Update onSubmit Payload
**Line 140-150** - Update payload:
```javascript
const payload = {
  land_title_id: parseInt(data.land_title_id),
  bank_name: data.bank_name,
  amount: parseFloat(data.amount),
  owner_name: data.owner_name,
  details: data.details || null
}
```

### 4. Update Details Dialog
**Line 500-530** - Replace Interest Rate and Term with Details:

**Remove:**
```javascript
<Box>Interest Rate: {selectedMortgage.interest_rate}%</Box>
<Box>Term: {selectedMortgage.term_years} years</Box>
```

**Add:**
```javascript
<Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
  <Typography sx={{ width: 180, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Details:</Typography>
  <Typography sx={{ p: 2, flex: 1, whiteSpace: 'pre-wrap' }}>{selectedMortgage.details || 'No details provided'}</Typography>
</Box>
```

### 5. Update Edit Form
**Line 600-650** - Replace Interest Rate and Term with Details:

**Remove:**
```javascript
<Box>Interest Rate (%): <input {...registerUpdate('interest_rate')} /></Box>
<Box>Term (Months): <input {...registerUpdate('term_years')} /></Box>
```

**Add:**
```javascript
<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
  <Typography sx={{ minWidth: 180, mt: 1, fontSize: '16px', fontWeight: 500 }}>Details:</Typography>
  <Box sx={{ flex: 1 }}>
    <textarea 
      rows={4}
      {...registerUpdate('details')}
      placeholder="Enter mortgage details"
      style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '4px', backgroundColor: 'white', outline: 'none', resize: 'vertical', color: 'black', fontSize: '16px' }}
    />
  </Box>
</Box>
```

### 6. Update onUpdateSubmit Payload
**Line 220-230** - Update payload:
```javascript
const payload = {
  bank_name: data.bank_name,
  amount: parseFloat(data.amount),
  details: data.details || null
}
```

### 7. Update handleUpdateClick
**Line 200-210** - Update resetUpdate:
```javascript
resetUpdate({
  bank_name: mortgage.bank_name,
  amount: mortgage.amount.toString(),
  details: mortgage.details || ''
})
```

## Testing Checklist

- [ ] Run SQL migration
- [ ] Create new mortgage with details field
- [ ] View mortgage details (should show details instead of interest/term)
- [ ] Update mortgage details
- [ ] Verify amount still works for release fee calculation
- [ ] Check blockchain recording still works
- [ ] Verify backward compatibility (old mortgages with interest_rate/term_years)

## Backward Compatibility

Old mortgages will still have interest_rate and term_years values. Frontend should handle both:
- If details exists: show details
- If details is null: show interest_rate and term_years (for old records)

## Benefits

✅ Simpler form (5 fields instead of 7)
✅ Flexible details field
✅ Amount preserved for calculations
✅ Backward compatible
✅ Less validation needed
