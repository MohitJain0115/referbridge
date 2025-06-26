export type Candidate = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  company: string;
  salary: number;
  skills: string[];
  location: string;
  status: 'Pending' | 'Viewed' | 'Referred' | 'Not a Fit';
  jobPostUrl: string;
};

export type Referrer = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  company: string;
  location: string;
  specialties: string[];
  connections: number;
};
