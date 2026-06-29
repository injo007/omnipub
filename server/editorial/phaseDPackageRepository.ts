import { FinalArticlePackage, PhaseDAuditEvent } from "./typesPhaseD";
import { getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export interface IPhaseDPackageRepository {
    getByPackageId(packageId: string): Promise<FinalArticlePackage | null>;
    getByIdempotencyKey(key: string): Promise<FinalArticlePackage | null>;
    createIfAbsent(key: string, pkg: FinalArticlePackage): Promise<FinalArticlePackage>;
    persistDecisionEvent(event: PhaseDAuditEvent): Promise<void>;
}

export class InMemoryPhaseDPackageRepository implements IPhaseDPackageRepository {
    private packages = new Map<string, FinalArticlePackage>();
    private keys = new Map<string, FinalArticlePackage>();
    private events: PhaseDAuditEvent[] = [];

    async getByPackageId(packageId: string) {
        return this.packages.get(packageId) || null;
    }

    async getByIdempotencyKey(key: string) {
        return this.keys.get(key) || null;
    }

    async createIfAbsent(key: string, pkg: FinalArticlePackage) {
        if (this.keys.has(key)) {
            return this.keys.get(key)!;
        }
        this.keys.set(key, pkg);
        this.packages.set(pkg.packageId, pkg);
        return pkg;
    }

    async persistDecisionEvent(event: PhaseDAuditEvent) {
        this.events.push(event);
    }
}

export class FirestorePhaseDPackageRepository implements IPhaseDPackageRepository {
    private get db() {
        if (!getApps().length) {
            throw new Error("Firebase Admin not initialized.");
        }
        return getFirestore();
    }

    async getByPackageId(packageId: string): Promise<FinalArticlePackage | null> {
        const doc = await this.db.collection('phase_d_packages').doc(packageId).get();
        return doc.exists ? doc.data() as FinalArticlePackage : null;
    }

    async getByIdempotencyKey(key: string): Promise<FinalArticlePackage | null> {
        const snapshot = await this.db.collection('phase_d_packages').where('idempotencyKey', '==', key).limit(1).get();
        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as FinalArticlePackage;
    }

    async createIfAbsent(key: string, pkg: FinalArticlePackage): Promise<FinalArticlePackage> {
        const docRef = this.db.collection('phase_d_packages').doc(key);
        try {
            return await this.db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                if (doc.exists) {
                    return doc.data() as FinalArticlePackage;
                }
                const data = { ...pkg, idempotencyKey: key };
                transaction.set(docRef, data);
                return pkg;
            });
        } catch (error) {
            console.error("Firestore transaction failed", error);
            throw new Error("Persistence exception: " + String(error));
        }
    }

    async persistDecisionEvent(event: PhaseDAuditEvent): Promise<void> {
        try {
            await this.db.collection('phase_d_audits').add(event);
        } catch (e) {
            throw new Error("Audit persistence failed: " + String(e));
        }
    }
}
