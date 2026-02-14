import { get, post, patch, put, del } from './api';

export interface OrganizationSection {
  title: string;
  details: string;
  image?: string;
  video?: string;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    caption?: string;
    thumbnail?: string;
  }>;
}

export interface Organization {
  _id: string;
  orgName: string;
  orgType: 'partner organization' | 'social organization' | string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  description: string;
  profileImage: string;
  postByProfile?: string;
  postByName?: string;
  postBy?: string;
  createdAt: string;
  status: 'pending' | 'aprooved' | 'rejected' | string;
  sections?: OrganizationSection[];
  activities?: OrgActivity[];
}

export interface OrgActivity {
  _id: string;
  organizationId: string;
  title: string;
  details: string;
  date: string;
  place: string;
  image?: string;
  userName?: string;
  userId?: string;
  userImage?: string;
  createdAt: string;
}

/**
 * Get all approved partner organizations
 */
export const getApprovedOrganizations = async (): Promise<Organization[]> => {
  try {
    const response = await get<{ success: boolean; data: Organization[] }>(
      '/api/v1/organizations/aprooved',
    );
    return response.success ? response.data : [];
  } catch (error) {
    console.error('Error fetching approved organizations:', error);
    throw error;
  }
};

/**
 * Get all social organizations
 */
export const getSocialOrganizations = async (): Promise<Organization[]> => {
  try {
    const response = await get<{ success: boolean; data: Organization[] }>(
      '/social-organization',
    );
    return response.success ? response.data : [];
  } catch (error) {
    console.error('Error fetching social organizations:', error);
    throw error;
  }
};

/**
 * Get organization by ID
 */
export const getOrganizationById = async (
  id: string,
): Promise<Organization> => {
  try {
    const response = await get<{ success: boolean; data: Organization }>(
      `/api/v1/organizations/${id}`,
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching organization ${id}:`, error);
    throw error;
  }
};

/**
 * Get organizations by user ID
 */
export const getOrganizationsByUser = async (
  userId: string,
): Promise<Organization[]> => {
  try {
    const response = await get<{ success: boolean; data: Organization[] }>(
      `/api/v1/organizations/user/${userId}`,
    );
    return response.success ? response.data : [];
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return [];
  }
};

/**
 * Add a new activity to an organization
 */
export const addActivity = async (
  activityData: any,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await post('/api/v1/activities', activityData);
    return { success: true, ...response };
  } catch (error: any) {
    console.error('Error adding activity:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get activity details
 */
export const getActivityDetails = async (id: string): Promise<any> => {
  try {
    const response = await get<any>(`/api/v1/activity/${id}`);
    // The server returns { data: activity } directly
    return response.data;
  } catch (error) {
    console.error(`Error fetching activity ${id}:`, error);
    throw error;
  }
};

/**
 * Get all activities for an organization
 */
export const getOrgActivities = async (
  orgId: string,
): Promise<OrgActivity[]> => {
  try {
    const org = await getOrganizationById(orgId);
    return org.activities || [];
  } catch (error) {
    console.error('Error fetching org activities:', error);
    return [];
  }
};

/**
 * Add a new organization
 */
export const addOrganization = async (
  orgData: Partial<Organization>,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await post('/add-organizations', orgData);
    return { success: true, ...response };
  } catch (error: any) {
    console.error('Error adding organization:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get favorite/social organizations for the current user
 */
export const getSocialOrgStats = async () => {
  // Add this if needed
};
