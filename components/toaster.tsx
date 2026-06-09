'use client'

import { Toaster } from 'react-hot-toast'

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#18181b',
          color: '#fff',
          fontSize: '14px',
          borderRadius: '8px',
        },
      }}
    />
  )
}
