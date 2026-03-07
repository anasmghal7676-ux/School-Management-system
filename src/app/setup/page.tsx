'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container, Title, Text, TextInput, Textarea, Select, Group,
  Button, Card, Stack, Grid, Box, ThemeIcon, Paper, NumberInput,
  Badge, SimpleGrid, Alert, PasswordInput, Progress, Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconSchool, IconUser, IconCheck, IconBuilding, IconPhone,
  IconMail, IconMapPin, IconCalendar, IconAlertCircle,
  IconArrowRight, IconArrowLeft, IconShieldCheck, IconRocket,
  IconLock,
} from '@tabler/icons-react';

/* ─── animations ──────────────────────────────────────────── */
const CSS = `
  @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideInR { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
  @keyframes slideInL { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:translateX(0)} }
  @keyframes floatY   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes checkPop { 0%{transform:scale(0) rotate(-20deg);opacity:0} 70%{transform:scale(1.2);opacity:1} 100%{transform:scale(1);opacity:1} }
  @keyframes spinFade { 0%{opacity:0;transform:rotate(-10deg) scale(0.9)} 100%{opacity:1;transform:rotate(0) scale(1)} }
  @keyframes fieldIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  .logo-anim   { animation: floatY 3s ease-in-out infinite; }
  .card-anim   { animation: fadeUp 0.45s cubic-bezier(.4,0,.2,1) forwards; }
  .slide-right { animation: slideInR 0.3s cubic-bezier(.4,0,.2,1) forwards; }
  .slide-left  { animation: slideInL 0.3s cubic-bezier(.4,0,.2,1) forwards; }
  .check-anim  { animation: checkPop 0.5s cubic-bezier(.4,0,.2,1) forwards; }
  .shimmer-btn {
    background: linear-gradient(90deg,#2563eb,#7c3aed,#2563eb,#7c3aed);
    background-size: 300% auto;
    animation: shimmer 2.5s linear infinite;
    border: none !important;
    font-weight: 700 !important;
  }
  .green-btn {
    background: linear-gradient(135deg,#059669,#10b981) !important;
    border: none !important;
    font-weight: 700 !important;
    box-shadow: 0 4px 20px rgba(16,185,129,.4) !important;
  }

  /* dark glass inputs */
  .si input, .si textarea {
    background: rgba(255,255,255,.08) !important;
    border: 1px solid rgba(255,255,255,.18) !important;
    color: #fff !important;
    transition: all .2s ease !important;
  }
  .si input::placeholder, .si textarea::placeholder { color:rgba(255,255,255,.35)!important; }
  .si input:focus, .si textarea:focus {
    background: rgba(255,255,255,.12) !important;
    border-color: #60a5fa !important;
    box-shadow: 0 0 0 2px rgba(96,165,250,.2) !important;
  }
  .si button { /* select trigger */
    background: rgba(255,255,255,.08) !important;
    border: 1px solid rgba(255,255,255,.18) !important;
    color: #fff !important;
  }

  .field { animation: fieldIn .3s ease forwards; opacity: 0; }
  .step-dot { transition: all .3s cubic-bezier(.4,0,.2,1); }
  .step-conn { transition: background .5s ease; }
`;

const BOARDS = [
  {value:'fbise',label:'FBISE (Federal Board)'},{value:'bise_lahore',label:'BISE Lahore'},
  {value:'bise_karachi',label:'BISE Karachi'},{value:'bise_peshawar',label:'BISE Peshawar'},
  {value:'bise_quetta',label:'BISE Quetta'},{value:'cambridge',label:'Cambridge (O/A Level)'},
  {value:'aga_khan',label:'Aga Khan Board'},{value:'other',label:'Other / Private'},
];
const MONTHS = [
  {value:'1',label:'January'},{value:'2',label:'February'},{value:'3',label:'March'},
  {value:'4',label:'April'},{value:'5',label:'May'},{value:'6',label:'June'},
  {value:'7',label:'July'},{value:'8',label:'August'},{value:'9',label:'September'},
  {value:'10',label:'October'},{value:'11',label:'November'},{value:'12',label:'December'},
];
const CLASSES = ['Nursery','KG','1','2','3','4','5','6','7','8','9','10'];
const STEPS = [
  {label:'School Info',   icon:IconBuilding,    color:'#60a5fa'},
  {label:'Admin Account', icon:IconShieldCheck, color:'#a78bfa'},
  {label:'Academics',     icon:IconCalendar,    color:'#34d399'},
  {label:'Done!',         icon:IconRocket,      color:'#fbbf24'},
];

const IL = { label:{color:'rgba(255,255,255,.75)',fontWeight:500,fontSize:'.875rem',marginBottom:4}, error:{color:'#f87171'} };

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep]   = useState(0);
  const [dir,  setDir]    = useState<'right'|'left'>('right');
  const [busy, setBusy]   = useState(false);
  const [init, setInit]   = useState(true);

  useEffect(() => {
    fetch('/api/setup').then(r=>r.json()).then(d => {
      if (!d.setupRequired) router.replace('/auth/login');
      else setInit(false);
    }).catch(() => setInit(false));
  }, [router]);

  const form = useForm({
    initialValues: {
      schoolName:'', schoolCode:'', address:'', city:'', province:'',
      phone:'', email:'', website:'', board:'fbise',
      establishedYear: new Date().getFullYear(),
      adminName:'', adminEmail:'', adminUsername:'admin', adminPassword:'',
      academicYearStart:'4',
      currentYear:`${new Date().getFullYear()}-${new Date().getFullYear()+1}`,
      sectionsPerClass:'2', classes: CLASSES,
    },
    validate: {
      schoolName:    (v) => step===0 && !v.trim()            ? 'Required'              : null,
      phone:         (v) => step===0 && !v.trim()            ? 'Required'              : null,
      email:         (v) => step===0 && !/^\S+@\S+\.\S+$/.test(v) ? 'Valid email needed' : null,
      adminName:     (v) => step===1 && !v.trim()            ? 'Required'              : null,
      adminEmail:    (v) => step===1 && !/^\S+@\S+\.\S+$/.test(v) ? 'Valid email needed' : null,
      adminPassword: (v) => step===1 && v.length < 8        ? 'Min 8 characters'      : null,
    },
  });

  const goTo = (next: number) => {
    if (next > step) {
      const { hasErrors } = form.validate();
      if (hasErrors) return;
    }
    setDir(next > step ? 'right' : 'left');
    setStep(next);
  };

  const submit = async () => {
    setBusy(true);
    try {
      const res  = await fetch('/api/setup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form.values) });
      const data = await res.json();
      if (data.success) {
        setDir('right'); setStep(3);
        setTimeout(() => router.push('/auth/login'), 3200);
      } else {
        notifications.show({ title:'Error', message: data.error||'Setup failed', color:'red' });
      }
    } catch(e:any) {
      notifications.show({ title:'Error', message:e.message, color:'red' });
    } finally { setBusy(false); }
  };

  if (init) return (
    <Center h="100vh" style={{background:'linear-gradient(135deg,#0f0c29,#1a1b4b,#0d47a1)'}}>
      <Stack align="center" gap="md">
        <Box style={{animation:'spinFade 1s ease forwards'}}><IconSchool size={44} color="#60a5fa"/></Box>
        <Text c="rgba(255,255,255,.5)" size="sm">Loading…</Text>
      </Stack>
    </Center>
  );

  const pwLen  = form.values.adminPassword.length;
  const pwPct  = Math.min(100, (pwLen/16)*100);
  const pwCol  = pwLen<8?'red':pwLen<12?'orange':'green';
  const pwTxt  = pwLen<8?'Too short (min 8)':pwLen<12?'Good':'Strong ✓';
  const numSec = CLASSES.length * parseInt(form.values.sectionsPerClass||'1');

  return (
    <>
      <style>{CSS}</style>
      <Box style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f0c29 0%,#1a1b4b 50%,#0d47a1 100%)',padding:'24px 16px',position:'relative',overflow:'hidden'}}>

        {/* bg orbs */}
        <Box style={{position:'absolute',top:'-8%',right:'-6%',width:380,height:380,borderRadius:'50%',background:'radial-gradient(circle,rgba(37,99,235,.15),transparent 70%)',pointerEvents:'none'}}/>
        <Box style={{position:'absolute',bottom:'-6%',left:'-5%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.12),transparent 70%)',pointerEvents:'none'}}/>

        <Container size={600} style={{position:'relative',zIndex:1}}>

          {/* Logo */}
          <Stack align="center" mb="xl" gap="xs">
            <Box className="logo-anim" style={{display:'inline-flex'}}>
              <Box w={80} h={80} style={{borderRadius:24,background:'linear-gradient(135deg,#2563eb,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 12px 40px rgba(37,99,235,.5)'}}>
                <IconSchool size={40} color="white"/>
              </Box>
            </Box>
            <Title c="white" fw={800} size="h1" ta="center">EduManage Pro</Title>
            <Text c="rgba(255,255,255,.5)" size="sm">First-Time Setup Wizard</Text>
          </Stack>

          {/* Step dots + connector */}
          <Group justify="center" mb="md" gap={0}>
            {STEPS.map((s,i)=>{
              const Icon   = s.icon;
              const done   = i < step;
              const active = i === step;
              return (
                <Group key={i} gap={0} align="center">
                  <Box className="step-dot" style={{
                    width: active?48:36, height:36, borderRadius:18,
                    background: done?'rgba(74,222,128,.2)':active?`${s.color}22`:'rgba(255,255,255,.07)',
                    border:`2px solid ${done?'#4ade80':active?s.color:'rgba(255,255,255,.15)'}`,
                    display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                    padding: active?'0 12px':0,
                    boxShadow: active?`0 0 20px ${s.color}55`:'none',
                  }}>
                    {done
                      ? <IconCheck size={16} color="#4ade80"/>
                      : <>
                          <Icon size={15} color={active?s.color:'rgba(255,255,255,.4)'}/>
                          {active && <Text size="xs" fw={700} c={s.color} style={{whiteSpace:'nowrap'}}>{s.label}</Text>}
                        </>
                    }
                  </Box>
                  {i < STEPS.length-1 && (
                    <Box className="step-conn" style={{width:28,height:2,background:done?'#4ade80':'rgba(255,255,255,.1)',borderRadius:1,margin:'0 2px'}}/>
                  )}
                </Group>
              );
            })}
          </Group>

          {/* overall progress */}
          <Box mb="xl">
            <Progress value={(step/(STEPS.length-1))*100} size="xs" radius="xl" color="blue" style={{background:'rgba(255,255,255,.1)'}}/>
          </Box>

          {/* Card */}
          <Card radius="xl" padding="xl" className="card-anim" style={{background:'rgba(255,255,255,.07)',backdropFilter:'blur(24px)',border:'1px solid rgba(255,255,255,.12)',boxShadow:'0 24px 80px rgba(0,0,0,.4)'}}>
            <Box key={step} className={dir==='right'?'slide-right':'slide-left'}>

              {/* ── STEP 0 ── */}
              {step===0 && (
                <Stack gap="lg">
                  <SectionHead icon={IconBuilding} color="#60a5fa" title="School Information" sub="Step 1 of 3 — Basic details" grad="from #60a5fa to #7c3aed"/>
                  <Grid gutter="sm">
                    <Grid.Col span={{base:12,sm:8}}><TextInput label="School Name *" placeholder="Al-Huda Public School" className="si field" styles={IL} leftSection={<IconSchool size={15} color="#60a5fa"/>} style={{animationDelay:'.05s'}} {...form.getInputProps('schoolName')}/></Grid.Col>
                    <Grid.Col span={{base:12,sm:4}}><TextInput label="School Code" placeholder="AHS-001" className="si field" styles={IL} style={{animationDelay:'.1s'}} {...form.getInputProps('schoolCode')}/></Grid.Col>
                    <Grid.Col span={12}><Textarea label="Address" placeholder="Street, area, block" rows={2} className="si field" styles={IL} leftSection={<IconMapPin size={15} color="#60a5fa"/>} style={{animationDelay:'.15s'}} {...form.getInputProps('address')}/></Grid.Col>
                    <Grid.Col span={{base:12,sm:6}}><TextInput label="City" placeholder="Islamabad" className="si field" styles={IL} style={{animationDelay:'.2s'}} {...form.getInputProps('city')}/></Grid.Col>
                    <Grid.Col span={{base:12,sm:6}}>
                      <Select label="Province" placeholder="Select…" className="si field" styles={IL} style={{animationDelay:'.25s'}}
                        data={['Punjab','Sindh','KPK','Balochistan','Islamabad Capital Territory','AJK','Gilgit-Baltistan']}
                        {...form.getInputProps('province')}/>
                    </Grid.Col>
                    <Grid.Col span={{base:12,sm:6}}><TextInput label="Phone *" placeholder="+92 51 1234567" className="si field" styles={IL} leftSection={<IconPhone size={15} color="#60a5fa"/>} style={{animationDelay:'.3s'}} {...form.getInputProps('phone')}/></Grid.Col>
                    <Grid.Col span={{base:12,sm:6}}><TextInput label="Email *" placeholder="info@school.edu.pk" className="si field" styles={IL} leftSection={<IconMail size={15} color="#60a5fa"/>} style={{animationDelay:'.35s'}} {...form.getInputProps('email')}/></Grid.Col>
                    <Grid.Col span={{base:12,sm:6}}>
                      <Select label="Affiliated Board" placeholder="Select board" className="si field" styles={IL} style={{animationDelay:'.4s'}} data={BOARDS} {...form.getInputProps('board')}/>
                    </Grid.Col>
                    <Grid.Col span={{base:12,sm:6}}>
                      <NumberInput label="Established Year" placeholder="1990" min={1900} max={new Date().getFullYear()} className="si field" styles={IL} style={{animationDelay:'.45s'}} {...form.getInputProps('establishedYear')}/>
                    </Grid.Col>
                  </Grid>
                  <Group justify="flex-end" mt="sm">
                    <Button size="md" className="shimmer-btn" rightSection={<IconArrowRight size={18}/>} onClick={()=>goTo(1)}>Continue</Button>
                  </Group>
                </Stack>
              )}

              {/* ── STEP 1 ── */}
              {step===1 && (
                <Stack gap="lg">
                  <SectionHead icon={IconShieldCheck} color="#a78bfa" title="Admin Account" sub="Step 2 of 3 — Your super admin credentials" grad="from #a78bfa to #60a5fa"/>
                  <Alert icon={<IconAlertCircle size={16}/>} style={{background:'rgba(251,191,36,.1)',border:'1px solid rgba(251,191,36,.25)'}} styles={{message:{color:'rgba(255,255,255,.8)'}}}>
                    Save these credentials — you will use them to sign in every time.
                  </Alert>
                  <Grid gutter="sm">
                    <Grid.Col span={12}><TextInput label="Full Name *" placeholder="Muhammad Ahmad" className="si field" styles={IL} leftSection={<IconUser size={15} color="#a78bfa"/>} style={{animationDelay:'.05s'}} {...form.getInputProps('adminName')}/></Grid.Col>
                    <Grid.Col span={{base:12,sm:6}}><TextInput label="Email *" placeholder="admin@school.edu.pk" className="si field" styles={IL} leftSection={<IconMail size={15} color="#a78bfa"/>} style={{animationDelay:'.1s'}} {...form.getInputProps('adminEmail')}/></Grid.Col>
                    <Grid.Col span={{base:12,sm:6}}><TextInput label="Username *" placeholder="admin" className="si field" styles={IL} leftSection={<IconLock size={15} color="#a78bfa"/>} style={{animationDelay:'.15s'}} {...form.getInputProps('adminUsername')}/></Grid.Col>
                    <Grid.Col span={12}>
                      <PasswordInput label="Password *" placeholder="Minimum 8 characters" className="si field" style={{animationDelay:'.2s'}}
                        styles={{...IL, innerInput:{color:'white'}, visibilityToggle:{color:'rgba(255,255,255,.5)'}}}
                        {...form.getInputProps('adminPassword')}/>
                    </Grid.Col>
                  </Grid>
                  {pwLen > 0 && (
                    <Stack gap={4}>
                      <Progress value={pwPct} color={pwCol} size="xs" radius="xl" style={{background:'rgba(255,255,255,.1)'}}/>
                      <Text size="xs" c={`${pwCol}.4`}>{pwTxt}</Text>
                    </Stack>
                  )}
                  <Group justify="space-between" mt="sm">
                    <Button variant="subtle" leftSection={<IconArrowLeft size={16}/>} onClick={()=>goTo(0)} styles={{root:{color:'rgba(255,255,255,.6)'}}}>Back</Button>
                    <Button size="md" className="shimmer-btn" rightSection={<IconArrowRight size={18}/>} onClick={()=>goTo(2)}>Continue</Button>
                  </Group>
                </Stack>
              )}

              {/* ── STEP 2 ── */}
              {step===2 && (
                <Stack gap="lg">
                  <SectionHead icon={IconCalendar} color="#34d399" title="Academic Setup" sub="Step 3 of 3 — Configure classes & academic year" grad="from #34d399 to #60a5fa"/>
                  <Grid gutter="sm">
                    <Grid.Col span={{base:12,sm:6}}><TextInput label="Academic Year" placeholder="2025-2026" className="si field" styles={IL} leftSection={<IconCalendar size={15} color="#34d399"/>} style={{animationDelay:'.05s'}} {...form.getInputProps('currentYear')}/></Grid.Col>
                    <Grid.Col span={{base:12,sm:6}}><Select label="Year Starts In" className="si field" styles={IL} style={{animationDelay:'.1s'}} data={MONTHS} {...form.getInputProps('academicYearStart')}/></Grid.Col>
                    <Grid.Col span={{base:12,sm:6}}><Select label="Sections per Class" className="si field" styles={IL} style={{animationDelay:'.15s'}} data={['1','2','3','4','5']} {...form.getInputProps('sectionsPerClass')}/></Grid.Col>
                  </Grid>

                  <Stack gap="xs">
                    <Text size="sm" c="rgba(255,255,255,.75)" fw={600}>Classes to be created automatically:</Text>
                    <SimpleGrid cols={{base:4,sm:6}} spacing="xs">
                      {CLASSES.map((cls,i)=>(
                        <Box key={cls} style={{background:'rgba(52,211,153,.1)',border:'1px solid rgba(52,211,153,.25)',borderRadius:8,padding:'6px 4px',textAlign:'center',animation:`fieldIn .3s ease ${i*0.03}s forwards`,opacity:0}}>
                          <Text size="xs" c="#34d399" fw={600}>{['Nursery','KG'].includes(cls)?cls:`Class ${cls}`}</Text>
                        </Box>
                      ))}
                    </SimpleGrid>
                    <Text size="xs" c="rgba(255,255,255,.4)">
                      {CLASSES.length} classes × {form.values.sectionsPerClass} sections = <strong style={{color:'#34d399'}}>{numSec} total sections</strong>
                    </Text>
                  </Stack>

                  <Group justify="space-between" mt="sm">
                    <Button variant="subtle" leftSection={<IconArrowLeft size={16}/>} onClick={()=>goTo(1)} styles={{root:{color:'rgba(255,255,255,.6)'}}}>Back</Button>
                    <Button size="md" className="green-btn" leftSection={<IconRocket size={18}/>} loading={busy} onClick={submit}>
                      {busy ? 'Setting up…' : 'Complete Setup'}
                    </Button>
                  </Group>
                </Stack>
              )}

              {/* ── STEP 3 ── */}
              {step===3 && (
                <Stack align="center" gap="xl" py="lg">
                  <Box className="check-anim" style={{width:96,height:96,borderRadius:'50%',background:'rgba(74,222,128,.15)',border:'3px solid #4ade80',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 40px rgba(74,222,128,.4)'}}>
                    <IconCheck size={48} color="#4ade80"/>
                  </Box>
                  <Stack align="center" gap="xs">
                    <Title order={2} c="white" fw={800} ta="center">🎉 Setup Complete!</Title>
                    <Text c="rgba(255,255,255,.6)" ta="center" maw={360}>Your school management system is ready. Redirecting to login…</Text>
                  </Stack>
                  <Paper p="md" radius="lg" w="100%" maw={340} style={{background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.15)'}}>
                    <Stack gap="xs">
                      <Text size="sm" fw={700} c="#60a5fa">Your Login Credentials</Text>
                      <Group justify="space-between">
                        <Text size="sm" c="rgba(255,255,255,.6)">Username</Text>
                        <Badge variant="light" color="blue" size="md">{form.values.adminUsername}</Badge>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="rgba(255,255,255,.6)">Password</Text>
                        <Badge variant="light" color="violet" size="md">{form.values.adminPassword}</Badge>
                      </Group>
                    </Stack>
                  </Paper>
                  <Button size="md" className="shimmer-btn" rightSection={<IconArrowRight size={18}/>} onClick={()=>router.push('/auth/login')}>
                    Go to Login
                  </Button>
                </Stack>
              )}

            </Box>
          </Card>

          <Text size="xs" c="rgba(255,255,255,.2)" ta="center" mt="lg">
            © {new Date().getFullYear()} EduManage Pro
          </Text>
        </Container>
      </Box>
    </>
  );
}

/* tiny helper component */
function SectionHead({ icon: Icon, color, title, sub, grad }: any) {
  return (
    <Box>
      <Group gap="sm" mb={4}>
        <ThemeIcon size="lg" radius="md" style={{background:`${color}22`,color}}>
          <Icon size={20}/>
        </ThemeIcon>
        <Box>
          <Title order={3} c="white" fw={700}>{title}</Title>
          <Text size="xs" c="rgba(255,255,255,.5)">{sub}</Text>
        </Box>
      </Group>
      <Box h={2} w={60} style={{background:`linear-gradient(90deg,${color},#7c3aed)`,borderRadius:1}} mt="xs"/>
    </Box>
  );
}
