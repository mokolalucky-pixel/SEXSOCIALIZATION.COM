import { useEffect, useState } from 'react'
import { createCirclePost, interactWithCirclePost, loadCirclePosts } from '../services/circlePostService.js'

function CirclePosts({ circleType, circleName }) {
  const [posts, setPosts] = useState([])
  const [permissions, setPermissions] = useState({ canPost: false, canComment: false, canReact: false })
  const [body, setBody] = useState('')
  const [comments, setComments] = useState({})
  const [error, setError] = useState('')

  async function load() {
    const data = await loadCirclePosts(circleType)
    setPosts(data.posts)
    setPermissions({ canPost: data.canPost, canComment: data.canComment, canReact: data.canReact })
  }

  useEffect(() => { load().catch((nextError) => setError(nextError.message)) }, [circleType])

  async function post(event) {
    event.preventDefault()
    try { const data = await createCirclePost(circleType, body); setPosts(data.posts); setBody('') } catch (nextError) { setError(nextError.message) }
  }

  async function interact(postId, action, body, commentId) {
    try { await interactWithCirclePost(postId, action, body, commentId); await load() } catch (nextError) { setError(nextError.message) }
  }

  function editPost(post) {
    const updatedBody = window.prompt('Edit topic', post.body)
    if (updatedBody !== null) interact(post.id, 'edit-post', updatedBody)
  }

  function deletePost(post) {
    if (window.confirm('Delete this topic and its comments?')) interact(post.id, 'delete-post')
  }

  function editComment(postId, comment) {
    const updatedBody = window.prompt('Edit comment', comment.body)
    if (updatedBody !== null) interact(postId, 'edit-comment', updatedBody, comment.id)
  }

  function deleteComment(postId, commentId) {
    if (window.confirm('Delete this comment?')) interact(postId, 'delete-comment', undefined, commentId)
  }

  return <section className="workflow-card stacked-card">
    <div>
      <h4>{circleName} topics</h4>
      <p>{circleType === 'mixed' ? 'All members can view and react. Premium members can start topics and comment.' : 'Premium members can start topics, comment, and react.'}</p>
      {error ? <p className="error-message" role="alert">{error}</p> : null}
    </div>
    {permissions.canPost ? <form className="inline-form" onSubmit={post}><label htmlFor={`post-${circleType}`}>Start a topic</label><textarea id={`post-${circleType}`} value={body} onChange={(event) => setBody(event.target.value)} required /><button className="button">Publish topic</button></form> : null}
    <div className="message-list">
      {posts.length ? posts.map((post) => <article className="message-bubble" key={post.id}>
        <p><strong>{post.authorName}</strong></p>
        <p>{post.body}</p>
        <small>{new Date(post.createdAt).toLocaleString()}{post.editedAt ? ' · edited' : ''}</small>
        {post.mine ? <div className="action-row"><button className="button secondary" type="button" onClick={() => editPost(post)}>Edit</button><button className="button secondary" type="button" onClick={() => deletePost(post)}>Delete</button></div> : null}
        {permissions.canReact ? <div className="action-row"><button className="button secondary" type="button" onClick={() => interact(post.id, 'react')}>{post.reacted ? 'Remove reaction' : 'React'} ({post.reactionCount})</button></div> : <p>{post.reactionCount} reactions</p>}
        {post.comments.map((comment) => <div key={comment.id}><p><strong>{comment.authorName}:</strong> {comment.body} {comment.editedAt ? <small>· edited</small> : null}</p>{comment.mine ? <div className="action-row"><button className="button secondary" type="button" onClick={() => editComment(post.id, comment)}>Edit</button><button className="button secondary" type="button" onClick={() => deleteComment(post.id, comment.id)}>Delete</button></div> : null}</div>)}
        {permissions.canComment ? <form className="inline-form" onSubmit={(event) => { event.preventDefault(); interact(post.id, 'comment', comments[post.id] || ''); setComments((current) => ({ ...current, [post.id]: '' })) }}><input value={comments[post.id] || ''} onChange={(event) => setComments((current) => ({ ...current, [post.id]: event.target.value }))} placeholder="Write a comment" required /><button className="button secondary">Comment</button></form> : null}
      </article>) : <p className="save-status">No topics yet.</p>}
    </div>
  </section>
}

export default CirclePosts
