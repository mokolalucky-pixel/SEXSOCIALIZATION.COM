function FeaturePreview({ title, description, items }) {
  return (
    <article className="feature-preview">
      <h2>{title}</h2>
      <p>{description}</p>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  )
}

export default FeaturePreview
