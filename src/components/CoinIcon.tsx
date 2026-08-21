import gramCoin from "@/assets/gram-coin.png";

type Props = { size?: number; className?: string };

export function GramIcon({ size = 20, className = "" }: Props) {
  return (
    <img
      src={gramCoin}
      alt="GRAM coin"
      width={size}
      height={size}
      loading="lazy"
      style={{ width: size, height: size }}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

export function UsdtIcon({ size = 20, className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 56 56"
      width={size}
      height={size}
      role="img"
      aria-label="USDT coin"
      className={`shrink-0 ${className}`}
    >
      <circle cx="28" cy="28" r="28" fill="#26A17B" />
      <path
        d="M31.3 25.4v-3.6h8.2v-5.5H16.5v5.5h8.2v3.6c-6.7.3-11.7 1.6-11.7 3.2s5 2.9 11.7 3.2v11.5h6.6V31.8c6.7-.3 11.7-1.6 11.7-3.2s-5-2.9-11.7-3.2Zm0 5.3c-.2 0-1.2.1-3.3.1-1.7 0-2.9 0-3.3-.1-6.4-.3-11.2-1.4-11.2-2.7s4.8-2.4 11.2-2.7v4.3c.4 0 1.7.1 3.4.1 2 0 3.1-.1 3.2-.1v-4.3c6.4.3 11.2 1.4 11.2 2.7s-4.8 2.4-11.2 2.7Z"
        fill="#fff"
      />
    </svg>
  );
}

export function MusicIcon({ size = 20, className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 56 56"
      width={size}
      height={size}
      role="img"
      aria-label="MUSIC coin"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="musicCoinGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C5CFF" />
          <stop offset="100%" stopColor="#2C7DFF" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r="28" fill="url(#musicCoinGrad)" />
      <path
        d="M36 14.5 24.4 17c-1 .2-1.7 1.1-1.7 2.1v14.3a6.2 6.2 0 1 0 3.4 5.5V24.4l10.6-2.3v7.6a6.2 6.2 0 1 0 3.4 5.5V16.6c0-1.4-1.3-2.4-2.6-2.1Z"
        fill="#fff"
      />
    </svg>
  );
}

export function CoinIcon({ id, size = 20, className = "" }: Props & { id: string }) {
  if (id === "usdt") return <UsdtIcon size={size} className={className} />;
  if (id === "music") return <MusicIcon size={size} className={className} />;
  return <GramIcon size={size} className={className} />;
}
