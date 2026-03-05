import Link from 'next/link'

export const dynamic = 'force-static'

export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ 
        fontFamily: 'system-ui, sans-serif', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        margin: 0,
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '8rem', fontWeight: 'bold', color: '#3b82f6', margin: 0, lineHeight: 1 }}>404</h1>
          <h2 style={{ fontSize: '1.5rem', color: '#1e293b', marginTop: '1rem' }}>Page Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            The page you are looking for does not exist or has been moved.
          </p>
          <a 
            href="/dashboard" 
            style={{ 
              background: '#3b82f6', 
              color: 'white', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '0.5rem', 
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Go to Dashboard
          </a>
        </div>
      </body>
    </html>
  )
}
