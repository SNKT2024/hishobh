import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background text-foreground">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <HelpCircle className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Page Not Found</h1>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link href="/dashboard">
        <Button className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}

