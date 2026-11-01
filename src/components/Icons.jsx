const Svg = ({ children, size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {children}
  </svg>
)

export const MapIcon = (p) => (
  <Svg {...p}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" /></Svg>
)
export const BrainIcon = (p) => (
  <Svg {...p}>
    <path d="M9.5 3A2.5 2.5 0 0 0 7 5.5v.2A3 3 0 0 0 4.5 9a3 3 0 0 0 .4 4.6A3 3 0 0 0 7 18.5 2.5 2.5 0 0 0 12 19V5.5A2.5 2.5 0 0 0 9.5 3Z" />
    <path d="M14.5 3A2.5 2.5 0 0 1 17 5.5v.2A3 3 0 0 1 19.5 9a3 3 0 0 1-.4 4.6 3 3 0 0 1-2.1 4.9A2.5 2.5 0 0 1 12 19" />
  </Svg>
)
export const BookIcon = (p) => (
  <Svg {...p}><path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5A2.5 2.5 0 0 0 4 21.5v-2Z" /><path d="M8 7h8M8 11h6" /></Svg>
)
export const UserIcon = (p) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>
)
export const BackIcon = (p) => <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>
export const ArrowIcon = (p) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
export const CloseIcon = (p) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>
export const CheckIcon = (p) => <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>
export const LockIcon = (p) => (
  <Svg {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>
)
export const StarIcon = ({ filled, ...p }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z" />
  </Svg>
)
export const FlameIcon = (p) => (
  <Svg {...p}><path d="M12 22c4 0 7-2.7 7-6.8 0-3.6-2.5-6-4.2-8.2-.4 2-1.5 3.2-2.8 3.7C12.6 7.5 11 4.5 8.5 2.5 8.7 6 5 8.7 5 14.7 5 19.2 8 22 12 22Z" /></Svg>
)
export const BoltIcon = (p) => <Svg {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></Svg>
export const ExternalIcon = (p) => (
  <Svg {...p}><path d="M14 4h6v6M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></Svg>
)
