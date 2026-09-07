import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '云笺 · 问心有方', description: '一笺心事，一点启发。国风生活探索工具，演示体验版。' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="zh-CN"><body>{children}</body></html>; }
