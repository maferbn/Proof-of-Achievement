import { Link2Off } from 'lucide-react';

/** Marks a token as a non-transferable Soulbound Token (ERC-5192). */
export function SoulboundTag({ label = 'Soulbound · No transferible' }: { label?: string }) {
  return (
    <span className="chip chip--soulbound" title="Token no transferible (ERC-5192)">
      <Link2Off size={13} aria-hidden />
      {label}
    </span>
  );
}
