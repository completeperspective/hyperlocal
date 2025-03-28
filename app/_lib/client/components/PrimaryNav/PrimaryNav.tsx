"use client";

import { useRouter } from "next/navigation";

export const PrimaryNav = () => {
  const router = useRouter();

  return (
    <header className="row-start-1 col-span-3">
      <nav className="col-start-2 flex justify-between items-center h-[56px] px-4 bg-surface border-b border-b-stroke drop-shadow-xl dark:bg-surface-dark dark:border-b-0">
        <div className="hover:text-primary hover:dark:text-primary-dark select-none cursor-pointer"></div>

        <ul className="flex gap-4">
          <li>
            <div
              onClick={() => router.push("/")}
              className="select-none cursor-pointer hover:text-primary hover:dark:text-primary-dark"
            >
              Home
            </div>
          </li>
        </ul>
      </nav>
    </header>
  );
};
