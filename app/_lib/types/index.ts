import type { Settings, Page, Post } from "@prisma/client";
export interface AppSettings extends Settings {
  // title: string;
  // description: string;
  // copyrightText: string;
  theme: {
    colorPrimary: string;
    colorPrimaryDark: string;
    fontPrimary: string;
    fontSecondary: string;
  };
}

export interface PageProps {
  params: Promise<{ [key: string]: string | string[] | undefined }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface PostData extends Post {
  author: {
    name: string;
  };
  images: {
    image: {
      publicUrl: string;
    };
    altText: string;
  }[];
  altText: string;
}

export interface PageData extends Page {
  author: {
    name: string;
  };
  content: {
    document: any;
  };
  posts: PostData[];
}
