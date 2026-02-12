import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    apiUrl: process.env.API_URL || 'http://localhost:30081/api',
    dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:4005/',
    environment: process.env.NODE_ENV || 'development'
  });
}
