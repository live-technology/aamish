import type { Metadata } from "next";
import "./globals.css";
import "./admin.css";
import "./admin-sections.css";

export const metadata: Metadata = {
  title: "Aamish | Corporate meal management",
  description: "Corporate meal scheduling, delivery allocation, and quality feedback.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
