'use client';

import { StaffMainContent } from '@/components/dashboard/staff';
import { useAuth } from '@/contexts/AuthContext';
import Cookies from 'js-cookie';

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const isDemo = user?.is_demo || Cookies.get('demo_mode') === 'true';

  return (
    <StaffMainContent
      profileData={isDemo ? {
        full_name: 'Demo Staff',
        staff_id: 'DEMO-STAFF-01',
        phone: '000-000-0000',
        role: 'Office Staff',
      } : {}}
      dashboardData={isDemo ? {
        tasks: [
          { assignment_id: 1, description: 'Prepare the weekly attendance summary', date: new Date().toISOString().split('T')[0], is_recurring: false, status: 'Pending', note: '', proof_url: null },
          { assignment_id: 2, description: 'Organize incoming library books', date: new Date().toISOString().split('T')[0], is_recurring: true, status: 'In Progress', note: '', proof_url: null },
        ],
        inventory: [
          { id: 1, stock_name: 'A4 paper reams', available: 12, status: 'In Stock' },
          { id: 2, stock_name: 'Whiteboard markers', available: 2, status: 'Low Stock' },
        ],
        inventoryHistory: [],
        announcements: [
          { title: 'Staff meeting', description: 'The monthly staff meeting is scheduled for Friday at 3:30 PM.', date: new Date().toISOString() },
        ],
        commonAnnouncements: [],
        attendanceSummary: { attendance_percentage: '96%', present: 24, total_working_days: 25, late: 1, absent: 0 },
        attendanceHistory: [],
        leaves: [],
        salary: { month: 'October 2026', net_payable: 28500 },
        transport: null,
      } : {}}
    />
  );
}
