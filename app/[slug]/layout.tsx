import { notFound } from "next/navigation";
import { auth } from "@/app/server/auth";
import { AppSettings } from "@/app/server/helpers/AppSettings";
import { PrimaryNav } from "@/app/client/components/PrimaryNav";

export default async function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PrimaryNav />
      {children}
    </>
  );
}
