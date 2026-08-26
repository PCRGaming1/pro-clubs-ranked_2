import NewSquadForm from "./NewSquadForm";

export const dynamic = "force-dynamic";

export default function NewSquadPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-1">Create a squad</h1>
      <p className="text-sm text-[var(--pcr-muted)] mb-6">
        You&apos;ll be the captain. For now, each player can belong to one
        squad — see the README for why that&apos;s a known limitation.
      </p>
      <NewSquadForm />
    </div>
  );
}
