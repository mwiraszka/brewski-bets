export interface Page {
  title: string;
  path: string;
  sections?: Array<{ title: string; fragment: string }>;
}

export interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  clerkImageUrl: string | null;
  friendshipId: string;
}

export interface FriendRequest {
  id: string;
  status: 'pending' | 'accepted';
  createdDate: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    clerkImageUrl: string | null;
  };
}

export interface SentFriendRequest {
  id: string;
  status: 'pending' | 'accepted';
  createdDate: string;
  addressee: {
    id: string;
    firstName: string;
    lastName: string;
    clerkImageUrl: string | null;
  };
}

export interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  clerkImageUrl: string | null;
}

export interface BetResult {
  name: string;
  brewskiCount: number;
  assignedTo: 'user1' | 'user2' | null;
  isSpecial?: 'void' | 'active';
}

export interface Bet {
  id: string;
  title: string;
  description: string;
  iconSlug: string | null;
  iconColor: string | null;
  user1Id: string;
  user2Id: string;
  results: BetResult[];
  selectedResultIndex: number | null;
  status: 'pending' | 'active' | 'complete';
  outcome: 'open' | 'resolved' | 'void';
  pendingAction: 'user1' | 'user2' | null;
  createdBy: string;
  lastModifiedBy: string;
  createdDate: string;
  lastModifiedDate: string;
}

export interface BetWithOpponent extends Bet {
  opponent: UserSearchResult;
}
