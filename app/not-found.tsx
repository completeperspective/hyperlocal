"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFoundError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col col-start-2 gap-8 row-start-2 justify-center items-center min-h-screen">
      <h2 className="font-mono text-white text-xl bg-black p-1 px-4 -rotate-2 rounded-sm">
        <span className="text-secondary dark:text-secondary-dark">404 </span>
        <span className="text-gray-500">| </span>Page does not exist!
      </h2>
      <button
        className="text-primary dark:text-primary-dark underline"
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => router.push("/")
        }
      >
        Back to Home
      </button>
    </div>
  );
}
