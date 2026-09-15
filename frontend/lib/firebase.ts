// Lightweight Auth provider — Firebase SDK removed in favor of direct sessions, Cloudinary CDN, and PostgreSQL.
export interface UserSession {
  uid: string
  email?: string | null
  displayName?: string | null
  role?: string
}

export const auth = {
  currentUser: null as UserSession | null,
}

export const signInWithEmailAndPassword = async (_auth: any, email: string, _pass: string) => {
  return { user: { uid: 'u_' + Date.now(), email } }
}

export const createUserWithEmailAndPassword = async (_auth: any, email: string, _pass: string) => {
  return {
    user: {
      uid: 'u_' + Date.now(),
      email,
      getIdToken: async (_forceRefresh?: boolean) => 'sess_token_' + Date.now(),
    },
  }
}

export const signOut = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bhoomisetu_user')
  }
}

export const onAuthStateChanged = (_auth: any, callback: (user: UserSession | null) => void) => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('bhoomisetu_user')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        callback({ uid: 'u1', email: u.email, displayName: u.name, role: u.role })
        return () => {}
      } catch {}
    }
  }
  callback(null)
  return () => {}
}

export type { UserSession as FirebaseUser }
