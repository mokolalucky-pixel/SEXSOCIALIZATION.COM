import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="panel" aria-labelledby="not-found-title">
      <h1 id="not-found-title">Page not found</h1>
      <p>We could not find the page you were looking for.</p>
      <Link className="button" to="/">
        Return home
      </Link>
    </section>
  )
}

export default NotFound
