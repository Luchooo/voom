import {
	GoogleAuthProvider,
	signInWithPopup,
	signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "./firebase";

/** Establece la cookie de sesión en el servidor para que el middleware permita /record. */
async function setSessionCookie(idToken: string): Promise<void> {
	await fetch("/api/auth/session", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ idToken }),
		credentials: "same-origin",
	});
}

export async function loginWithGoogle(): Promise<void> {
	const provider = new GoogleAuthProvider();
	const result = await signInWithPopup(auth, provider);
	const idToken = await result.user.getIdToken();
	await setSessionCookie(idToken);
}

export async function logout(): Promise<void> {
	await firebaseSignOut(auth);
}
