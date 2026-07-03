import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - ReelSnap</title>
        <meta name="description" content="Privacy Policy for ReelSnap - Instagram Video Downloader. Learn how we handle your data." />
        <link rel="canonical" href="https://reelsnap.app/privacy-policy" />
      </Head>
      <Navbar />
      <main className="legal-page">
        <div className="legal-container">
          <h1>Privacy Policy</h1>
          <p className="legal-date">Last updated: July 1, 2026</p>

          <section>
            <h2>1. Introduction</h2>
            <p>Welcome to ReelSnap ("we", "our", or "us"). We operate the website reelsnap.app (the "Service"). This Privacy Policy explains how we collect, use, and protect your information when you use our Service.</p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <p>We do not require you to create an account or provide personal information to use ReelSnap. However, we may automatically collect:</p>
            <ul>
              <li>Browser type and version</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
              <li>General geographic location (country/city level)</li>
            </ul>
            <p>We do <strong>not</strong> collect or store the Instagram URLs you paste into our tool. All processing is done in real-time and no URL data is saved on our servers.</p>
          </section>

          <section>
            <h2>3. Cookies</h2>
            <p>We use cookies and similar tracking technologies to improve your experience. These include:</p>
            <ul>
              <li><strong>Analytics cookies:</strong> To understand how visitors interact with our website (via Google Analytics)</li>
              <li><strong>Advertising cookies:</strong> To serve relevant ads (via Google AdSense)</li>
            </ul>
            <p>You can control cookies through your browser settings. Disabling cookies may affect some features of our Service.</p>
          </section>

          <section>
            <h2>4. Google AdSense & Analytics</h2>
            <p>We use Google AdSense to display advertisements and Google Analytics to analyze website traffic. Google may use cookies to personalize ads based on your browsing history. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google Ad Settings</a>.</p>
          </section>

          <section>
            <h2>5. Third-Party Services</h2>
            <p>Our Service uses third-party APIs to process video downloads. These services operate under their own privacy policies. We do not share your personal data with these services beyond what is necessary to provide the download functionality.</p>
          </section>

          <section>
            <h2>6. Data Security</h2>
            <p>We implement industry-standard security measures to protect your information. However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security of your data.</p>
          </section>

          <section>
            <h2>7. Children's Privacy</h2>
            <p>Our Service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us.</p>
          </section>

          <section>
            <h2>8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of changes by updating the "Last updated" date at the top of this page. Continued use of our Service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2>9. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at: <a href="/contact">reelsnap.app/contact</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}