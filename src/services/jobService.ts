import { get, post, patch } from './api';

export interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  jobType:
    | 'Full-time'
    | 'Part-time'
    | 'Contract'
    | 'Remote'
    | 'Internship'
    | string;
  experienceLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  deadline?: string;
  postedBy: string;
  postedByUser?: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  views: number;
  applicationsCount: number;
  company?: string; // Optional, might be part of postedByUser or a separate field if added
  logoUrl?: string; // Helper for UI
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  budgetType: 'fixed' | 'hourly';
  budget?: number;
  hourlyRate?: number;
  skills: string[];
  deadline?: string;
  postedBy: string;
  postedByUser?: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  selectedFreelancer?: string;
  proposalCount?: number; // Backend might not send this directly in list, need to check
}

export interface Proposal {
  _id: string;
  projectId: string;
  freelancerId: string;
  coverLetter: string;
  proposedPrice?: number;
  hourlyRate?: number;
  deliveryTime: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  freelancer?: {
    _id: string;
    name: string;
    profileImage?: string;
    email: string;
  };
}

// Jobs API

export const getJobs = async (filters: any = {}): Promise<Job[]> => {
  try {
    const response: any = await get('/jobs', { params: filters });
    if (response.success) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

export const getJobDetails = async (id: string): Promise<Job | null> => {
  try {
    const response: any = await get(`/jobs/${id}`);
    if (response.success) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching job details:', error);
    throw error;
  }
};

export const applyToJob = async (
  jobId: string,
  data: { cvUrl: string; coverLetter: string },
): Promise<any> => {
  try {
    const response: any = await post(`/jobs/${jobId}/apply`, data);
    return response;
  } catch (error) {
    console.error('Error applying to job:', error);
    throw error;
  }
};

export const getMyApplications = async (): Promise<any[]> => {
  try {
    const response: any = await get('/my-applications');
    if (response.success) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching my applications:', error);
    throw error;
  }
};

// Freelance Projects API

export const getProjects = async (filters: any = {}): Promise<Project[]> => {
  try {
    const response: any = await get('/projects', { params: filters });
    if (response.success) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const getProjectDetails = async (
  id: string,
): Promise<Project | null> => {
  try {
    const response: any = await get(`/projects/${id}`);
    if (response.success) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching project details:', error);
    throw error;
  }
};

export const submitProposal = async (
  projectId: string,
  data: {
    coverLetter: string;
    proposedPrice?: number;
    hourlyRate?: number;
    deliveryTime: string;
  },
): Promise<any> => {
  try {
    const response: any = await post(`/projects/${projectId}/proposals`, data);
    return response;
  } catch (error) {
    console.error('Error submitting proposal:', error);
    throw error;
  }
};

export const getMyProposals = async (): Promise<any[]> => {
  try {
    const response: any = await get('/freelancer/proposals');
    if (response.success) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching my proposals:', error);
    throw error;
  }
};

// Employer API

export const getEmployerStatus = async (): Promise<any> => {
  try {
    const response: any = await get('/employers/status');
    return response;
  } catch (error) {
    console.error('Error fetching employer status:', error);
    throw error;
  }
};

export const applyForEmployer = async (data: {
  companyName: string;
  companyWebsite?: string;
  companyLocation: string;
  description: string;
}): Promise<any> => {
  try {
    const response: any = await post('/employers/apply', data);
    return response;
  } catch (error) {
    console.error('Error applying for employer:', error);
    throw error;
  }
};

export const createJob = async (data: any): Promise<any> => {
  try {
    const response: any = await post('/jobs', data);
    return response;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

export const getEmployerJobs = async (): Promise<Job[]> => {
  try {
    const response: any = await get('/employer/jobs');
    if (response.success) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    throw error;
  }
};

export const getJobApplications = async (jobId: string): Promise<any[]> => {
  try {
    const response: any = await get(`/employer/jobs/${jobId}/applications`);
    if (response.success) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching job applications:', error);
    throw error;
  }
};

// Client API

export const createProject = async (data: any): Promise<any> => {
  try {
    const response: any = await post('/projects', data);
    return response;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const getClientProjects = async (): Promise<Project[]> => {
  try {
    const response: any = await get('/client/projects');
    if (response.success) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching client projects:', error);
    throw error;
  }
};

export const getProjectProposals = async (
  projectId: string,
): Promise<Proposal[]> => {
  try {
    const response: any = await get(`/projects/${projectId}/proposals`);
    if (response.success) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching project proposals:', error);
    throw error;
  }
};

export const updateProposalStatus = async (
  proposalId: string,
  status: 'accepted' | 'rejected',
): Promise<any> => {
  try {
    const response: any = await patch(`/proposals/${proposalId}/status`, {
      status,
    });
    return response;
  } catch (error) {
    console.error('Error updating proposal status:', error);
    throw error;
  }
};
