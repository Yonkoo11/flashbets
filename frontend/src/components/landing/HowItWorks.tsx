'use client'

const steps = [
  {
    number: '1',
    title: 'Connect Wallet',
    description: 'One click to connect. No signup required.',
  },
  {
    number: '2',
    title: 'Place Prediction',
    description: 'Choose UP or DOWN on BTC price.',
  },
  {
    number: '3',
    title: 'Collect Winnings',
    description: 'Settled on-chain in 60 seconds.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="fb-section">
      <div className="fb-section-header">
        <h2 className="fb-section-title">How It Works</h2>
      </div>

      <div className="fb-steps">
        {steps.map((step) => (
          <div key={step.number} className="fb-step">
            <div className="fb-step-number">{step.number}</div>
            <h3 className="fb-step-title">{step.title}</h3>
            <p className="fb-step-desc">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
