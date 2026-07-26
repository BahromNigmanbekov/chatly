import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import {
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { normalizeUsername } from "@/lib/utils/username";
import type { UserProfile } from "@/types/user";

export class UsernameTakenError extends Error {
  constructor() {
    super("Bu username band");
    this.name = "UsernameTakenError";
  }
}

/** Debounced live "band/bo'sh" check while the user types — not transactional. */
export async function isUsernameAvailable(username: string, ignoreUid?: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const snap = await getDoc(doc(db, "usernames", normalized));
  if (!snap.exists()) return true;
  return snap.data().userId === ignoreUid;
}

async function claimUsernameTx(uid: string, newUsername: string, oldUsername?: string | null) {
  const normalized = normalizeUsername(newUsername);
  await runTransaction(db, async (tx) => {
    const newRef = doc(db, "usernames", normalized);
    const newSnap = await tx.get(newRef);
    if (newSnap.exists() && newSnap.data().userId !== uid) {
      throw new UsernameTakenError();
    }

    if (oldUsername && normalizeUsername(oldUsername) !== normalized) {
      tx.delete(doc(db, "usernames", normalizeUsername(oldUsername)));
    }

    tx.set(newRef, { userId: uid });
    tx.set(
      doc(db, "users", uid),
      { username: normalized },
      { merge: true },
    );
  });
}

export async function registerUser(params: {
  email: string;
  password: string;
  displayName: string;
  username: string;
}): Promise<void> {
  const normalized = normalizeUsername(params.username);
  const credential = await createUserWithEmailAndPassword(auth, params.email, params.password);
  const { uid } = credential.user;

  try {
    await claimUsernameTx(uid, normalized);
  } catch (err) {
    // Roll back the auth account so the user isn't left in a half-registered state.
    await credential.user.delete().catch(() => undefined);
    throw err;
  }

  await updateProfile(credential.user, { displayName: params.displayName });

  const profile: Omit<UserProfile, "createdAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
  } = {
    uid,
    username: normalized,
    displayName: params.displayName,
    photoURL: null,
    bio: "",
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", uid), profile, { merge: true });
}

export async function loginUser(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function changeUsername(uid: string, newUsername: string, oldUsername: string) {
  await claimUsernameTx(uid, newUsername, oldUsername);
}

export async function updateProfileFields(
  uid: string,
  fields: Partial<Pick<UserProfile, "displayName" | "bio" | "photoURL">>,
) {
  await setDoc(doc(db, "users", uid), fields, { merge: true });
  if (fields.displayName && auth.currentUser?.uid === uid) {
    await updateProfile(auth.currentUser, { displayName: fields.displayName });
  }
}

export async function releaseUsernameOnDelete(username: string) {
  await deleteDoc(doc(db, "usernames", normalizeUsername(username)));
}
