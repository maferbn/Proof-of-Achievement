import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Link2Off,
  Fingerprint,
  BadgeCheck,
  Ban,
  Search,
  Wallet,
  PenLine,
  Sparkles,
  XCircle,
  CheckCircle2,
  Gamepad2,
  GraduationCap,
  Building2,
  CalendarDays,
  Users,
  BookOpen,
  FlaskConical,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { SoulboundTag } from '../../components/web3/SoulboundTag';
import { RecipientAccessPanel } from '../../features/profile/RecipientAccessPanel';

export function LandingPage() {
  return (
    <>
      <Hero />
      <Audience />
      <Problem />
      <Solution />
      <HowItWorks />
      <Applications />
      <Comparison />
      <Verification />
      <FinalCta />
    </>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="fade-up">
          <span className="chip chip--soulbound">
            <Sparkles size={13} /> Soulbound Tokens · ERC-5192
          </span>
          <h1 className="hero__title mt-4">
            Logros que se <span className="gradient-text">ganan</span>, no se compran.
          </h1>
          <p className="hero__sub">
            Proof of Achievement emite credenciales digitales como tokens no transferibles,
            verificables por cualquiera en la blockchain. Reputación real, imposible de falsificar
            o revender.
          </p>
          <div className="hero__cta">
            <Link to="/dashboard">
              <Button size="lg" leftIcon={<Building2 size={18} />}>
                Acceso organizaciones
              </Button>
            </Link>
            <a href="#acceso">
              <Button size="lg" variant="secondary" leftIcon={<Wallet size={18} />}>
                Ver mis logros
              </Button>
            </a>
          </div>
          <div className="trust-row">
            <span className="trust-pill">
              <Link2Off size={16} /> No transferible
            </span>
            <span className="trust-pill">
              <Search size={16} /> Verificable on-chain
            </span>
            <span className="trust-pill">
              <ShieldCheck size={16} /> Revocable por el emisor
            </span>
          </div>
        </div>

        <div className="hero-card fade-up">
          <div className="hero-card__glow" />
          <Card padded={false} className="card--pad">
            <div className="hero-token">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--r-lg)',
                  background: 'var(--brand-gradient)',
                  color: '#fff',
                }}
              >
                <BadgeCheck size={34} />
              </div>
              <div className="text-strong font-semibold" style={{ fontSize: '1.1rem' }}>
                Contribuidor destacado
              </div>
              <div className="text-sm text-muted">Emitido a 0x9f…3Ab2</div>
              <SoulboundTag />
            </div>
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted">Token #1024</span>
              <span className="status status--success">
                <span className="status__dot" aria-hidden /> Verificado
              </span>
            </div>
          </Card>
          <div className="text-center mt-2">
            <span className="demo-note">
              <FlaskConical size={12} /> Ejemplo demostrativo
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Audience (person vs organization) ---------------- */
function Audience() {
  const orgItems = [
    'Crean grupos y añaden miembros por wallet',
    'Definen logros y emiten Soulbound Tokens',
    'Consultan cuántas personas recibieron cada logro',
    'Verifican transacciones y revocan emisiones',
  ];
  const personItems = [
    'Reciben logros directamente en su wallet',
    'Consultan token ID, estado y transacción',
    'Ven los grupos asociados a sus logros',
    'Demuestran públicamente sus credenciales',
  ];

  return (
    <section id="acceso" className="section container">
      <div className="section__eyebrow gradient-text">Dos formas de usar la plataforma</div>
      <h2 className="section__title">Elige tu acceso</h2>
      <div
        className="grid gap-4 mt-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}
      >
        {/* Organizations */}
        <Card padded className="flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="feature-icon" style={{ marginBottom: 0 }}>
              <Building2 size={22} />
            </span>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Soy una organización</h3>
              <p className="text-sm text-muted">Emisora de logros</p>
            </div>
          </div>
          <ul className="flex-col gap-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {orgItems.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm">
                <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <Link to="/dashboard" style={{ marginTop: 'auto' }}>
            <Button block leftIcon={<Building2 size={16} />}>
              Acceso organizaciones
            </Button>
          </Link>
          <p className="text-xs text-muted text-center">
            Acceso con firma SIWE (Sign-In with Ethereum). Gratis, sin transacción.
          </p>
        </Card>

        {/* People */}
        <Card padded className="flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="feature-icon" style={{ marginBottom: 0 }}>
              <Wallet size={22} />
            </span>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Recibí un logro</h3>
              <p className="text-sm text-muted">Persona titular</p>
            </div>
          </div>
          <ul className="flex-col gap-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {personItems.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm">
                <CheckCircle2 size={16} style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 2 }} />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <RecipientAccessPanel />
        </Card>
      </div>
    </section>
  );
}

/* ---------------- Problem ---------------- */
function Problem() {
  const items: Feature[] = [
    {
      icon: XCircle,
      title: 'Los certificados en PDF se falsifican',
      desc: 'Un diploma o captura de pantalla no prueba nada: se edita, se copia y no se puede verificar de forma independiente.',
    },
    {
      icon: Wallet,
      title: 'Los NFT se compran y se venden',
      desc: 'Un logro que se puede transferir deja de ser un logro. La reputación no debería tener precio de mercado.',
    },
    {
      icon: Search,
      title: 'La reputación vive en silos',
      desc: 'Tus logros quedan atrapados en la plataforma que los emitió, sin forma sencilla de demostrarlos en otro lugar.',
    },
  ];
  return (
    <section className="section container">
      <div className="section__eyebrow gradient-text">El problema</div>
      <h2 className="section__title">Demostrar lo que has logrado es sorprendentemente difícil</h2>
      <div className="feature-grid">
        {items.map((f) => (
          <FeatureCard key={f.title} {...f} accent="var(--danger)" />
        ))}
      </div>
    </section>
  );
}

/* ---------------- Solution ---------------- */
function Solution() {
  const items: Feature[] = [
    {
      icon: Link2Off,
      title: 'No transferible por diseño',
      desc: 'Implementamos el estándar ERC-5192: el token queda bloqueado (locked) en la wallet del receptor. No se puede enviar ni vender.',
    },
    {
      icon: Fingerprint,
      title: 'Ligado a una identidad',
      desc: 'Cada logro se asocia a una wallet concreta. Es una prueba criptográfica de que esa persona alcanzó ese hito.',
    },
    {
      icon: ShieldCheck,
      title: 'Emisión controlada',
      desc: 'Solo los emisores autorizados (con MINTER_ROLE) pueden acuñar logros, y pueden revocarlos si fuese necesario.',
    },
  ];
  return (
    <section className="section container">
      <div className="section__eyebrow gradient-text">La solución</div>
      <h2 className="section__title">
        Un <span className="gradient-text">Soulbound Token</span> por cada logro
      </h2>
      <p className="section__lead">
        Un SBT es un token que pertenece permanentemente a una identidad. Es ideal para
        credenciales: representa algo que hiciste tú y que nadie más puede reclamar.
      </p>
      <div className="feature-grid">
        {items.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */
function HowItWorks() {
  const steps = [
    {
      icon: Users,
      title: 'Crea grupos y miembros',
      desc: 'El administrador organiza a las personas en grupos (un curso, un equipo, una comunidad).',
    },
    {
      icon: BadgeCheck,
      title: 'Define logros',
      desc: 'Cada logro tiene un nombre, descripción e imagen. Es la plantilla del reconocimiento.',
    },
    {
      icon: PenLine,
      title: 'Emite el SBT',
      desc: 'Al otorgar un logro, el backend acuña el token on-chain mediante una relayer wallet autorizada.',
    },
    {
      icon: Search,
      title: 'Verifica en cadena',
      desc: 'Cualquiera puede comprobar el estado del token: confirmado, pendiente o revocado.',
    },
  ];
  return (
    <section id="como-funciona" className="section container">
      <div className="section__eyebrow gradient-text">Cómo funciona</div>
      <h2 className="section__title">De la acción al reconocimiento verificable</h2>
      <div className="steps">
        {steps.map((s, i) => (
          <Card key={s.title} padded interactive>
            <span className="step-num">{i + 1}</span>
            <div className="flex items-center gap-2 text-strong font-semibold">
              <s.icon size={17} style={{ color: 'var(--cyan)' }} />
              {s.title}
            </div>
            <p className="text-sm text-muted mt-2">{s.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Applications ---------------- */
function Applications() {
  const sectors = [
    { icon: Gamepad2, title: 'Videojuegos', desc: 'Hitos y logros in-game que el jugador conserva de por vida.' },
    { icon: GraduationCap, title: 'Universidades', desc: 'Títulos y certificaciones académicas verificables.' },
    { icon: BookOpen, title: 'Cursos', desc: 'Constancias de finalización imposibles de falsificar.' },
    { icon: Building2, title: 'Empresas', desc: 'Reconocimientos internos y credenciales profesionales.' },
    { icon: CalendarDays, title: 'Eventos', desc: 'Pruebas de asistencia y participación (POAP-style).' },
    { icon: Users, title: 'Comunidades', desc: 'Roles, contribuciones y reputación acumulada.' },
  ];
  return (
    <section id="aplicaciones" className="section container">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="section__eyebrow gradient-text" style={{ marginBottom: 0 }}>
          Aplicaciones
        </div>
        <span className="demo-note">
          <FlaskConical size={12} /> Ejemplos conceptuales de uso
        </span>
      </div>
      <h2 className="section__title mt-2">Un mismo estándar, muchos contextos</h2>
      <div className="feature-grid">
        {sectors.map((s) => (
          <FeatureCard key={s.title} icon={s.icon} title={s.title} desc={s.desc} />
        ))}
      </div>
    </section>
  );
}

/* ---------------- Comparison ---------------- */
function Comparison() {
  const sbt = [
    'No transferible: permanece en tu wallet',
    'Representa reputación e identidad',
    'No tiene valor de reventa',
    'Puede ser revocado por el emisor',
    'Prueba que TÚ lograste algo',
  ];
  const nft = [
    'Transferible: se envía y se vende',
    'Representa propiedad de un activo',
    'Valor de mercado especulativo',
    'Control total del poseedor',
    'Prueba que POSEES algo',
  ];
  return (
    <section id="sbt-vs-nft" className="section container">
      <div className="section__eyebrow gradient-text">Comparación</div>
      <h2 className="section__title">SBT vs NFT: parecidos, propósitos opuestos</h2>
      <div className="compare">
        <Card padded className="compare__col compare__col--sbt">
          <div className="flex items-center gap-2 mb-2">
            <Link2Off size={20} style={{ color: 'var(--cyan)' }} />
            <h3>Soulbound Token</h3>
          </div>
          <p className="text-sm text-muted mb-4">Para credenciales y reputación.</p>
          {sbt.map((t) => (
            <div key={t} className="compare__row">
              <CheckCircle2 size={17} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }} />
              <span>{t}</span>
            </div>
          ))}
        </Card>
        <Card padded className="compare__col">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={20} style={{ color: 'var(--text-muted)' }} />
            <h3>NFT tradicional</h3>
          </div>
          <p className="text-sm text-muted mb-4">Para activos y coleccionables.</p>
          {nft.map((t) => (
            <div key={t} className="compare__row">
              <Ban size={17} style={{ color: 'var(--text-faint)', flexShrink: 0, marginTop: 1 }} />
              <span className="text-muted">{t}</span>
            </div>
          ))}
        </Card>
      </div>
    </section>
  );
}

/* ---------------- Verification ---------------- */
function Verification() {
  return (
    <section className="section container">
      <Card padded className="fade-up" style={{ padding: 'var(--sp-6)' }}>
        <div className="grid gap-5" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <div>
            <div className="section__eyebrow gradient-text">Verificación blockchain</div>
            <h2 className="section__title">La confianza no depende de nosotros</h2>
            <p className="section__lead">
              Cada logro emitido queda registrado en un contrato inteligente público. No hace falta
              confiar en la plataforma: el estado del token —pendiente, confirmado o revocado— se
              consulta directamente en la cadena.
            </p>
            <div className="feature-grid" style={{ marginTop: 'var(--sp-5)' }}>
              <MiniStat icon={BadgeCheck} label="Confirmado" tone="var(--success)" desc="Transacción minada y verificada on-chain." />
              <MiniStat icon={Search} label="Pendiente" tone="var(--warning)" desc="A la espera de confirmación en la red." />
              <MiniStat icon={Ban} label="Revocado" tone="var(--neutral)" desc="Marcado como revocado, sin perder trazabilidad." />
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */
function FinalCta() {
  return (
    <section className="section--tight container">
      <div className="cta fade-up">
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
          Empieza a emitir logros <span className="gradient-text">verificables</span>
        </h2>
        <p className="text-muted mt-3" style={{ maxWidth: 560, marginInline: 'auto' }}>
          Conecta tu wallet, firma con Ethereum y gestiona grupos, miembros y logros desde un panel
          pensado para Web3.
        </p>
        <div className="flex justify-center gap-3 mt-5 flex-wrap">
          <Link to="/dashboard">
            <Button size="lg" leftIcon={<Building2 size={18} />}>
              Acceso organizaciones
            </Button>
          </Link>
          <a href="#acceso">
            <Button size="lg" variant="secondary" leftIcon={<Wallet size={18} />}>
              Ver mis logros
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Shared bits ---------------- */
interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

function FeatureCard({ icon: Icon, title, desc, accent }: Feature & { accent?: string }) {
  return (
    <Card padded interactive>
      <span className="feature-icon" style={accent ? { color: accent } : undefined}>
        <Icon size={22} />
      </span>
      <h3 style={{ fontSize: '1.1rem' }}>{title}</h3>
      <p className="text-sm text-muted mt-2">{desc}</p>
    </Card>
  );
}

function MiniStat({
  icon: Icon,
  label,
  desc,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  desc: string;
  tone: string;
}) {
  return (
    <div className="glass" style={{ padding: 'var(--sp-4)' }}>
      <div className="flex items-center gap-2 font-semibold text-strong">
        <Icon size={18} style={{ color: tone }} />
        {label}
      </div>
      <p className="text-sm text-muted mt-2">{desc}</p>
    </div>
  );
}
