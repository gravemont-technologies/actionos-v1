import { ProfileStore } from "./profileStore.js";
import { SignatureCache } from "../cache/signatureCache.js";

let profileStoreInstance: ProfileStore | null = null;
let signatureCacheInstance: SignatureCache | null = null;

export function getProfileStore(): ProfileStore {
  if (!profileStoreInstance) {
    profileStoreInstance = new ProfileStore();
  }
  return profileStoreInstance;
}

export function getSignatureCache(): SignatureCache {
  if (!signatureCacheInstance) {
    signatureCacheInstance = new SignatureCache();
  }
  return signatureCacheInstance;
}
