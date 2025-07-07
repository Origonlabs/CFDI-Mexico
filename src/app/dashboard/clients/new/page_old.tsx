"use client";

import dynamic from 'next/dynamic';

const NewClientPage = dynamic(() => import('./NewClientPageComponent'), {
  ssr: false,
  loading: () => <div>Cargando...</div>
});

export default function NewClientPageWrapper() {
  return <NewClientPage />;
}
