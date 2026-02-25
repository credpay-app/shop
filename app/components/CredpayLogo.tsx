// Credpay logo — just the C-mark paths, no background or border.
// viewBox trimmed to the content area (987 898 → 1866 1955).

interface CredpayLogoProps {
  /** Height in pixels; width scales automatically. */
  size?: number;
  /** Colour of the mark. Defaults to Credpay lime #0BD751. */
  color?: string;
  className?: string;
}

export default function CredpayLogo({
  size = 32,
  color = "#0BD751",
  className = "",
}: CredpayLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="987 898 879 1057"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Credpay logo"
      className={className}
    >
      {/* Top horizontal bar */}
      <path
        d="M1198.24 898H1668.44L1865.76 1100.79V1320.48H1654.52V1109.24H1198.24V898Z"
        fill={color}
      />
      {/* Bottom horizontal bar */}
      <path
        d="M1198.24 1954.19H1668.44L1865.76 1751.4V1531.71H1654.52V1742.95H1198.24V1954.19Z"
        fill={color}
      />
      {/* Top-left vertical */}
      <path
        d="M987 1109.24L1198.24 1109.24L1198.24 1320.48H987V1109.24Z"
        fill={color}
      />
      {/* Bottom-left vertical */}
      <path
        d="M987 1531.71H1198.24L1198.24 1742.95L987 1742.95V1531.71Z"
        fill={color}
      />
    </svg>
  );
}
