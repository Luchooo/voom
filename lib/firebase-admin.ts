import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/**
 * Firebase Admin SDK — solo servidor. Nunca importar en cliente.
 * Requiere FIREBASE_SERVICE_ACCOUNT_JSON (JSON stringificado) en env.
 */
function getAdminApp(): App {
	if (getApps().length > 0) {
		return getApps()[0] as App;
	}
	const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
	if (!json) {
		throw new Error(
			"FIREBASE_SERVICE_ACCOUNT_JSON is required for server-side auth verification.",
		);
	}
	const serviceAccount = JSON.parse(json) as {
		project_id?: string;
		client_email?: string;
		private_key?: string;
	};
	return initializeApp({
		credential: cert({
			projectId: serviceAccount.project_id,
			clientEmail: serviceAccount.client_email,
			privateKey: serviceAccount.private_key?.replace(/\\n/g, "\n"),
		}),
	});
}

export function getAdminAuth() {
	return getAuth(getAdminApp());
}
