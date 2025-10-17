'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  ThemeProvider,
  CssBaseline
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Description as LandTitleIcon,
  Payment as PaymentIcon,
  Folder as DocumentIcon,
  People as UsersIcon,
  Logout as LogoutIcon
} from '@mui/icons-material'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import theme from '../app/theme'

const drawerWidth = 240

const menuItems = [
  {
    text: 'Dashboard',
    icon: <HomeIcon />,
    href: '/',
    roles: ['ADMIN', 'CASHIER', 'LAND_TITLE_PROCESSOR']
  },
  {
    text: 'Land Titles',
    icon: <LandTitleIcon />,
    href: '/land-titles',
    roles: ['ADMIN','LAND_TITLE_PROCESSOR']
  },
  {
    text: 'Payments',
    icon: <PaymentIcon />,
    href: '/payments',
    roles: ['ADMIN', 'CASHIER']
  },
  {
    text: 'Documents',
    icon: <DocumentIcon />,
    href: '/documents',
    roles: ['ADMIN', 'CASHIER', 'LAND_TITLE_PROCESSOR']
  },
  {
    text: 'Users',
    icon: <UsersIcon />,
    href: '/users',
    roles: ['ADMIN']
  }
]

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user')
      if (user) {
        setCurrentUser(JSON.parse(user))
      }
    }
  }, [])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Terraflow-app
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Link href={item.href} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
              <ListItemButton selected={pathname === item.href}>
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
    </div>
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Land Registration System
            </Typography>
            {currentUser && (
              <Typography variant="body1" sx={{ mr: 2 }}>
                Welcome, {currentUser.first_name || currentUser.username}
              </Typography>
            )}
            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{ ml: 2 }}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>
        
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
          }}
        >
          <Toolbar />
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  )
}