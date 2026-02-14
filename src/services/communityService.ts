import { get, post, del, put, patch } from './api';

export interface Community {
  _id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  coverImage?: string;
  membersCount: number;
  isVerified?: boolean;
  mainAdmin: string;
  admins?: string[];
  editors?: string[];
  rules?: string[];
  createdAt: string;
  isFollowing?: boolean;
}

export interface CommunityPost {
  _id: string;
  communityId: string;
  userId: string;
  userName: string;
  userImage?: string;
  title?: string;
  description?: string;
  type: 'text' | 'video' | 'course';
  content: string; // or URLs for video
  visibility: 'public' | 'private';
  accessCode?: string;
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
  chapters?: {
    title: string;
    videos: string[];
  }[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
}

/**
 * Get all communities
 */
export const getCommunities = async (): Promise<Community[]> => {
  try {
    const response = await get<{ success: boolean; data: Community[] }>(
      '/communities',
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching communities:', error);
    return [];
  }
};

/**
 * Get communities created by the current user
 */
export const getMyCommunities = async (): Promise<Community[]> => {
  try {
    const response = await get<{ success: boolean; data: Community[] }>(
      '/my-communities',
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching my communities:', error);
    return [];
  }
};

/**
 * Get community details by ID
 */
export const getCommunityById = async (
  id: string,
): Promise<Community | null> => {
  try {
    const response = await get<{ success: boolean; data: Community }>(
      `/communities/${id}`,
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching community ${id}:`, error);
    return null;
  }
};

/**
 * Follow/Unfollow a community
 */
export const toggleFollowCommunity = async (
  id: string,
): Promise<{ success: boolean; followed: boolean }> => {
  try {
    const response = await post<{ success: boolean; followed: boolean }>(
      `/communities/${id}/follow`,
    );
    return response;
  } catch (error) {
    console.error(`Error toggling follow for community ${id}:`, error);
    return { success: false, followed: false };
  }
};

/**
 * Get follow status for a community
 */
export const getFollowStatus = async (id: string): Promise<boolean> => {
  try {
    const response = await get<{ success: boolean; followed: boolean }>(
      `/communities/${id}/follow-status`,
    );
    return response.followed;
  } catch (error) {
    console.error(`Error fetching follow status for community ${id}:`, error);
    return false;
  }
};

/**
 * Get user permissions/roles for a community
 */
export const getCommunityPermissions = async (
  id: string,
): Promise<{ isMainAdmin: boolean; isAdmin: boolean; isEditor: boolean }> => {
  try {
    const response = await get<{
      success: boolean;
      data: { isMainAdmin: boolean; isAdmin: boolean; isEditor: boolean };
    }>(`/communities/${id}/permissions`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching permissions for community ${id}:`, error);
    return { isMainAdmin: false, isAdmin: false, isEditor: false };
  }
};

/**
 * Get posts for a community
 */
export const getCommunityPosts = async (
  communityId: string,
): Promise<CommunityPost[]> => {
  try {
    const response = await get<{ success: boolean; data: CommunityPost[] }>(
      `/communities/${communityId}/posts`,
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching posts for community ${communityId}:`, error);
    return [];
  }
};

/**
 * Create a new community post
 */
export const createCommunityPost = async (
  communityId: string,
  postData: any,
): Promise<{ success: boolean; data?: any }> => {
  try {
    const response = await post<any>(`/communities/${communityId}/posts`, {
      type: 'text',
      ...postData,
    });
    return response;
  } catch (error) {
    console.error(`Error creating post for community ${communityId}:`, error);
    return { success: false };
  }
};

/**
 * Create a new community
 */
export const createCommunity = async (
  data: any,
): Promise<{ success: boolean; id?: string }> => {
  try {
    const response = await post<any>('/community-create', {
      communityData: data,
    });
    return response;
  } catch (error) {
    console.error('Error creating community:', error);
    return { success: false };
  }
};
/**
 * Update community details
 */
export const updateCommunity = async (
  id: string,
  data: any,
): Promise<{ success: boolean; data?: Community }> => {
  try {
    const response = await patch<{ success: boolean; data: Community }>(
      `/communities/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.error(`Error updating community ${id}:`, error);
    return { success: false };
  }
};

/**
 * Get course mapping for a post
 */
export const getCourseMapping = async (
  postId: string,
): Promise<{ courseId: string }> => {
  try {
    const response = await get<{ success: boolean; courseId: string }>(
      `/posts/${postId}/course`,
    );
    return response;
  } catch (error) {
    console.error(`Error fetching course mapping for post ${postId}:`, error);
    throw error;
  }
};

/**
 * Enroll in a course
 */
export const enrollInCourse = async (
  courseId: string,
): Promise<{ success: boolean }> => {
  try {
    const response = await post<{ success: boolean }>(
      `/courses/${courseId}/enroll`,
      {},
    );
    return response;
  } catch (error) {
    console.error(`Error enrolling in course ${courseId}:`, error);
    throw error;
  }
};

/**
 * Check if user is enrolled in a course
 */
export const checkEnrollmentStatus = async (
  courseId: string,
): Promise<boolean> => {
  try {
    const response = await get<{ success: boolean; enrolled: boolean }>(
      `/courses/${courseId}/enrolled`,
    );
    return response.enrolled;
  } catch (error) {
    console.error(
      `Error checking enrollment status for course ${courseId}:`,
      error,
    );
    return false;
  }
};
