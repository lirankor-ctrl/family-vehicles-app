import { useNavigate } from 'react-router-dom';

interface LinkDef {
  title:       string;
  description: string;
  url:         string;
  icon:        string;
}

/** Modular — add a new object here to add a link card. */
const LINKS: LinkDef[] = [
  {
    title: 'כביש 6',
    description: 'כביש האגרה הארצי — תשלומים, חשבוניות ומנוי',
    url: 'https://www.kvish6.co.il/',
    icon: '🛣️',
  },
  {
    title: 'מנהרות הכרמל',
    description: 'מעבר מהיר בחיפה — תשלום ומנוי',
    url: 'https://www.carmeltunnels.co.il/',
    icon: '🚇',
  },
  {
    title: 'פנגו',
    description: 'תשלום על חניה ומנויים בעיר',
    url: 'https://www.pango.co.il/',
    icon: '🅿️',
  },
  {
    title: 'הנתיב המהיר',
    description: 'נתיב מהיר לכניסה לתל אביב (כביש 1)',
    url: 'https://fastlane.co.il/',
    icon: '⚡',
  },
  {
    title: 'משרד התחבורה',
    description: 'רישוי, מבחני רכב ושירותים ממשלתיים',
    url: 'https://www.gov.il/he/departments/ministry_of_transport_and_road_safety',
    icon: '🏛️',
  },
];

export default function LinksPage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="topbar">
        <div className="topbar-start">
          <button className="back-btn" onClick={() => navigate('/')} aria-label="חזרה למסך פתיחה">→</button>
          <img src="/app-logo.png" alt="" className="topbar-logo" aria-hidden="true" />
          <span className="topbar-title">🔗 קישורים</span>
        </div>
      </div>

      <div className="content">
        <p style={{ color: 'var(--purple-200)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 16 }}>
          קישורים שימושיים לשירותי תחבורה, אגרה וחניה.
        </p>

        <div className="links-list">
          {LINKS.map(link => (
            <div className="link-card" key={link.url}>
              <span className="link-icon" aria-hidden="true">{link.icon}</span>
              <div className="link-body">
                <div className="link-title">{link.title}</div>
                <div className="link-desc">{link.description}</div>
              </div>
              <a
                className="btn btn-primary btn-sm link-open"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                פתח אתר
              </a>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
