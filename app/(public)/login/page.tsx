import { ResolvingMetadata, Metadata } from "next";
import { AppSettings } from "@/app/server/helpers/AppSettings";
import { LoginForm } from "../_templates/LoginForm";
import { PageProps } from "@/app/types";

export async function generateMetadata(
  { params, searchParams }: { params: { slug: string }; searchParams: PageProps["searchParams"] },
  parent: ResolvingMetadata
): Promise<Metadata> {
  //const _p = await params;
  // load app settings
  const settings = await AppSettings.instance.settings();

  const title = settings?.isPrivate ? "Login" : `${settings?.title} | Login`;
  const description = "Login to access content";

  return {
    title,
    description,
    robots: settings?.robots,
  };
}

export default async function LoginPage({ params, searchParams }: PageProps) {
  const appSettings = await AppSettings.instance.settings();
  const _s = await searchParams;

  const returnTo = _s?.returnTo as string;

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 ">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-5xl">Welcome back</h1>

        <LoginForm returnTo={returnTo} />
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <p className="text-gray-500 text-xs text-center sm:text-left">{appSettings?.copyrightText}</p>
      </footer>
    </div>
  );
}
