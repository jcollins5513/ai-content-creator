import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentReference,
  CollectionReference,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  UserProfile,
  ContentTemplate,
  DesignProject,
  ImageMetadata,
  COLLECTIONS,
  DEFAULT_IMAGE_CATEGORIES,
  SUBSCRIPTION_PLANS,
} from '../types/firestore';

// Collection References
export const usersCollection = collection(db, COLLECTIONS.USERS) as CollectionReference<UserProfile>;
export const templatesCollection = collection(db, COLLECTIONS.TEMPLATES) as CollectionReference<ContentTemplate>;
export const designsCollection = collection(db, COLLECTIONS.DESIGNS) as CollectionReference<DesignProject>;
export const imagesCollection = collection(db, COLLECTIONS.IMAGES) as CollectionReference<ImageMetadata>;

// User Profile Operations
export const createUserProfile = async (uid: string, email: string, displayName?: string): Promise<void> => {
  const userProfile: UserProfile = {
    uid,
    email,
    displayName,
    customImageCategories: [],
    subscriptionPlan: SUBSCRIPTION_PLANS.FREE,
    createdAt: Timestamp.now(),
    lastLoginAt: Timestamp.now(),
    usageStats: {
      contentGenerations: 0,
      designsCreated: 0,
      imagesUploaded: 0,
    },
  };

  const userDocRef = doc(usersCollection, uid);
  await setDoc(userDocRef, userProfile);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDocRef = doc(usersCollection, uid);
  const userDoc = await getDoc(userDocRef);
  
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as UserProfile;
  }
  
  return null;
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  const userDocRef = doc(usersCollection, uid);
  await updateDoc(userDocRef, updates);
};

export const updateLastLoginTime = async (uid: string): Promise<void> => {
  const userDocRef = doc(usersCollection, uid);
  await updateDoc(userDocRef, {
    lastLoginAt: Timestamp.now(),
  });
};

// Template Operations
export const getBuiltInTemplates = async (): Promise<ContentTemplate[]> => {
  const q = query(
    templatesCollection,
    where('userId', '==', null),
    where('isActive', '==', true),
    orderBy('industry'),
    orderBy('name')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getUserCustomTemplates = async (userId: string): Promise<ContentTemplate[]> => {
  const q = query(
    templatesCollection,
    where('userId', '==', userId),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createCustomTemplate = async (userId: string, template: Omit<ContentTemplate, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
  const templateData: Omit<ContentTemplate, 'id'> = {
    ...template,
    userId,
    createdAt: Timestamp.now(),
  };
  
  const templateDocRef = doc(templatesCollection);
  await setDoc(templateDocRef, templateData);
  return templateDocRef.id;
};

export const updateCustomTemplate = async (templateId: string, updates: Partial<ContentTemplate>): Promise<void> => {
  const templateDocRef = doc(templatesCollection, templateId);
  await updateDoc(templateDocRef, updates);
};

export const deleteCustomTemplate = async (templateId: string): Promise<void> => {
  const templateDocRef = doc(templatesCollection, templateId);
  await deleteDoc(templateDocRef);
};

// Design Operations
export const getUserDesigns = async (userId: string, limitCount?: number): Promise<DesignProject[]> => {
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('metadata.updatedAt', 'desc')
  ];
  
  if (limitCount) {
    constraints.push(limit(limitCount));
  }
  
  const q = query(designsCollection, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getDesignById = async (designId: string): Promise<DesignProject | null> => {
  const designDocRef = doc(designsCollection, designId);
  const designDoc = await getDoc(designDocRef);
  
  if (designDoc.exists()) {
    return { id: designDoc.id, ...designDoc.data() } as DesignProject;
  }
  
  return null;
};

export const saveDesign = async (userId: string, design: Omit<DesignProject, 'id' | 'userId' | 'metadata'>): Promise<string> => {
  const designData: Omit<DesignProject, 'id'> = {
    ...design,
    userId,
    metadata: {
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      version: 1,
    },
  };
  
  const designDocRef = doc(designsCollection);
  await setDoc(designDocRef, designData);
  return designDocRef.id;
};

export const updateDesign = async (designId: string, updates: Partial<DesignProject>): Promise<void> => {
  const designDocRef = doc(designsCollection, designId);
  const currentDesign = await getDoc(designDocRef);
  
  if (currentDesign.exists()) {
    const currentData = currentDesign.data();
    await updateDoc(designDocRef, {
      ...updates,
      metadata: {
        ...currentData.metadata,
        ...updates.metadata,
        updatedAt: Timestamp.now(),
        version: (currentData.metadata?.version || 0) + 1,
      },
    });
  }
};

export const deleteDesign = async (designId: string): Promise<void> => {
  const designDocRef = doc(designsCollection, designId);
  await deleteDoc(designDocRef);
};

// Image Metadata Operations
export const getUserImages = async (userId: string, category?: string): Promise<ImageMetadata[]> => {
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('metadata.uploadedAt', 'desc')
  ];
  
  if (category) {
    constraints.splice(1, 0, where('category', '==', category));
  }
  
  const q = query(imagesCollection, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveImageMetadata = async (userId: string, imageData: Omit<ImageMetadata, 'id' | 'userId'>): Promise<string> => {
  const metadata: Omit<ImageMetadata, 'id'> = {
    ...imageData,
    userId,
  };
  
  const imageDocRef = doc(imagesCollection);
  await setDoc(imageDocRef, metadata);
  return imageDocRef.id;
};

export const updateImageMetadata = async (imageId: string, updates: Partial<ImageMetadata>): Promise<void> => {
  const imageDocRef = doc(imagesCollection, imageId);
  await updateDoc(imageDocRef, updates);
};

export const deleteImageMetadata = async (imageId: string): Promise<void> => {
  const imageDocRef = doc(imagesCollection, imageId);
  await deleteDoc(imageDocRef);
};

// Utility Functions
export const incrementUsageStats = async (userId: string, statType: keyof UserProfile['usageStats']): Promise<void> => {
  const userDocRef = doc(usersCollection, userId);
  const userDoc = await getDoc(userDocRef);
  
  if (userDoc.exists()) {
    const currentStats = userDoc.data().usageStats;
    await updateDoc(userDocRef, {
      [`usageStats.${statType}`]: currentStats[statType] + 1,
    });
  }
};

export const addCustomImageCategory = async (userId: string, categoryName: string): Promise<void> => {
  const userDocRef = doc(usersCollection, userId);
  const userDoc = await getDoc(userDocRef);
  
  if (userDoc.exists()) {
    const currentCategories = userDoc.data().customImageCategories || [];
    if (currentCategories.length < 2 && !currentCategories.includes(categoryName)) {
      await updateDoc(userDocRef, {
        customImageCategories: [...currentCategories, categoryName],
      });
    }
  }
};

export const removeCustomImageCategory = async (userId: string, categoryName: string): Promise<void> => {
  const userDocRef = doc(usersCollection, userId);
  const userDoc = await getDoc(userDocRef);
  
  if (userDoc.exists()) {
    const currentCategories = userDoc.data().customImageCategories || [];
    await updateDoc(userDocRef, {
      customImageCategories: currentCategories.filter(cat => cat !== categoryName),
    });
  }
};

export const getAllImageCategories = async (userId: string): Promise<string[]> => {
  const userProfile = await getUserProfile(userId);
  if (userProfile) {
    return [...DEFAULT_IMAGE_CATEGORIES, ...userProfile.customImageCategories];
  }
  return [...DEFAULT_IMAGE_CATEGORIES];
};