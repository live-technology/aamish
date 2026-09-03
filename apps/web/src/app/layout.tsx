import type { Metadata } from "next";
import "./globals.css";
import "./admin.css";
import "./admin-sections.css";
import "../styles/tokens.css";
import { FeedbackWidget } from "@/components/feedback-widget";
import { currentSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Aamish | Corporate meal management",
  description: "Corporate meal scheduling, delivery allocation, and quality feedback.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await currentSession();
  return (
    <html lang="en">
      <body>{children}{session && <FeedbackWidget />}</body>
    </html>
  );
}
