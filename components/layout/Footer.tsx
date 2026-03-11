import Link from "next/link";

export function Footer() {
  return (
    <footer>
      <div className="footer-links">
        <Link href="/legal/privacy">PRIVACY POLICY</Link>
        <Link href="/legal/terms">TERMS OF SERVICE</Link>
        <Link href="/contact">CONTACT</Link>
      </div>
      <p>&copy; {new Date().getFullYear()} BASKTBALL. All rights reserved.</p>
      <p className="update-note">ALL STATS UPDATED IN REAL-TIME</p>
    </footer>
  );
}

export default Footer;
