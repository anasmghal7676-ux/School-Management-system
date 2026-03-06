'use client'
export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div style={{minHeight:'100vh',background:'#0a0f1e',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:'monospace'}}>
      <div style={{background:'#1a1a2e',border:'1px solid #e74c3c',borderRadius:'12px',padding:'32px',maxWidth:'700px',width:'100%'}}>
        <h2 style={{color:'#e74c3c',margin:'0 0 16px',fontSize:'18px'}}>⚠ Page Error — Share this text:</h2>
        <div style={{background:'#0d0d1a',borderRadius:'8px',padding:'16px',marginBottom:'16px'}}>
          <p style={{color:'#ff6b6b',margin:'0 0 8px',fontWeight:'bold',fontSize:'14px'}}>{error?.message || 'Unknown error'}</p>
          <pre style={{color:'#aaa',margin:0,fontSize:'11px',whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{error?.stack?.slice(0,800)}</pre>
          {error?.digest && <p style={{color:'#666',fontSize:'11px',margin:'8px 0 0'}}>Digest: {error.digest}</p>}
        </div>
        <button onClick={reset} style={{background:'#3b82f6',color:'white',border:'none',borderRadius:'8px',padding:'10px 20px',cursor:'pointer',fontSize:'14px'}}>Retry</button>
      </div>
    </div>
  )
}
