const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

// ─────────────────────────────────────────────────────────────────────────────
// enforceCircleAccess
// Called by the client before rendering a circle page.
// Returns { allowed: true } or throws an HttpsError.
// ─────────────────────────────────────────────────────────────────────────────
exports.enforceCircleAccess = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be signed in.')
  }

  const { circle } = data // 'womens' | 'mens' | 'mixed' | 'private'
  const uid = context.auth.uid

  const userSnap = await db.collection('users').doc(uid).get()
  if (!userSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'User profile not found.')
  }

  const user = userSnap.data()

  if (!user.ageVerified) {
    throw new functions.https.HttpsError('permission-denied', 'Age verification required.')
  }

  if (!user.partnerId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You must link a partner before accessing circles.'
    )
  }

  if (circle === 'womens' && user.gender !== 'female') {
    throw new functions.https.HttpsError(
      'permission-denied',
      "Women's Circle is accessible to female users only."
    )
  }

  if (circle === 'mens' && user.gender !== 'male') {
    throw new functions.https.HttpsError(
      'permission-denied',
      "Men's Circle is accessible to male users only."
    )
  }

  // 'mixed' and 'private' only require a linked partner (checked above)
  return { allowed: true }
})

// ─────────────────────────────────────────────────────────────────────────────
// sendPartnerInvite
// Creates an invite document and (optionally) sends a notification email/SMS.
// ─────────────────────────────────────────────────────────────────────────────
exports.sendPartnerInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be signed in.')
  }

  const senderId = context.auth.uid
  const { recipientEmail } = data

  if (!recipientEmail) {
    throw new functions.https.HttpsError('invalid-argument', 'recipientEmail is required.')
  }

  // Prevent self-invite
  if (recipientEmail === context.auth.token.email) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'You cannot invite yourself as a partner.'
    )
  }

  const senderSnap = await db.collection('users').doc(senderId).get()
  if (!senderSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Sender profile not found.')
  }

  const sender = senderSnap.data()

  if (sender.partnerId) {
    throw new functions.https.HttpsError(
      'already-exists',
      'You already have a linked partner.'
    )
  }

  // Check for an existing pending invite from this sender
  const existing = await db
    .collection('invites')
    .where('senderId', '==', senderId)
    .where('status', '==', 'pending')
    .get()

  if (!existing.empty) {
    throw new functions.https.HttpsError(
      'already-exists',
      'You already have a pending invite. Cancel it before sending a new one.'
    )
  }

  const inviteRef = await db.collection('invites').add({
    senderId,
    senderName: sender.displayName || '',
    recipientEmail,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return { inviteId: inviteRef.id }
})

// ─────────────────────────────────────────────────────────────────────────────
// acceptPartnerInvite
// Links two user accounts together as partners.
// ─────────────────────────────────────────────────────────────────────────────
exports.acceptPartnerInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be signed in.')
  }

  const { inviteId } = data
  const recipientUid = context.auth.uid

  if (!inviteId) {
    throw new functions.https.HttpsError('invalid-argument', 'inviteId is required.')
  }

  const inviteRef = db.collection('invites').doc(inviteId)
  const inviteSnap = await inviteRef.get()

  if (!inviteSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Invite not found.')
  }

  const invite = inviteSnap.data()

  if (invite.status !== 'pending') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'This invite has already been used or cancelled.'
    )
  }

  // Verify the current user's email matches the invite
  if (invite.recipientEmail !== context.auth.token.email) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'This invite was not sent to your email address.'
    )
  }

  const senderId = invite.senderId

  // Verify recipient doesn't already have a partner
  const recipientSnap = await db.collection('users').doc(recipientUid).get()
  if (!recipientSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Recipient profile not found.')
  }
  if (recipientSnap.data().partnerId) {
    throw new functions.https.HttpsError(
      'already-exists',
      'You already have a linked partner.'
    )
  }

  // Use a batch write to atomically link both users
  const batch = db.batch()

  batch.update(db.collection('users').doc(senderId), {
    partnerId: recipientUid,
    partnerLinkedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  batch.update(db.collection('users').doc(recipientUid), {
    partnerId: senderId,
    partnerLinkedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  batch.update(inviteRef, {
    status: 'accepted',
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  await batch.commit()

  return { success: true, partnerId: senderId }
})
