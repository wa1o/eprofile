import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'EProfile',
  description: 'Tarjeta de presentacion digital para estudiantes',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
