import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
export default function Page(){return <Suspense><div className="phone-shell flex min-h-dvh items-center justify-center p-4"><SignUp routing="path" path="/sign-up" /></div></Suspense>;}
