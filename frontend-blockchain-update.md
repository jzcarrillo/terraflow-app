# Frontend Blockchain History Update

## Changes needed in `/frontend/src/app/land-titles/page.js`:

### 1. Add state (after line 63):
```javascript
const [blockchainHistory, setBlockchainHistory] = useState([])
const [loadingBlockchain, setLoadingBlockchain] = useState(false)
```

### 2. Add fetch function (after line 207):
```javascript
const fetchBlockchainHistory = async (titleNumber) => {
  try {
    setLoadingBlockchain(true)
    const response = await landTitlesAPI.getBlockchainHistory(titleNumber)
    setBlockchainHistory(response.data || response || [])
  } catch (error) {
    console.error('Failed to fetch blockchain history:', error)
    setBlockchainHistory([])
  } finally {
    setLoadingBlockchain(false)
  }
}
```

### 3. Update handleTitleClick (replace lines 208-211):
```javascript
const handleTitleClick = async (title) => {
  setSelectedTitle(title)
  setDetailsOpen(true)
  setBlockchainHistory([]) // Clear previous history
  await fetchBlockchainHistory(title.title_number)
}
```

### 4. Replace blockchain table section (lines 676-738):
```javascript
{/* BLOCKCHAIN TABLE */}
{blockchainHistory.length > 0 && (
  <Box sx={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px' }}>
    <Typography sx={{ width: 220, fontWeight: 'bold', p: 2, borderRight: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>Blockchain:</Typography>
    <Box sx={{ p: 2, flex: 1 }}>
      {loadingBlockchain ? (
        <Typography>Loading blockchain history...</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '2px solid #ccc' }}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid #ccc' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8f9fa', border: '1px solid #999', borderBottom: '1px solid #666' }}>Blockchain Hash</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8f9fa', border: '1px solid #999', borderBottom: '1px solid #666' }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8f9fa', border: '1px solid #999', borderBottom: '1px solid #666' }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8f9fa', border: '1px solid #999', borderBottom: '1px solid #666' }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blockchainHistory.map((tx, index) => (
                <TableRow key={index} sx={{ '&:hover': { backgroundColor: tx.transaction_type === 'CREATED' ? '#f0f8ff' : '#fff8f0' } }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '11px', maxWidth: '200px', wordBreak: 'break-all', border: '1px solid #ccc' }}>
                    {tx.blockchain_hash || tx.hash}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #ccc' }}>
                    <Chip 
                      label={tx.transaction_type || tx.action} 
                      size="small" 
                      color={tx.transaction_type === 'CREATED' ? 'success' : tx.transaction_type === 'TRANSFER' ? 'primary' : 'default'} 
                    />
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #ccc' }}>
                    {formatDate(tx.timestamp || tx.recorded_at || tx.created_at)}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #ccc' }}>
                    {tx.transaction_type === 'TRANSFER' ? (
                      <Box>
                        <Typography variant="caption" display="block">
                          <strong>From:</strong> {tx.from_owner || tx.seller_name}
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>To:</strong> {tx.to_owner || tx.buyer_name}
                        </Typography>
                        {tx.transfer_fee && (
                          <Typography variant="caption" display="block">
                            <strong>Fee:</strong> ₱{tx.transfer_fee}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="caption">
                        {tx.owner_name || 'N/A'}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  </Box>
)}
```

## Summary:
- Fetches blockchain history from API when viewing land title details
- Displays CREATE and TRANSFER transactions
- Shows buyer/seller details for transfers
- Shows transfer fee
- Color-coded chips for different transaction types
