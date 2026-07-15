import { Link } from 'react-router-dom'

function PrivacyPolicy() {
  return (
    <section className="panel legal-panel" aria-labelledby="privacy-title">
      <h1 id="privacy-title">Privacy Policy</h1>
      <p className="legal-effective">
        <strong>Effective date:</strong> July 15, 2026
      </p>
      <p>
        SEXSOCIALIZATION.COM (&quot;we,&quot; &quot;us,&quot; or &quot;the platform&quot;) is a
        privacy-conscious relationship communication application for consenting adults 18 and older.
        This policy explains what data we collect, why, how we protect it, and what rights you have.
      </p>

      <h2>1. Information we collect</h2>

      <h3>1.1 Account information</h3>
      <p>When you create an account we collect:</p>
      <ul>
        <li>
          <strong>Email address</strong> — used for authentication, verification codes, and partner
          invitations.
        </li>
        <li>
          <strong>Display name</strong> — shown to your partner and community circle members.
        </li>
        <li>
          <strong>Password</strong> — stored only as a cryptographic hash (PBKDF2-SHA256, 310 000
          iterations). We never store or log your plain-text password.
        </li>
      </ul>

      <h3>1.2 Optional profile information</h3>
      <ul>
        <li>
          <strong>Gender</strong> — used to determine eligibility for gender-restricted community
          circles.
        </li>
        <li>
          <strong>Region</strong> — used for the circle member region filter.
        </li>
        <li>
          <strong>Avatar image</strong> — stored on Vercel Blob (CDN-backed file storage).
        </li>
      </ul>

      <h3>1.3 User-generated content</h3>
      <ul>
        <li>
          <strong>Agreement drafts</strong> — boundary preferences you create with your partner.
        </li>
        <li>
          <strong>Private messages</strong> — partner-to-partner messages stored in our database.
        </li>
        <li>
          <strong>Moderation reports</strong> — safety reports you submit.
        </li>
      </ul>

      <h3>1.4 Automatic information</h3>
      <p>
        We use Vercel Analytics and Speed Insights to collect anonymous, aggregated performance
        metrics (page load times, visitor counts). These tools do not use cookies and do not
        collect personally identifiable information.
      </p>

      <h2>2. How we use your information</h2>
      <ul>
        <li>Authenticate your identity and maintain your session.</li>
        <li>Deliver partner invitations by email or SMS (via Resend and Twilio).</li>
        <li>Enable private messaging and video calls between connected partners.</li>
        <li>Enforce community circle access based on gender.</li>
        <li>Process and respond to moderation reports.</li>
        <li>Improve platform performance and reliability.</li>
      </ul>
      <p>
        We do <strong>not</strong> sell, rent, or share your personal data with advertisers or
        data brokers.
      </p>

      <h2>3. Third-party services</h2>
      <p>We use the following third-party services to operate the platform:</p>
      <ul>
        <li>
          <strong>Vercel</strong> — hosting, serverless functions, file storage (Blob), analytics.
        </li>
        <li>
          <strong>Neon</strong> — managed Postgres database.
        </li>
        <li>
          <strong>Resend</strong> — transactional email delivery (verification codes).
        </li>
        <li>
          <strong>Twilio</strong> — SMS delivery for partner invitations.
        </li>
        <li>
          <strong>Daily.co</strong> — WebRTC video and voice call rooms.
        </li>
      </ul>
      <p>
        Each provider processes data only as necessary to deliver their service. We encourage you
        to review their respective privacy policies.
      </p>

      <h2>4. Data security</h2>
      <ul>
        <li>All connections are encrypted with TLS (HTTPS enforced via HSTS).</li>
        <li>Passwords are hashed with PBKDF2-SHA256 (310 000 iterations, random salt).</li>
        <li>Session tokens are HMAC-signed and stored as HTTP-only, Secure cookies.</li>
        <li>Invite tokens and verification codes are hashed (SHA-256) before storage.</li>
        <li>
          Content Security Policy headers restrict script execution, framing, and network
          connections.
        </li>
        <li>Camera and microphone access is restricted to the app origin.</li>
      </ul>

      <h2>5. Data retention</h2>
      <ul>
        <li>
          <strong>Sessions</strong> expire after 14 days.
        </li>
        <li>
          <strong>Partner invites</strong> expire after 7 days.
        </li>
        <li>
          <strong>Verification codes</strong> expire after 10 minutes.
        </li>
        <li>
          <strong>Account data</strong> (profile, messages, agreements) is retained until you
          request deletion.
        </li>
      </ul>

      <h2>6. Cookies</h2>
      <p>We use a single cookie:</p>
      <ul>
        <li>
          <code>sexsocialization_session</code> — an HTTP-only, Secure, SameSite=Lax session cookie.
          It contains a random token used to authenticate your session. It is not accessible to
          JavaScript and is not used for tracking or advertising.
        </li>
      </ul>
      <p>
        The age verification gate uses <code>sessionStorage</code> (not a cookie) and is cleared
        when you close your browser tab.
      </p>

      <h2>7. Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>
          <strong>Access</strong> your data — view your profile, messages, and agreements in the
          dashboard.
        </li>
        <li>
          <strong>Correct</strong> your data — update your display name, gender, region, or avatar.
        </li>
        <li>
          <strong>Delete</strong> your data — request account deletion by contacting us.
        </li>
        <li>
          <strong>Withdraw consent</strong> — remove any accepted boundary item at any time, leave
          community circles, or request account deletion.
        </li>
      </ul>

      <h2>8. Children</h2>
      <p>
        This platform is exclusively for adults aged 18 and older. We do not knowingly collect
        information from anyone under 18. If we learn that a user is under 18, their account
        will be terminated and their data deleted.
      </p>

      <h2>9. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be communicated through
        the platform. The effective date at the top of this page reflects the most recent revision.
      </p>

      <h2>10. Contact</h2>
      <p>
        For privacy questions, data requests, or concerns, contact us at{' '}
        <a href="mailto:privacy@sexsocialization.com">privacy@sexsocialization.com</a>.
      </p>

      <p className="legal-nav">
        <Link to="/terms">Terms of Service</Link> | <Link to="/">Back to Home</Link>
      </p>
    </section>
  )
}

export default PrivacyPolicy
