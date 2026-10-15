'use client';

import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DemoModeBanner() {
  const [active, setActive] = useState(false);
  const { logout } = useAuth();

  useEffect(() => setActive(Cookies.get('demo_mode') === 'true'), []);
  if (!active) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950 shadow-lg">
      <span className="h-2 w-2 rounded-full bg-amber-500" />
      <span><strong>Demo mode</strong> · Sample account</span>
      <button type="button" onClick={logout} className="font-semibold underline underline-offset-2">Exit</button>
    </div>
  );
}
