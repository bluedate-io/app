'use client';

import dynamic from 'next/dynamic';

const TawkMessengerReact = dynamic(() => import('@tawk.to/tawk-messenger-react'), { ssr: false });

export default function TawkMessenger() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_MESSENGER_PROPERTY_ID as string;
  const widgetId = process.env.NEXT_PUBLIC_TAWK_MESSENGER_WIDGET_ID as string;

  if (!propertyId || !widgetId) return null;

  return <TawkMessengerReact propertyId={propertyId} widgetId={widgetId} />;
}
