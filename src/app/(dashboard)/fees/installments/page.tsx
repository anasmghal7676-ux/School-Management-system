'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, TextInput, Select, Modal, NumberInput, Table, ActionIcon, Tabs, Progress, Stack, Pagination } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconCheck, IconSearch, IconReceipt, IconList, IconCash, IconAlertCircle } from '@tabler/icons-react';

const PAGE_SIZE = 15;

export default function FeeInstallmentsPage() {
  const [activeTab, setActiveTab] = useState<string | null>('payments');
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [students, setStudents] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [paySearch, setPaySearch] = useState('');
  const [debouncedPaySearch] = useDebouncedValue(paySearch, 300);
  const [payStatus, setPayStatus] = useState('');
  const [payPage, setPayPage] = useState(1);
  const [payLoading, setPayLoading] = useState(false);
  const [planItems, setPlanItems] = useState<any[]>([]);
  const [planSearch, setPlanSearch] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [newPayModal, setNewPayModal] = useState(false);
  const [newPlanModal, setNewPlanModal] = useState(false);
  const [payForm, setPayForm] = useState<any>({ studentId: '', planId: '', startDate: new Date().toISOString().slice(0,10), totalAmount: '', installments: 3 });
  const [planForm, setPlanForm] = useState<any>({ planName: '', classId: '', description: '', defaultInstallments: 3, defaultAmount: '' });
  const [saving, setSaving] = useState(false);

  const loadPayments = async () => {
    setPayLoading(true);
    try {
      const params = new URLSearchParams({ view: 'payments', search: debouncedPaySearch, status: payStatus });
      const res = await fetch('/api/fee-installments?' + params);
      const data = await res.json();
      setPayments(data.items || []);
      setSummary(data.summary || {});
      setStudents(data.students || []);
      setPlans(data.plans || []);
    } catch { notifications.show({ message: 'Failed to load payments', color: 'red' }); }
    setPayLoading(false);
  };

  const loadPlans = async () => {
    setPlanLoading(true);
    try {
      const res = await fetch('/api/fee-installments?view=plans&search=' + planSearch);
      const data = await res.json();
      setPlanItems(data.items || []);
      setClasses(data.classes || []);
    } catch { notifications.show({ message: 'Failed to load plans', color: 'red' }); }
    setPlanLoading(false);
  };

  useEffect(() => { if (activeTab === 'payments') loadPayments(); }, [activeTab, debouncedPaySearch, payStatus]);
  useEffect(() => { if (activeTab === 'plans') loadPlans(); }, [activeTab, planSearch]);

  const markPaid = async (id: string) => {
    try {
      await fetch('/api/fee-installments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'Paid' }) });
      notifications.show({ message: 'Marked as paid', color: 'green' });
      loadPayments();
    } catch { notifications.show({ message: 'Failed to update', color: 'red' }); }
  };

  const deleteItem = async (id: string, entity: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await fetch('/api/fee-installments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity }) });
      notifications.show({ message: 'Deleted', color: 'green' });
      entity === 'plan' ? loadPlans() : loadPayments();
    } catch { notifications.show({ message: 'Failed to delete', color: 'red' }); }
  };

  const savePayment = async () => {
    if (!payForm.studentId || !payForm.totalAmount || !payForm.installments) {
      notifications.show({ message: 'Fill required fields', color: 'red' }); return;
    }
    setSaving(true);
    try {
      const student = students.find((s: any) => s.id === payForm.studentId);
      const plan = plans.find((p: any) => p.id === payForm.planId);
      const body = { ...payForm, studentName: student?.fullName || '', className: student?.class?.name || '', planName: plan?.planName || '' };
      await fetch('/api/fee-installments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      notifications.show({ message: 'Installments created', color: 'green' });
      setNewPayModal(false);
      setPayForm({ studentId: '', planId: '', startDate: new Date().toISOString().slice(0,10), totalAmount: '', installments: 3 });
      loadPayments();
    } catch { notifications.show({ message: 'Failed to create', color: 'red' }); }
    setSaving(false);
  };

  const savePlan = async () => {
    if (!planForm.planName) { notifications.show({ message: 'Plan name required', color: 'red' }); return; }
    setSaving(true);
    try {
      await fetch('/api/fee-installments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'plan', ...planForm }) });
      notifications.show({ message: 'Plan created', color: 'green' });
      setNewPlanModal(false);
      setPlanForm({ planName: '', classId: '', description: '', defaultInstallments: 3, defaultAmount: '' });
      loadPlans();
    } catch { notifications.show({ message: 'Failed to create plan', color: 'red' }); }
    setSaving(false);
  };

  const paged = payments.slice((payPage - 1) * PAGE_SIZE, payPage * PAGE_SIZE);
  const totalPages = Math.ceil(payments.length / PAGE_SIZE);
  const fmtPKR = (n: number) => `PKR ${(n || 0).toLocaleString()}`;
  const statusColor: any = { Paid: 'green', Pending: 'yellow' };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="22px" fw={800} c="#0f172a">Fee Installments</Text>
          <Text c="dimmed" size="sm">Manage installment plans and student payment schedules</Text>
        </Box>
        <Button leftSection={<IconPlus size={16}/>} onClick={() => activeTab === 'plans' ? setNewPlanModal(true) : setNewPayModal(true)}>
          {activeTab === 'plans' ? 'New Plan' : 'New Schedule'}
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        {[
          { label: 'Total Schedules', value: summary.total || 0, icon: IconList, color: '#3b82f6' },
          { label: 'Paid', value: summary.paid || 0, icon: IconCheck, color: '#10b981' },
          { label: 'Pending', value: summary.pending || 0, icon: IconReceipt, color: '#f59e0b' },
          { label: 'Overdue', value: summary.overdue || 0, icon: IconAlertCircle, color: '#ef4444' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
            <Group gap="sm">
              <Box style={{ width: 36, height: 36, borderRadius: 8, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </Box>
              <Box>
                <Text size="xl" fw={800} c={color}>{value}</Text>
                <Text size="xs" c="dimmed">{label}</Text>
              </Box>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      {(summary.collected !== undefined) && (
        <Card shadow="xs" radius="md" p="md" mb="xl" style={{ border: '1px solid #e2e8f0' }}>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={600}>Collection Progress</Text>
            <Text size="sm" c="dimmed">{fmtPKR(summary.collected)} / {fmtPKR((summary.collected||0)+(summary.outstanding||0))}</Text>
          </Group>
          <Progress value={summary.collected+summary.outstanding > 0 ? (summary.collected/(summary.collected+summary.outstanding))*100 : 0} color="green" size="md" radius="xl" />
          <Group justify="space-between" mt="xs">
            <Text size="xs" c="green">Collected: {fmtPKR(summary.collected)}</Text>
            <Text size="xs" c="orange">Outstanding: {fmtPKR(summary.outstanding)}</Text>
          </Group>
        </Card>
      )}

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="payments" leftSection={<IconCash size={14}/>}>Payment Schedules</Tabs.Tab>
          <Tabs.Tab value="plans" leftSection={<IconList size={14}/>}>Installment Plans</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="payments">
          <Group mb="md" gap="sm">
            <TextInput placeholder="Search student…" leftSection={<IconSearch size={14}/>} value={paySearch} onChange={e => { setPaySearch(e.currentTarget.value); setPayPage(1); }} style={{ flex: 1 }} />
            <Select placeholder="All Status" data={['Paid','Pending','overdue']} value={payStatus} onChange={v => { setPayStatus(v||''); setPayPage(1); }} clearable style={{ width: 150 }} />
          </Group>
          <Card shadow="xs" radius="md" style={{ border: '1px solid #e2e8f0', overflow: 'auto' }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Student</Table.Th><Table.Th>Class</Table.Th><Table.Th>Plan</Table.Th>
                  <Table.Th>No.</Table.Th><Table.Th>Amount</Table.Th><Table.Th>Due Date</Table.Th>
                  <Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {payLoading ? (
                  <Table.Tr><Table.Td colSpan={8}><Text ta="center" c="dimmed" py="xl">Loading…</Text></Table.Td></Table.Tr>
                ) : paged.length === 0 ? (
                  <Table.Tr><Table.Td colSpan={8}><Text ta="center" c="dimmed" py="xl">No payment schedules found</Text></Table.Td></Table.Tr>
                ) : paged.map((p: any) => (
                  <Table.Tr key={p.id}>
                    <Table.Td><Text fw={500} size="sm">{p.studentName}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{p.className}</Text></Table.Td>
                    <Table.Td><Text size="sm">{p.planName||'—'}</Text></Table.Td>
                    <Table.Td><Badge size="sm" variant="outline" color="blue">{p.installmentNumber}/{p.totalInstallments}</Badge></Table.Td>
                    <Table.Td><Text size="sm" fw={600}>PKR {(p.amount||0).toLocaleString()}</Text></Table.Td>
                    <Table.Td><Text size="sm" c={p.isOverdue?'red':'inherit'}>{p.dueDate}</Text></Table.Td>
                    <Table.Td><Badge color={p.isOverdue?'red':statusColor[p.status]||'gray'} size="sm">{p.isOverdue?'Overdue':p.status}</Badge></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        {p.status !== 'Paid' && <ActionIcon color="green" variant="light" size="sm" onClick={() => markPaid(p.id)}><IconCheck size={14}/></ActionIcon>}
                        <ActionIcon color="red" variant="light" size="sm" onClick={() => deleteItem(p.id,'payment')}><IconTrash size={14}/></ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
          {totalPages > 1 && <Pagination total={totalPages} value={payPage} onChange={setPayPage} mt="md" />}
        </Tabs.Panel>

        <Tabs.Panel value="plans">
          <Group mb="md">
            <TextInput placeholder="Search plans…" leftSection={<IconSearch size={14}/>} value={planSearch} onChange={e => setPlanSearch(e.currentTarget.value)} style={{ flex: 1 }} />
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} gap="md">
            {planLoading ? <Text c="dimmed">Loading…</Text>
             : planItems.length === 0 ? (
              <Card shadow="xs" radius="md" p="xl" style={{ border: '1px dashed #e2e8f0', gridColumn: '1/-1' }}>
                <Stack align="center" gap="sm">
                  <Text size="xl">📋</Text>
                  <Text fw={600}>No installment plans yet</Text>
                  <Button size="sm" leftSection={<IconPlus size={14}/>} onClick={() => setNewPlanModal(true)}>Create Plan</Button>
                </Stack>
              </Card>
             ) : planItems.map((plan: any) => {
              const cls = classes.find((c: any) => c.id === plan.classId);
              return (
                <Card key={plan.id} shadow="xs" radius="md" p="lg" style={{ border: '1px solid #e2e8f0' }}>
                  <Group justify="space-between" mb="sm">
                    <Text fw={700}>{plan.planName}</Text>
                    <ActionIcon color="red" variant="light" size="sm" onClick={() => deleteItem(plan.id,'plan')}><IconTrash size={14}/></ActionIcon>
                  </Group>
                  {cls && <Badge size="sm" mb="xs">{cls.name}</Badge>}
                  {plan.description && <Text size="sm" c="dimmed" mb="xs">{plan.description}</Text>}
                  <Group gap="xl" mt="sm">
                    <Box><Text size="xs" c="dimmed">Installments</Text><Text fw={700}>{plan.defaultInstallments||'—'}</Text></Box>
                    {plan.defaultAmount && <Box><Text size="xs" c="dimmed">Amount</Text><Text fw={700}>PKR {Number(plan.defaultAmount).toLocaleString()}</Text></Box>}
                  </Group>
                </Card>
              );
            })}
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={newPayModal} onClose={() => setNewPayModal(false)} title="Create Payment Schedule" size="md">
        <Stack gap="sm">
          <Select label="Student *" placeholder="Select student" searchable
            data={students.map((s: any) => ({ value: s.id, label: `${s.fullName} (${s.admissionNumber})` }))}
            value={payForm.studentId} onChange={v => setPayForm((f: any) => ({...f, studentId: v||''}))} />
          <Select label="Plan (optional)" placeholder="Select plan" clearable
            data={plans.map((p: any) => ({ value: p.id, label: p.planName }))}
            value={payForm.planId} onChange={v => setPayForm((f: any) => ({...f, planId: v||''}))} />
          <NumberInput label="Total Amount (PKR) *" placeholder="e.g. 30000" min={1}
            value={payForm.totalAmount} onChange={v => setPayForm((f: any) => ({...f, totalAmount: v}))} />
          <NumberInput label="Number of Installments *" placeholder="e.g. 3" min={1} max={24}
            value={payForm.installments} onChange={v => setPayForm((f: any) => ({...f, installments: v}))} />
          <TextInput label="Start Date *" type="date" value={payForm.startDate} onChange={e => setPayForm((f: any) => ({...f, startDate: e.currentTarget.value}))} />
          {payForm.totalAmount && payForm.installments && (
            <Card radius="md" p="sm" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <Text size="sm" c="green" fw={600}>{payForm.installments} installments of PKR {Math.round(Number(payForm.totalAmount)/Number(payForm.installments)).toLocaleString()} each</Text>
            </Card>
          )}
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setNewPayModal(false)}>Cancel</Button>
            <Button onClick={savePayment} loading={saving}>Create Schedule</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={newPlanModal} onClose={() => setNewPlanModal(false)} title="Create Installment Plan" size="md">
        <Stack gap="sm">
          <TextInput label="Plan Name *" placeholder="e.g. Quarterly Plan" value={planForm.planName} onChange={e => setPlanForm((f: any) => ({...f, planName: e.currentTarget.value}))} />
          <Select label="Default Class" placeholder="Select class (optional)" clearable
            data={classes.map((c: any) => ({ value: c.id, label: c.name }))}
            value={planForm.classId} onChange={v => setPlanForm((f: any) => ({...f, classId: v||''}))} />
          <TextInput label="Description" placeholder="Plan description" value={planForm.description} onChange={e => setPlanForm((f: any) => ({...f, description: e.currentTarget.value}))} />
          <NumberInput label="Default Installments" min={1} max={24} value={planForm.defaultInstallments} onChange={v => setPlanForm((f: any) => ({...f, defaultInstallments: v}))} />
          <NumberInput label="Default Amount (PKR)" min={0} value={planForm.defaultAmount} onChange={v => setPlanForm((f: any) => ({...f, defaultAmount: v}))} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setNewPlanModal(false)}>Cancel</Button>
            <Button onClick={savePlan} loading={saving}>Create Plan</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
