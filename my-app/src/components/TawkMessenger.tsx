'use client';

import { useEffect } from 'react';

export default function TawkMessenger() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_MESSENGER_PROPERTY_ID;
  const widgetId = process.env.NEXT_PUBLIC_TAWK_MESSENGER_WIDGET_ID;

  useEffect(() => {
    if (!propertyId || !widgetId) return;
    if (document.getElementById('tawk-script')) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w.Tawk_API = w.Tawk_API ?? {};
    w.Tawk_LoadStart = new Date();

    const s = document.createElement('script');
    s.id = 'tawk-script';
    s.async = true;
    s.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    s.charset = 'UTF-8';
    s.setAttribute('crossorigin', '*');
    document.head.appendChild(s);
  }, [propertyId, widgetId]);

  return null;
}
