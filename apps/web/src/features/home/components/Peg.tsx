/** A clothes peg seen from the front: one flat leg, with only the spring's wire ends showing at the sides. */
export function Peg({ color, className }: { color: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 62"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M18.5 5.5 Q24.5 5.5 24.5 10 V24 H18.5Z"
        fill="#00000030"
        stroke="#17171C"
        strokeWidth="1.8"
      />
      <path
        d="M8.5 9 Q8.5 3.5 13.5 3.5 H19 Q23.5 3.5 23.5 8 V53 Q23.5 59 18.5 59 H13.5 Q8.5 59 8.5 53Z"
        fill={color}
        stroke="#17171C"
        strokeWidth="1.9"
      />
      <path d="M12 9 V20 M12 36 V50" stroke="#fff" strokeWidth="1.5" opacity=".5" />
      <path
        d="M12.5 11.5 H19.5 M12.5 15.5 H19.5"
        stroke="#17171C"
        strokeWidth="1.2"
        opacity=".35"
      />
      <path d="M8.5 25.5 H23.5" stroke="#17171C" strokeWidth="2.4" />
      <path d="M12.5 54 H19.5" stroke="#17171C" strokeWidth="1.4" opacity=".55" />
      <g stroke="#17171C" strokeWidth="3.4">
        <path d="M8.5 24 Q2.2 22.5 2.6 26.2 Q3 29.4 8.5 28" />
        <path d="M23.5 24 Q29.8 22.5 29.4 26.2 Q29 29.4 23.5 28" />
      </g>
      <g stroke="#B9BAC6" strokeWidth="1.6">
        <path d="M8.5 24 Q2.2 22.5 2.6 26.2 Q3 29.4 8.5 28" />
        <path d="M23.5 24 Q29.8 22.5 29.4 26.2 Q29 29.4 23.5 28" />
      </g>
    </svg>
  );
}

/** Peg colours cycle along the line (same palette as the avatars). */
export const PEG_COLORS = ["#FFD23F", "#DC7856", "#8B8BE0", "#9FB783"] as const;
