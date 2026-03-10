'use client'

const features = [
  {
    title: '60-Second Rounds',
    description: 'Fast markets that resolve in one minute.',
  },
  {
    title: 'On-Chain Settlement',
    description: 'All bets and payouts recorded on Base.',
  },
  {
    title: 'Dynamic Odds',
    description: 'Payouts adjust based on pool distribution.',
  },
  {
    title: 'No Custody',
    description: 'Your funds stay in your wallet.',
  },
]

export function Features() {
  return (
    <section className="fb-section">
      <div className="fb-section-header">
        <h2 className="fb-section-title">Features</h2>
      </div>

      <div className="fb-features-grid">
        {features.map((feature) => (
          <div key={feature.title} className="fb-feature-card">
            <h3 className="fb-feature-title">{feature.title}</h3>
            <p className="fb-feature-desc">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
