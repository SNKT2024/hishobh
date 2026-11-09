import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";

export default async function SignUpPage() {
  const { userId } = await auth();

  // If already authenticated, redirect to dashboard immediately
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full flex justify-center py-8">
      <SignUp
        routing="path"
        path="/sign-up"
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
