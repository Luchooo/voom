"use client";

import { auth } from "@/lib/firebase";
import { loginWithGoogle as authLoginWithGoogle } from "@/lib/auth";
import {
	onAuthStateChanged,
	type User,
} from "firebase/auth";
import {
	createContext,
	useCallback,
	useEffect,
	useState,
	type ReactNode,
} from "react";

type AuthContextValue = {
	user: User | null;
	loading: boolean;
	loginWithGoogle: () => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function setSessionCookie(idToken: string): Promise<void> {
	await fetch("/api/auth/session", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ idToken }),
		credentials: "same-origin",
	});
}

async function clearSessionCookie(): Promise<void> {
	await fetch("/api/auth/logout", {
		method: "POST",
		credentials: "same-origin",
	});
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			setUser(firebaseUser);
			if (firebaseUser) {
				try {
					const idToken = await firebaseUser.getIdToken();
					await setSessionCookie(idToken);
				} catch (e) {
					console.error("Failed to set session cookie:", e);
				}
			} else {
				await clearSessionCookie();
			}
			setLoading(false);
		});
		return () => unsubscribe();
	}, []);

	const loginWithGoogle = useCallback(async () => {
		await authLoginWithGoogle();
		// onAuthStateChanged will run and set cookie + user
	}, []);

	const logout = useCallback(async () => {
		await clearSessionCookie();
		await auth.signOut();
		setUser(null);
	}, []);

	const value: AuthContextValue = {
		user,
		loading,
		loginWithGoogle,
		logout,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

export { AuthContext };
