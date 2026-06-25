export default function FeatureCards() {
  const features = [
    { icon: '⚡', title: 'Lightning Fast', desc: 'Download videos in seconds with our high-speed servers.' },
    { icon: '🎥', title: 'HD Quality', desc: 'Get videos in up to 1080p HD quality, no compromises.' },
    { icon: '🔒', title: 'No Login Required', desc: 'No sign-ups, no logins. Just paste and download.' },
    { icon: '📱', title: 'Works Everywhere', desc: 'Compatible with all devices — mobile, tablet, desktop.' },
  ]

  return (
    <section className="features">
      {features.map((f, i) => (
        <div key={i} className="feature-card">
          <div className="icon">{f.icon}</div>
          <h3>{f.title}</h3>
          <p>{f.desc}</p>
        </div>
      ))}
    </section>
  )
}