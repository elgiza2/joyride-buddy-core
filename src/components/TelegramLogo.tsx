/** The official Telegram mark, drawn inline so it always loads. */
export function TelegramLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      aria-hidden
      className="shrink-0 rounded-full"
    >
      <defs>
        <linearGradient id="tg-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2AABEE" />
          <stop offset="1" stopColor="#229ED9" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="120" fill="url(#tg-grad)" />
      <path
        fill="#fff"
        d="M54 118.5c35-15.3 58.3-25.3 70-30.2 33.3-13.9 40.2-16.3 44.7-16.4 1 0 3.2.2 4.7 1.4 1.2 1 1.5 2.4 1.7 3.4.2 1 .4 3.2.2 5-1.8 19-9.6 65.2-13.6 86.5-1.7 9-5 12.1-8.3 12.4-7 .6-12.4-4.6-19.2-9.1-10.7-7-16.7-11.4-27.1-18.2-12-7.9-4.2-12.2 2.6-19.3 1.8-1.9 32.7-30 33.3-32.5.1-.3.1-1.5-.6-2.1-.7-.6-1.7-.4-2.5-.2-1.1.2-18 11.4-50.8 33.6-4.8 3.3-9.2 4.9-13.1 4.8-4.3-.1-12.6-2.4-18.8-4.4-7.6-2.5-13.6-3.8-13.1-8 .3-2.2 3.3-4.4 9-6.7Z"
      />
    </svg>
  );
}
