"use client";
import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import { motion } from "motion/react";
export function AuthScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="feature-stack"
    >
      <div className="hero-panel">
        <p className="eyebrow">MMSU COMMUTEHUB</p>
        <h1>
          A better way
          <br />
          to get to class.
        </h1>
        <p>Find your route. Plan your time. Travel together.</p>
      </div>
      <Suspense>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      </Suspense>
      <p className="text-xs text-muted-foreground">
        Vehicle locations and operations are simulated. CommuteHub does not
        reserve seats or sell tickets.
      </p>
    </motion.div>
  );
}
