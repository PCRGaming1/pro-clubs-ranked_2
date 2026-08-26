"use client";

import { useActionState } from "react";
import { createSquad, type CreateSquadState } from "./actions";
import { PLATFORMS, REGIONS } from "@/lib/constants";
import { inputClass, labelClass, primaryButtonClass, errorTextClass } from "@/components/form";

const initialState: CreateSquadState = { error: null };

export default function NewSquadForm() {
  const [state, formAction, pending] = useActionState(createSquad, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="name">
          Squad name
        </label>
        <input id="name" name="name" type="text" required minLength={3} maxLength={40} className={inputClass} placeholder="e.g. Riverside Ballers" />
      </div>

      <div>
        <label className={labelClass} htmlFor="platform">
          Platform
        </label>
        <select id="platform" name="platform" required className={inputClass}>
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="region">
          Region
        </label>
        <select id="region" name="region" required className={inputClass}>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {state.error && <p className={errorTextClass}>{state.error}</p>}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Creating…" : "Create squad"}
      </button>
    </form>
  );
}
