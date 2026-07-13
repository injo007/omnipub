import { FinalArticlePackage, PhaseDAuditEvent } from "./typesPhaseD";
import { getDocumentStore } from "../db/documentStore";

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

export class PostgresPhaseDPackageRepository implements IPhaseDPackageRepository {
    private get db() {
        return getDocumentStore();
    }

    async getByPackageId(packageId: string): Promise<FinalArticlePackage | null> {
        const direct = await this.db.collection('phase_d_packages').doc(packageId).get();
        if (direct.exists) return direct.data() as FinalArticlePackage;
        const snapshot = await this.db.collection('phase_d_packages').where('packageId', '==', packageId).limit(1).get();
        return snapshot.empty ? null : snapshot.docs[0].data() as FinalArticlePackage;
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
                if (doc.exists) return doc.data() as FinalArticlePackage;
                const data = { ...pkg, idempotencyKey: key };
                await transaction.set(docRef, data);
                return data;
            });
        } catch (error) {
            console.error("PostgreSQL transaction failed", error);
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
