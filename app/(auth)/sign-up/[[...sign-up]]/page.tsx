import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="w-full flex justify-center py-8">
      <SignUp
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
