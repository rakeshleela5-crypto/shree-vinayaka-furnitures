export interface TrustBadgeDef {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  primaryColor: string;
  secondaryColor: string;
  iconType: 'leaf' | 'hammer' | 'shield' | 'check' | 'star' | 'crown';
}

export const TRUST_BADGES: TrustBadgeDef[] = [
  {
    id: 'pure-teak',
    name: '100% Pure Teak',
    title: '100% PURE TEAK',
    subtitle: 'Seasoned Grade-A Timber',
    primaryColor: '#b45309',
    secondaryColor: '#fef3c7',
    iconType: 'leaf'
  },
  {
    id: 'warranty-assured',
    name: 'Warranty Assured',
    title: '10 YEARS WARRANTY',
    subtitle: 'Structural Guarantee',
    primaryColor: '#047857',
    secondaryColor: '#d1fae5',
    iconType: 'shield'
  },
  {
    id: 'custom-made',
    name: 'Custom Made',
    title: 'HANDCRAFTED LUXURY',
    subtitle: 'Artisan Custom Build',
    primaryColor: '#4338ca',
    secondaryColor: '#e0e7ff',
    iconType: 'hammer'
  },
  {
    id: 'godrej-interio',
    name: 'Godrej Authorized',
    title: 'GODREJ INTERIO',
    subtitle: 'Certified Store Partner',
    primaryColor: '#b91c1c',
    secondaryColor: '#fee2e2',
    iconType: 'crown'
  },
  {
    id: 'termite-resistant',
    name: 'Termite Resistant',
    title: 'TERMITE RESISTANT',
    subtitle: 'Pressure Vacuum Treated',
    primaryColor: '#0f766e',
    secondaryColor: '#ccfbf1',
    iconType: 'shield'
  },
  {
    id: 'solid-sheesham',
    name: '100% Solid Sheesham',
    title: 'SOLID SHEESHAM WOOD',
    subtitle: 'Authentic Rosewood Grain',
    primaryColor: '#78350f',
    secondaryColor: '#fef3c7',
    iconType: 'star'
  }
];

export function renderBadgeSvg(badge: TrustBadgeDef, width: number, height: number): string {
  const iconPaths: Record<string, string> = {
    leaf: 'M12 2L4.5 9.5C3.5 10.5 3 11.8 3 13.2C3 16.4 5.6 19 8.8 19C10.2 19 11.5 18.5 12.5 17.5L13.5 16.5M12 2C16 6 18 10 18 14C18 17.3 15.3 20 12 20',
    shield: 'M12 2L3 7V12C3 17.5 6.8 22.7 12 24C17.2 22.7 21 17.5 21 12V7L12 2Z',
    hammer: 'M15 2L18 5L9 14L6 11L15 2ZM5 15L2 18L6 22L9 19L5 15Z',
    check: 'M5 13L9 17L19 7',
    star: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z',
    crown: 'M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z'
  };

  const path = iconPaths[badge.iconType] || iconPaths.shield;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="${width}" height="${height}" style="display:block;">
      <rect x="2" y="2" width="196" height="56" rx="6" fill="${badge.secondaryColor}" stroke="${badge.primaryColor}" stroke-width="2" />
      <circle cx="28" cy="30" r="18" fill="${badge.primaryColor}" />
      <g transform="translate(18, 20) scale(0.8)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="${path}" />
      </g>
      <text x="54" y="26" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="900" fill="${badge.primaryColor}" letter-spacing="0.5">${badge.title}</text>
      <text x="54" y="42" font-family="'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="700" fill="#334155">${badge.subtitle}</text>
    </svg>
  `;
}
