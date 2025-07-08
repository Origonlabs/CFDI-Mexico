"use client";

import { AppleLoader } from '@/components/ui/apple-loader';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <AppleLoader />
    </div>
  );
}
