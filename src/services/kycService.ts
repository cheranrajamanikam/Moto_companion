import type { KYCDocument, DocumentType, KYCStatus } from "@/types/rider";
import { userService } from './userService';

export const kycService = {
  getKYCDocuments(userId: string): KYCDocument[] {
    const user = userService.getUserProfile(userId);
    return user ? user.kycDocuments : [];
  },

  uploadKYCDocument(
    userId: string,
    type: DocumentType,
    documentNumber: string,
    fileName: string
  ): KYCDocument {
    const user = userService.getUserProfile(userId);
    if (!user) throw new Error('User not found');

    const newDoc: KYCDocument = {
      id: `kyc-${Date.now()}`,
      userId,
      type,
      documentNumber,
      fileName,
      status: 'VERIFIED', // Simulated demo auto-verification
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    const existingDocs = user.kycDocuments.filter((d) => d.type !== type);
    const updatedDocs = [...existingDocs, newDoc];

    // Evaluate overall KYC status
    const requiredTypes: DocumentType[] = ['AADHAAR', 'PAN', 'DRIVING_LICENCE'];
    const uploadedTypes = updatedDocs
      .filter((d) => d.status === 'VERIFIED')
      .map((d) => d.type);
    const isFullyVerified = requiredTypes.every((t) => uploadedTypes.includes(t));

    const overallStatus: KYCStatus = isFullyVerified
      ? 'VERIFIED'
      : updatedDocs.length > 0
      ? 'PENDING'
      : 'NOT_UPLOADED';

    userService.updateCurrentUser({
      kycDocuments: updatedDocs,
      kycStatus: overallStatus,
    });

    return newDoc;
  },

  deleteKYCDocument(userId: string, docId: string): void {
    const user = userService.getUserProfile(userId);
    if (!user) return;

    const remaining = user.kycDocuments.filter((d) => d.id !== docId);
    const overallStatus: KYCStatus = remaining.length === 0 ? 'NOT_UPLOADED' : 'PENDING';

    userService.updateCurrentUser({
      kycDocuments: remaining,
      kycStatus: overallStatus,
    });
  },
};
