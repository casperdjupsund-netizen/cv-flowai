import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
  head: () => ({ meta: [{ title: "Tilaus vahvistettu — CVFlow" }] }),
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold">Kiitos tilauksesta!</h1>
        <p className="mt-3 text-muted-foreground">
          {session_id
            ? "Pro-tilauksesi on nyt aktiivinen. Voit luoda rajattomasti dokumentteja."
            : "Tilauksen tila päivittyy hetken kuluessa."}
        </p>
        <Button asChild className="mt-8">
          <Link to="/dashboard">Siirry hallintapaneeliin</Link>
        </Button>
      </div>
    </div>
  );
}
