export default function HowItWorks() {
  const steps = [
    { number: 1, title: 'Copy Link', desc: 'Copy the URL of the Instagram video, Reel, or Story you want to download.' },
    { number: 2, title: 'Paste & Search', desc: 'Paste the link into the input box above and click the Download button.' },
    { number: 3, title: 'Download HD', desc: 'Choose your preferred quality and download the video instantly.' },
  ]

  return (
    <section className="how-it-works">
      <h2>How It Works</h2>
      <div className="steps">
        {steps.map((s, i) => (
          <div key={i} className="step">
            <div className="step-number">{s.number}</div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}