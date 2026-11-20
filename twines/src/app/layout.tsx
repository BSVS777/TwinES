import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TwinES",
  description: "Vehicle health and maintenance tracking.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
