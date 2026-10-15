"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import useSWR from "swr";

const WorkspaceContext = createContext();

const fetcher = (url) => fetch(url).then((res) => res.json());

export function WorkspaceProvider({ children }) {
  const { data, error, isLoading, mutate } = useSWR("/api/workspaces", fetcher);
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  useEffect(() => {
    if (data?.workspaces?.length > 0 && !activeWorkspace) {
      // Look for the user's currentWorkspace or default to the first one
      const stored = localStorage.getItem("selectedWorkspaceId");
      if (stored) {
        const found = data.workspaces.find((w) => w._id === stored);
        if (found) {
          setActiveWorkspace(found);
          return;
        }
      }
      setActiveWorkspace(data.workspaces[0]);
    }
  }, [data, activeWorkspace]);

  const switchWorkspace = (workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem("selectedWorkspaceId", workspace._id);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces: data?.workspaces || [],
        activeWorkspace,
        isLoading,
        error,
        switchWorkspace,
        mutateWorkspaces: mutate,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
