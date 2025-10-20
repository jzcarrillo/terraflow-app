'use client'

import { useState } from 'react'
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  Paper
} from '@mui/material'
import Link from 'next/link'
import { authAPI } from '../../services/api'

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await authAPI.login(credentials)
      
      if (result.ok) {
        console.log('✅ Login successful:', result.data.user)
        
        // Get user role from token
        const token = result.data.token
        const payload = JSON.parse(atob(token.split('.')[1]))
        const userRole = payload.role
        
        // Redirect based on role
        if (userRole === 'CASHIER') {
          window.location.href = '/payments'
        } else if (userRole === 'LAND_TITLE_PROCESSOR') {
          window.location.href = '/land-titles'
        } else {
          window.location.href = 'http://localhost:4005/'
        }
      } else {
        setError(result.error?.error || 'Login failed')
      }
    } catch (error) {
      setError('Login service unavailable')
    } finally {
      setLoading(false)
    }
  }

  const handleBypass = () => {
    if (typeof window !== 'undefined' && window.bypassAuth) {
      window.bypassAuth()
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Login
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography sx={{ mb: 1, fontWeight: 500 }}>Username:</Typography>
              <input
                type="text"
                required
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ mb: 1, fontWeight: 500 }}>Password:</Typography>
              <input
                type="password"
                required
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ mt: 2, py: 1.5 }}
            >
              {loading ? 'Signing in...' : 'Login'}
            </Button>

            <Typography align="center" sx={{ mt: 2 }}>
              Don't have an account?{' '}
              <Link href="/register" style={{ color: '#1976d2', textDecoration: 'none' }}>
                Register here
              </Link>
            </Typography>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Test Credentials: jzcarrillo / [your password]
              </Typography>
              
              <Button
                variant="outlined"
                size="small"
                onClick={handleBypass}
                sx={{ fontSize: '0.75rem' }}
              >
                DEV: Bypass Login
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  )
}