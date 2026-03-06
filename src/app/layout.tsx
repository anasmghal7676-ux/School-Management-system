import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduManage Pro — School Management System",
  description: "Comprehensive School Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
