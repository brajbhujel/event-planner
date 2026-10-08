"use client";

import { useEffect } from "react";

const Error = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    console.error("Error caught", /* error */);
  }, [error]);

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 text-center">
      <h2 className="text-lg font-semibold text-red-500">Oops! Something went wrong.</h2>
      <p className="text-neutral-800 dark:text-neutral-200 mt-2">
        An unexpected error occurred. Please try again or contact support.
      </p>
      <div className="mt-4 flex gap-3 justify-center">
        {/* Try Again Button */}
        <button
          onClick={reset}
          className="bg-neutral-200 hover:bg-neutral-800 border border-black text-black hover:text-white dark:bg-neutral-800 dark:text-white dark:border-white  dark:hover:border-white px-4 py-2 rounded-md transition-all"
        >
          Try Again
        </button>
        {/* Navigate Back to Home */}
        <a
          href="/"
          className="bg-neutral-800 hover:bg-neutral-200 dark:bg-neutral-200  hover:border hover:border-black hover:text-black text-white dark:text-black px-4 py-2 rounded-md transition-all"
        >
          Go Home
        </a>
      </div>
    </div>
  );
};

export default Error;
