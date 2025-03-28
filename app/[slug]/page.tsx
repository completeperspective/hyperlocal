import { ResolvingMetadata, Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AppSettings } from "@/app/server/helpers/AppSettings";
import { getPage } from "@/app/server/actions/getPage";
import { AppPage } from "@/app/server/components/AppPage";
import { auth } from "@/app/server/auth";
import { PageProps } from "@/app/types";

export async function generateMetadata(
  { params, searchParams }: { params: { slug: string }; searchParams: PageProps["searchParams"] },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const _p = await params;
  // load app settings
  const settings = await AppSettings.instance.settings();
  const page = await getPage(_p?.slug as string);

  const title = settings?.isPrivate ? "Private" : `${settings?.title} | ${page.title}`;
  const description = settings?.isPrivate ? "Login to access the site" : settings?.homePage?.description;
  return {
    title,
    description,
    robots: settings?.robots,
  };
}

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  const _p = await params;

  // check if site is private, and if user is authenticated
  const appSettings = await AppSettings.instance.settings();
  const isAuthenticated = await auth.isAuthenticated();

  if (appSettings.isPrivate && !isAuthenticated) {
    return notFound();
  }

  // returns 404 if page not found
  const pageData = await getPage(_p.slug);

  if (pageData?.status === "membership" && !isAuthenticated) {
    const isHomePage = appSettings.homePage?.slug === _p.slug;

    return redirect(`/login?returnTo=${isHomePage ? "/" : `%2F${_p.slug}`}`);
  }

  if (appSettings.homePage?.slug === pageData?.slug) {
    return redirect("/");
  }

  console.log(pageData.posts);

  return <AppPage pageData={pageData} />;
}
