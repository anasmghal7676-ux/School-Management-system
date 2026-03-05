'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [mounted, setMounted]   = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !username.trim() || !password) return;
    setError(''); setLoading(true);
    try {
      const result = await signIn('credentials', { username: username.trim(), password, redirect: false, callbackUrl });
      if (result?.error) {
        const next = attempts + 1; setAttempts(next);
        setError(next >= 5 ? 'Account locked. Wait 30 minutes or contact administrator.' : `Invalid credentials. ${5 - next} attempt${5 - next === 1 ? '' : 's'} remaining.`);
        setLoading(false);
      } else if (result?.ok) { await getSession(); router.replace(callbackUrl); router.refresh(); }
      else { setError('Unexpected error. Please try again.'); setLoading(false); }
    } catch { setError('Network error. Check your connection.'); setLoading(false); }
  };

  if (!mounted) return null;

  const btn = {
    base: { marginTop:'8px', padding:'13px 16px', borderRadius:'12px', border:'none', color:'white', fontWeight:'600', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.2s', width:'100%' },
    active: { background:'linear-gradient(135deg,#1d4ed8,#4f46e5)', cursor:'pointer', boxShadow:'0 0 30px rgba(59,130,246,0.3)' },
    disabled: { background:'rgba(59,130,246,0.2)', cursor:'not-allowed', opacity:0.5 },
  };
  const inputStyle = { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'white', borderRadius:'12px', paddingTop:'12px', paddingBottom:'12px', paddingRight:'16px', fontSize:'14px', outline:'none', boxSizing:'border-box' as const };

  return (
    <div style={{minHeight:'100vh', background:'#0a0f1e', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', position:'relative', overflow:'hidden', fontFamily:'system-ui,-apple-system,BlinkMacSystemFont,sans-serif'}}>
      <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
        <div style={{position:'absolute',top:'-20%',right:'-10%',width:'600px',height:'600px',borderRadius:'50%',background:'rgba(37,99,235,0.08)',filter:'blur(120px)'}} />
        <div style={{position:'absolute',bottom:'-20%',left:'-10%',width:'500px',height:'500px',borderRadius:'50%',background:'rgba(79,70,229,0.08)',filter:'blur(120px)'}} />
      </div>
      <div style={{position:'relative',width:'100%',maxWidth:'420px'}}>
        <div style={{display:'flex',justifyContent:'center',marginBottom:'24px'}}>
          <span style={{display:'flex',alignItems:'center',gap:'8px',background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:'9999px',padding:'6px 16px',color:'#60a5fa',fontSize:'12px',fontWeight:'500',letterSpacing:'0.05em'}}>
            <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
            Secure Administrator Portal
          </span>
        </div>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'64px',height:'64px',borderRadius:'16px',background:'linear-gradient(135deg,#1d4ed8,#4f46e5)',boxShadow:'0 20px 40px rgba(59,130,246,0.25)',marginBottom:'16px'}}>
            <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          </div>
          <h1 style={{fontSize:'24px',fontWeight:'700',color:'white',margin:'0 0 4px'}}>School Management System</h1>
          <p style={{color:'#64748b',fontSize:'14px',margin:0}}>Administrator access portal</p>
        </div>
        <div style={{background:'rgba(255,255,255,0.04)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'24px',padding:'32px',boxShadow:'0 25px 50px rgba(0,0,0,0.5)'}}>
          <h2 style={{fontSize:'18px',fontWeight:'600',color:'white',margin:'0 0 4px'}}>Welcome back</h2>
          <p style={{color:'#475569',fontSize:'14px',margin:'0 0 24px'}}>Sign in with your authorized credentials</p>
          {error && (
            <div style={{display:'flex',alignItems:'flex-start',gap:'12px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'12px',padding:'14px',marginBottom:'20px'}}>
              <svg width="16" height="16" fill="#f87171" viewBox="0 0 20 20" style={{flexShrink:0,marginTop:'2px'}}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              <p style={{color:'#fca5a5',fontSize:'14px',margin:0,lineHeight:'1.5'}}>{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} autoComplete="on" noValidate style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div>
              <label style={{display:'block',fontSize:'11px',fontWeight:'500',color:'#64748b',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'8px'}}>Username or Email</label>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><svg width="16" height="16" fill="none" stroke="#475569" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></span>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" autoFocus required disabled={loading} placeholder="Enter username or email"
                  style={{...inputStyle, paddingLeft:'42px', opacity:loading?0.4:1}}
                  onFocus={e=>{e.target.style.borderColor='rgba(59,130,246,0.5)';e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.08)';e.target.style.boxShadow='none'}}/>
              </div>
            </div>
            <div>
              <label style={{display:'block',fontSize:'11px',fontWeight:'500',color:'#64748b',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'8px'}}>Password</label>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><svg width="16" height="16" fill="none" stroke="#475569" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></span>
                <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required disabled={loading} placeholder="Enter your password"
                  style={{...inputStyle, paddingLeft:'42px', paddingRight:'48px', opacity:loading?0.4:1}}
                  onFocus={e=>{e.target.style.borderColor='rgba(59,130,246,0.5)';e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.08)';e.target.style.boxShadow='none'}}/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} tabIndex={-1} style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#475569',padding:'4px',display:'flex',alignItems:'center'}}>
                  {showPw
                    ?<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    :<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  }
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading||!username.trim()||!password}
              style={{...btn.base, ...(loading||!username.trim()||!password ? btn.disabled : btn.active)}}>
              {loading
                ?<><svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{animation:'spin 1s linear infinite'}}><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="4"/><path fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Authenticating...</>
                :<><svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>Sign In Securely</>
              }
            </button>
          </form>
          <div style={{marginTop:'24px',paddingTop:'20px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'center',gap:'24px',flexWrap:'wrap'}}>
            {['256-bit TLS','bcrypt hashed','JWT sessions','Auto-lockout'].map(l=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#34d399'}} />
                <span style={{color:'#475569',fontSize:'12px'}}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{textAlign:'center',color:'#1e293b',fontSize:'12px',marginTop:'24px'}}>
          © {new Date().getFullYear()} School Management System · Authorized access only
        </p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}input[type=text],input[type=password]{color-scheme:dark;}input::placeholder{color:#334155!important;}`}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#0a0f1e',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:'32px',height:'32px',border:'2px solid rgba(59,130,246,0.3)',borderTopColor:'#3b82f6',borderRadius:'50%',animation:'spin 1s linear infinite'}}/><style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style></div>}>
      <LoginForm />
    </Suspense>
  );
}
