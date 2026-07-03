import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service - ReelSnap</title>
        <meta name="description" content="Terms of Service for ReelSnap - Instagram Video Downloader. Read our terms before using the service." />
        <link rel="canonical" href="https://reelsnap.app/terms-of-service" />
      </Head>
      <Navbar />
      <main className="legal-page">
        <div className="legal-container">
          <h1>Terms of Service</h1>
          <p className="legal-date">Last updated: July 1, 2026</p>

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using ReelSnap (reelsnap.app), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.</p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>ReelSnap is a free online tool that allows users to download publicly available Instagram videos, Reels, Stories, and Photos. Our Service acts as a technical utility and does not host, store, or distribute any media content.</p>
          </section>

          <section>
            <h2>3. Acceptable Use</h2>
            <p>You agree to use ReelSnap only for lawful purposes. You must not:</p>
            <ul>
              <li>Download content that infringes on intellectual property rights</li>
              <li>Use downloaded content for commercial purposes without proper authorization</li>
              <li>Download private or restricted content without the owner's permission</li>
              <li>Use our Service to harass, abuse, or harm others</li>
              <li>Attempt to reverse engineer or disrupt our Service</li>
              <li>Use automated bots or scrapers to access our Service</li>
            </ul>
          </section>

          <section>
            <h2>4. Intellectual Property</h2>
            <p>ReelSnap only supports downloading publicly accessible content. Users are solely responsible for ensuring they have the right to download and use any content. We do not condone copyright infringement. Downloaded content should be used for personal, non-commercial purposes only, unless you have explicit permission from the content owner.</p>
          </section>

          <section>
            <h2>5. Disclaimer of Warranties</h2>
            <p>ReelSnap is provided "as is" without any warranties, express or implied. We do not guarantee that:</p>
            <ul>
              <li>The Service will be available at all times</li>
              <li>Downloads will always be successful</li>
              <li>The Service will be free from errors or bugs</li>
            </ul>
            <p>Instagram may change their platform at any time, which could affect our Service's functionality.</p>
          </section>

          <section>
            <h2>6. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, ReelSnap and its operators shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of or inability to use the Service.</p>
          </section>

          <section>
            <h2>7. Third-Party Services</h2>
            <p>Our Service is not affiliated with, endorsed by, or sponsored by Instagram or Meta Platforms, Inc. Instagram™ is a trademark of Meta Platforms, Inc.</p>
          </section>

          <section>
            <h2>8. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Service after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2>9. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms shall be resolved through good-faith negotiation.</p>
          </section>

          <section>
            <h2>10. Contact Us</h2>
            <p>If you have questions about these Terms, please contact us at: <a href="/contact">reelsnap.app/contact</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}