import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";

export default async function SignInPage() {
  const { userId } = await auth();

  // If already authenticated, redirect to dashboard immediately
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full flex justify-center py-8">
      <SignIn
        routing="path"
        path="/sign-in"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "w-full mx-auto",
            card: "shadow-lg border border-border rounded-2xl",
          },
        }}
      />
    </div>
  );
}
