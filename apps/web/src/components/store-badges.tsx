import { IoLogoApple, IoLogoGooglePlaystore } from "react-icons/io5";

const APP_STORE_URL = "https://apps.apple.com/br/app/sintonia-party-game/id6762064623";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.bruno.wavelength";

export function StoreBadges() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <StoreBadge
        href={APP_STORE_URL}
        icon={<IoLogoApple className="text-2xl" />}
        small="Baixe na"
        big="App Store"
      />
      <StoreBadge
        href={PLAY_STORE_URL}
        icon={<IoLogoGooglePlaystore className="text-2xl" />}
        small="Disponível no"
        big="Google Play"
      />
    </div>
  );
}

function StoreBadge({
  href,
  icon,
  small,
  big,
}: {
  href: string;
  icon: React.ReactNode;
  small: string;
  big: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/15 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.08] hover:border-white/25 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
    >
      <span className="text-white">{icon}</span>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
          {small}
        </span>
        <span className="text-[15px] font-bold text-white tracking-tight">{big}</span>
      </div>
    </a>
  );
}
