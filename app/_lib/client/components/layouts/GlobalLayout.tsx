"use client";
import * as React from "react";
import { css, Global } from "@emotion/react";
import type { AppSettings } from "@/app/types";

export function GlobalLayout({ children, settings }: { children: React.ReactNode; settings: AppSettings }) {
  return (
    <>
      <Global
        styles={css`
          :root {
            --theme-color-primary: ${settings?.theme?.colorPrimary};
            --theme-color-primary-dark: ${settings?.theme?.colorPrimaryDark};

            --theme-font-primary: ${settings?.theme?.fontPrimary || "'Lobster', serif"};
            --theme-font-secondary: ${settings?.theme?.fontSecondary || "'Open Sans', Helvetica, Arial, sans-serif"};
          }
        `}
      />
      {children}
    </>
  );
}
