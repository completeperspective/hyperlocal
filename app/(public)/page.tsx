import Image from "next/image";
import { AppSettings } from "@/app/server/helpers/AppSettings";
import Link from "next/link";
import { AppPage } from "@/app/server/components/AppPage";
import { getPage } from "@/app/server/actions/getPage";
import { PageData, PageProps } from "@/app/types";
import { redirect } from "next/navigation";
import { auth } from "../_lib/server/auth";
import { ResolvingMetadata, Metadata } from "next";

export async function generateMetadata(
  { params, searchParams }: { params: { slug: string }; searchParams: PageProps["searchParams"] },
  parent: ResolvingMetadata
): Promise<Metadata> {
  //const _p = await params;
  // load app settings
  const settings = await AppSettings.instance.settings();
  const isAuthenticated = await auth.isAuthenticated();
  const pageTitle = `${settings?.title} | ${settings?.homePage?.title}`;
  const title = settings?.isPrivate ? (isAuthenticated ? pageTitle : "Login") : pageTitle;
  const description = settings?.isPrivate ? "Login to access the site" : settings?.homePage?.description;
  return {
    title,
    description,
    robots: settings?.robots,
  };
}

export default async function PublicLanding() {
  const appSettings = await AppSettings.instance.settings();
  const isAuthenticated = await auth.isAuthenticated();

  // if the site is private, check if the user is authenticated
  if (appSettings.isPrivate && !isAuthenticated) {
    return redirect("/login");
  }

  // if the page is a membership page and the user is not authenticated, redirect to login
  const pageData = await getPage(appSettings?.homePage?.slug);
  if (pageData.status === "membership" && !isAuthenticated) {
    const isHomePage = appSettings.homePage?.slug === pageData.slug;
    return redirect(`/login?returnTo=${isHomePage ? "/" : pageData.slug}`);
  }

  return <AppPage pageData={pageData} />;
}
