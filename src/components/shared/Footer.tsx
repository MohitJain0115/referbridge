import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t bg-secondary">
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ReferBridge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
