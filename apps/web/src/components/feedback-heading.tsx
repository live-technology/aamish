import Image from "next/image";
import styles from "./feedback-heading.module.css";

export function FeedbackHeading({ enterpriseName, logoUrl, showAamish = true }: { enterpriseName: string; logoUrl?: string | null; showAamish?: boolean }) {
  const Heading = showAamish ? "h1" : "h2";
  return <header className={styles.heading}>
    {showAamish && <Image className={styles.aamishLogo} src="/brand/amish-logo-01.png" alt="Aamish" width={150} height={65} priority />}
    <div className={styles.enterprise}>
      {logoUrl && <Image className={styles.enterpriseLogo} src={logoUrl} alt={`${enterpriseName} logo`} width={72} height={72} />}
      <p className={styles.enterpriseName}>{enterpriseName}</p>
    </div>
    <Heading>Tell us how we did, we’re listening</Heading>
  </header>;
}
