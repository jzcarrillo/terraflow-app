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
import AlertMessage from '@/components/common/AlertMessage'
import { API_CONFIG } from '@/utils/config'

const registerSchema = z.object({
  email: z.string().email("Valid email address is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  location: z.string().min(1, "Location is required"),
  role: z.string().min(1, "Role is required")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export default function Register() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_address: data.email,
          username: data.username,
          password: data.password,
          confirm_password: data.confirmPassword,
          first_name: data.firstName,
          last_name: data.lastName,
          location: data.location,
          role: data.role
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setSuccess('Registration successful! Redirecting to login...')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        if (response.status === 409) {
          setError(result.message || 'Email address or username already exists')
        } else {
          setError(result.message || 'Registration failed')
        }
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
          Register
        </Typography>
        
        <AlertMessage error={error} success={success} />
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography sx={{ mb: 1, fontWeight: 500 }}>Email Address:</Typography>
              <input
                type="email"
                {...register('email')}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
              {errors.email && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.email.message}</Typography>}
            </Box>

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

            <Box>
              <Typography sx={{ mb: 1, fontWeight: 500 }}>Confirm Password:</Typography>
              <input
                type="password"
                {...register('confirmPassword')}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
              {errors.confirmPassword && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.confirmPassword.message}</Typography>}
            </Box>

            <Box>
              <Typography sx={{ mb: 1, fontWeight: 500 }}>First Name:</Typography>
              <input
                type="text"
                {...register('firstName')}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
              {errors.firstName && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.firstName.message}</Typography>}
            </Box>

            <Box>
              <Typography sx={{ mb: 1, fontWeight: 500 }}>Last Name:</Typography>
              <input
                type="text"
                {...register('lastName')}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
              {errors.lastName && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.lastName.message}</Typography>}
            </Box>

            <Box>
              <Typography sx={{ mb: 1, fontWeight: 500 }}>Location:</Typography>
              <select
                {...register('location')}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              >
                <option value="">Select Location</option>
                <option value="Caloocan">Caloocan</option>
                <option value="Las Piñas">Las Piñas</option>
                <option value="Makati">Makati</option>
                <option value="Malabon">Malabon</option>
                <option value="Mandaluyong">Mandaluyong</option>
                <option value="Manila">Manila</option>
                <option value="Marikina">Marikina</option>
                <option value="Muntinlupa">Muntinlupa</option>
                <option value="Navotas">Navotas</option>
                <option value="Parañaque">Parañaque</option>
                <option value="Pasay">Pasay</option>
                <option value="Pasig">Pasig</option>
                <option value="Pateros">Pateros</option>
                <option value="Quezon City">Quezon City</option>
                <option value="San Juan">San Juan</option>
                <option value="Taguig">Taguig</option>
                <option value="Valenzuela">Valenzuela</option>
              </select>
              {errors.location && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.location.message}</Typography>}
            </Box>

            <Box>
              <Typography sx={{ mb: 1, fontWeight: 500 }}>Role:</Typography>
              <select
                {...register('role')}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              >
                <option value="">Select Role</option>
                <option value="LAND_TITLE_PROCESSOR">Land Title Processor</option>
                <option value="CASHIER">Cashier</option>
                <option value="ADMIN">Admin</option>
              </select>
              {errors.role && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{errors.role.message}</Typography>}
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ mt: 2, py: 1.5 }}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>

            <Typography align="center" sx={{ mt: 2 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
                Login here
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Container>
  )
}