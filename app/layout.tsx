import type { Metadata } from 'next'
import ToastProvider from '@/components/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: '友链审核系统',
  description: '友链提交与审核管理系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('dark')||'0';if(t==='1'){document.documentElement.classList.add('dark');return}if(t==='0')return;var s='${process.env.NEXT_PUBLIC_DARK_MODE_START || ''}',e='${process.env.NEXT_PUBLIC_DARK_MODE_END || ''}';if(s&&e){var n=new Date,h=n.getHours(),m=n.getMinutes(),c=h*60+m,st=parseInt(s.split(':')[0],10)*60+parseInt(s.split(':')[1],10),et=parseInt(e.split(':')[0],10)*60+parseInt(e.split(':')[1],10);if(st<et){if(c>=st&&c<et)document.documentElement.classList.add('dark')}else{if(c>=st||c<et)document.documentElement.classList.add('dark')}}else if(window.matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.classList.add('dark')}catch(e){}})()`
        }} />
      </head>
      <body className="bg-[var(--bg)] text-[var(--text)]">
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
