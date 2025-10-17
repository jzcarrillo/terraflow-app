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
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
})

export default function Login() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch('http://localhost:30081/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', result.token)
        localStorage.setItem('user', JSON.stringify(result.user))
        
        setSuccess('Login successful! Redirecting...')
        setTimeout(() => {
          router.push('/land-titles')
        }, 1500)
      } else {
        setError(result.message || 'Login failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Login
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography sx={{ mb: 1, fontWeight: 500 }}>Username:</Typography>
              <input
                type="text"
                {...register('username')}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
              {errors.username && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.username.message}</Typography>}
            </Box>

            <Box>
              <Typography sx={{ mb: 1, fontWeight: 500 }}>Password:</Typography>
              <input
                type="password"
                {...register('password')}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
              {errors.password && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.password.message}</Typography>}
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ mt: 2, py: 1.5 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <Typography align="center" sx={{ mt: 2 }}>
              Don't have an account?{' '}
              <Link href="/register" style={{ color: '#1976d2', textDecoration: 'none' }}>
                Register here
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Container>
  )
}