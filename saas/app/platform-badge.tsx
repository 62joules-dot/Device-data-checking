import { PLATFORM_META, platformIconUrl } from "@/lib/platforms";

export default function PlatformBadge({ platform }: { platform: string }) {
  const meta = PLATFORM_META[platform] ?? { label: platform, domain: null };
  return (
    <span className="inline-flex items-center gap-1.5">
      {meta.domain && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={platformIconUrl(meta.domain)}
          alt=""
          width={16}
          height={16}
          className="rounded-sm"
        />
      )}
      <span>{meta.label}</span>
    </span>
  );
}
