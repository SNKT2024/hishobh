import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="w-full flex justify-center py-8">
      <SignIn
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
