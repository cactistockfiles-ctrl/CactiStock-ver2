"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";
import { useState } from "react";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Data is stale immediately
            gcTime: 0, // Garbage collect cache immediately
            refetchOnWindowFocus: true, // Refetch when window regains focus
            refetchOnMount: true, // Refetch when component mounts
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            {children}
          </CartProvider>
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
