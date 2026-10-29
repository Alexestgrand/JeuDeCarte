import { MAX_BOOSTERS } from "../game/store";
import { formatDuration } from "../lib/format";

export type Page = "home" | "archive";

interface Props {
  page: Page;
  onNavigate: (p: Page) => void;
  boosters: number;
  nextIn: number;
}

export function Header({ page, onNavigate, boosters, nextIn }: Props) {
  return (
    <header className="header">
      <button className="wordmark" onClick={() => onNavigate("home")}>
        Registre
      </button>
      <nav className="nav">
        <button className={page === "home" ? "is-active" : ""} onClick={() => onNavigate("home")}>
          Dossiers
        </button>
        <button className={page === "archive" ? "is-active" : ""} onClick={() => onNavigate("archive")}>
          Archive
        </button>
      </nav>
      <div className="header-status mono">
        <span>
          Dossiers <strong>{boosters}</strong>/{MAX_BOOSTERS}
        </span>
        {boosters < MAX_BOOSTERS && <span className="header-timer">+1 dans {formatDuration(nextIn)}</span>}
      </div>
    </header>
  );
}
