import React from 'react';

export function OrigonLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <path d="M50,5C25.2,5,5,25.2,5,50s20.2,45,45,45s45-20.2,45-45S74.8,5,50,5z M50,85c-19.3,0-35-15.7-35-35S30.7,15,50,15 s35,15.7,35,35S69.3,85,50,85z" />
      <path d="M50,25c-13.8,0-25,11.2-25,25s11.2,25,25,25s25-11.2,25-25S63.8,25,50,25z M50,65c-8.3,0-15-6.7-15-15s6.7-15,15-15 s15,6.7,15,15S58.3,65,50,65z" />
    </svg>
  );
}
