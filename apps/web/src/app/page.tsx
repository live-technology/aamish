import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Phone } from "lucide-react";
import { MealRequestForm } from "@/components/meal-request-form";
import styles from "@/components/landing.module.css";

export const metadata: Metadata = {
  title: "Aamish | Meals that feel like from home.",
  description: "Meals that feel like from home. Corporate meals, banquet meals, and bulk home orders by Aamish. Tell us what you have in mind.",
  robots: { index: false, follow: false },
};

const offerings = [
  { number: "01", name: "Corporate meals", note: "A LUNCH BREAK TO LOOK FORWARD TO", description: "A familiar, comforting meal in the middle of a busy day. Let’s put something good on your team’s table.", ingredient: "tomato" },
  { number: "02", name: "Banquet meals", note: "BIG DAYS. FULL HEARTS. FULL PLATES.", description: "For the celebrations that bring everyone together. A generous spread, made for your kind of occasion.", ingredient: "onion" },
  { number: "03", name: "Bulk home orders", note: "MORE PEOPLE. MORE TO PASS AROUND.", description: "When your home becomes the gathering place. Welcome your favourite people, and leave the cooking to us.", ingredient: "garlic" },
];

function Ingredient({ name, className }: { name: string; className?: string }) {
  return <Image src={`/brand/ingredients/${name}.svg`} alt="" aria-hidden="true" width={254} height={194} className={className} unoptimized />;
}

export default function Home() {
  return <div className={styles.page}>
    <a className={styles.skip} href="#main">Skip to content</a>
    <header className={styles.header}>
      <Link href="/" aria-label="Aamish home"><Image src="/brand/amish-logo-01.png" alt="Aamish" width={150} height={65} priority /></Link>
      <nav aria-label="Main navigation"><a href="#offerings">What we serve</a><a href="#request">Tell us your plans</a></nav>
      <Link href="/login" className={styles.signIn}>Sign in <ArrowUpRight size={17} aria-hidden="true" /></Link>
    </header>
    <main id="main">
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroIngredients} aria-hidden="true"><Ingredient name="onion" className={styles.heroOnion} /><Ingredient name="chilli" className={styles.heroChilli} /><Ingredient name="tomato" className={styles.heroTomato} /><Ingredient name="garlic" className={styles.heroGarlic} /></div>
        <p className={styles.eyebrow}>A LITTLE COMFORT. A LOT OF FLAVOUR.</p>
        <h1 id="hero-title">Meals that feel<br />like from <em>home.</em></h1>
        <p className={styles.heroDescription}>The comfort of a familiar meal.<br />For your workdays, your big days, and your people.</p>
        <a className={styles.cta} href="#request">Let’s talk food <span><ArrowUpRight size={21} aria-hidden="true" /></span></a>
        <a className={styles.explore} href="#offerings"><ArrowDown size={17} aria-hidden="true" /> A little taste of what we do</a>
        <span className={styles.sideNote}>WITH LOVE, AAMISH</span>
      </section>
      <div className={styles.ribbon} aria-hidden="true"><span>Familiar flavours.</span><span>✳</span><em>Fuller tables.</em><span>✳</span><span>Happier gatherings.</span><span>✳</span></div>
      <section id="offerings" className={styles.offerings} aria-labelledby="offering-title">
        <div className={styles.sectionIntro}><div><p className={styles.eyebrow}>SAME WARMTH. DIFFERENT TABLES.</p><h2 id="offering-title">There’s always<br /><em>room for more.</em></h2></div><p>A table at work. A hall full of guests.<br />A home full of your favourite people.<br />We make meals for all of them.</p></div>
        <div className={styles.serviceList}>{offerings.map(service => <a href="#request" className={styles.service} key={service.number} aria-label={`Enquire about ${service.name.toLowerCase()}`}>
          <span className={styles.serviceNumber}>{service.number}</span><div className={styles.serviceName}><p className={styles.eyebrow}>{service.note}</p><h3>{service.name}</h3></div><Ingredient name={service.ingredient} className={styles.serviceIngredient} /><p className={styles.serviceDescription}>{service.description}</p><span className={styles.serviceArrow}><ArrowUpRight size={24} aria-hidden="true" /></span>
        </a>)}</div>
        <div className={styles.serviceFootnote}><Ingredient name="chilli" /><p>However many plates, it starts with a conversation.<br /><a href="#request">Tell us what you have in mind. <ArrowUpRight size={15} aria-hidden="true" /></a></p></div>
      </section>
      <section id="request" className={styles.requestSection} aria-labelledby="request-title">
        <div className={styles.requestInner}><div className={styles.requestCopy}><p className={styles.eyebrow}>A NOTE TO AAMISH</p><h2 id="request-title">Something<br />good is<br /><em>cooking.</em></h2><p>Tell us about your plans.<br />A few words or a voice note is all it takes.<br />Our team will get in touch with you.</p><div className={styles.callUs}><span>Or, say hello the old-fashioned way.</span><a href="tel:+8801335114515"><Phone size={19} aria-hidden="true" /> 01335-114515 <ArrowUpRight size={19} aria-hidden="true" /></a></div></div><MealRequestForm /></div>
      </section>
    </main>
    <footer className={styles.footer}><div className={styles.footerHeadline}><p>Come hungry.<br /><em>Feel at home.</em></p><Ingredient name="tomato" /></div><div className={styles.footerBottom}><Link href="/" aria-label="Aamish home"><Image src="/brand/amish-logo-01.png" alt="Aamish" width={130} height={57} /></Link><span>© {new Date().getFullYear()} Aamish</span><a href="tel:+8801335114515">01335-114515</a><a href="https://www.facebook.com/profile.php?id=61591630644571" target="_blank" rel="noopener noreferrer">Find us on Facebook <ArrowUpRight size={17} aria-hidden="true" /></a></div></footer>
  </div>;
}
