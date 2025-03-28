import { Lobster, Open_Sans } from "next/font/google";
import { auth } from "@/app/server/auth";
import { AppSettings } from "@/app/server/helpers/AppSettings";
import { GlobalLayout } from "@/app/client/components/layouts/GlobalLayout";

import "./globals.scss";
import { redirect } from "next/navigation";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-open-sans",
});

const lobster = Lobster({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-lobster",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appSettings = await AppSettings.instance.settings();

  return (
    <html lang="en">
      <body className={`${openSans.variable} ${lobster.variable} antialiased`}>
        <GlobalLayout settings={appSettings}>{children}</GlobalLayout>
      </body>
    </html>
  );
}
