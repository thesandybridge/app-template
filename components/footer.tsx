export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border/50 border-t py-6">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="text-muted-foreground text-center text-sm">
          &copy; {year} {{project_name}}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
