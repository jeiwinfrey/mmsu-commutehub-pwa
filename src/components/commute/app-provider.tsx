"use client";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { MotionConfig } from "motion/react";
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/onboarding"
      signUpFallbackRedirectUrl="/onboarding"
      localization={{
        signIn: {
          start: {
            title: "Sign in to CommuteHub",
            subtitle: "Your commute starts here.",
          },
        },
        signUp: {
          start: {
            title: "Join CommuteHub",
            subtitle: "Make your trip to class a little easier.",
          },
        },
      }}
      appearance={{
        variables: {
          colorPrimary: "#163d2c",
          borderRadius: "1rem",
          fontFamily: "Arial, sans-serif",
        },
        elements: {
          card: "shadow-none border border-border",
          cardBox: "shadow-none",
          socialButtonsBlockButton: "min-h-12",
          formButtonPrimary: "min-h-12 shadow-none",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
