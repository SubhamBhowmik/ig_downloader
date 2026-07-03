import Head from 'next/head'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useState } from 'react'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Opens default mail client with pre-filled email
    const subject = encodeURIComponent(`ReelSnap Contact: ${form.name}`)
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`)
    window.location.href = `mailto:contact@reelsnap.app?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  return (
    <>
      <Head>
        <title>Contact Us - ReelSnap</title>
        <meta name="description" content="Contact ReelSnap team for support, feedback, or DMCA requests." />
        <link rel="canonical" href="https://reelsnap.app/contact" />
      </Head>
      <Navbar />
      <main className="legal-page">
        <div className="legal-container">
          <h1>Contact Us</h1>
          <p>Have a question, feedback, or need to report an issue? We'd love to hear from you.</p>

          <div className="contact-grid">
            {/* Contact Form */}
            <div className="contact-form-wrapper">
              <h2>Send a Message</h2>
              {submitted ? (
                <div className="success-msg">
                  ✅ Thank you! Your email client should have opened. If not, email us directly at <strong>contact@reelsnap.app</strong>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label htmlFor="name">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Your Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      rows={5}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-submit">
                    Send Message
                  </button>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="contact-info">
              <h2>Other Ways to Reach Us</h2>

              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <div>
                  <strong>Email</strong>
                  <p>contact@reelsnap.app</p>
                </div>
              </div>

              <div className="contact-item">
                <span className="contact-icon">⏱️</span>
                <div>
                  <strong>Response Time</strong>
                  <p>We typically respond within 24–48 hours</p>
                </div>
              </div>

              <div className="contact-item">
                <span className="contact-icon">🚫</span>
                <div>
                  <strong>DMCA / Copyright</strong>
                  <p>For copyright removal requests, please email us with the subject "DMCA Request" and include the content URL.</p>
                </div>
              </div>

              <div className="contact-item">
                <span className="contact-icon">🐛</span>
                <div>
                  <strong>Bug Reports</strong>
                  <p>Found a bug? Let us know and we'll fix it as soon as possible.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}