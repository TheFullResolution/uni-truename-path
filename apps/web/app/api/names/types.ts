import type { Tables } from '@/generated/database';

export interface NameAssignment {
  context_id: string;
  context_name: string;
  is_permanent: boolean;
  oidc_property: string;
}

export interface NameWithAssignments extends Tables<'names'> {
  assignments?: NameAssignment[];
}

export interface NamesResponseData {
  names: NameWithAssignments[];
  total: number;
  metadata: {
retrieval_timestamp: string;
filter_applied?: {
  limit?: number;
};
userId: string;
  };
}
