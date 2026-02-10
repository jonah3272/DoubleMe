// Project OS domain types. Expand as schema and API are defined.

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Thread = {
  id: string;
  projectId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Artifact = {
  id: string;
  projectId: string;
  threadId: string | null;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type Memory = {
  id: string;
  projectId: string | null;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
};
