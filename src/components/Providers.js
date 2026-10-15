"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { WorkspaceProvider } from "./WorkspaceProvider";

export function Providers({ children }) {
  return (
    <SessionProvider>
      <WorkspaceProvider>
        {children}
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#0f172a',
            color: '#fff',
            border: '1px solid #1e293b',
          },
        }}/>
      </WorkspaceProvider>
    </SessionProvider>
  );
}
