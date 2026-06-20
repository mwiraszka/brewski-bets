export interface Page {
  title: string;
  path: string;
  sections?: Array<{ title: string; fragment: string }>;
}

export interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
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
    avatarUrl: string | null;
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
    avatarUrl: string | null;
  };
}

export interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface FriendsOverview {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  sentRequests: SentFriendRequest[];
}

export interface BetResult {
  name: string;
  brewskiCount: number;
  assignedTo: 'user1' | 'user2' | null;
  isSpecial?: 'void';
}

export type BetStatus = 'inactive' | 'active' | 'settled';

// The previously agreed terms, captured when the other user submits changes, so
// the reviewer can see what is being changed and a reject can restore them.
export interface BetSnapshot {
  title: string;
  description: string | null;
  iconSlug: string | null;
  iconColor: string | null;
  resolutionDate: string | null;
  results: BetResult[];
  status: BetStatus;
  outcome: 'open' | 'resolved' | 'void';
  pendingAction: 'user1' | 'user2' | null;
  settlementProposed: boolean;
  selectedResultIndex: number | null;
}

export interface Bet {
  id: string;
  title: string;
  description: string | null;
  iconSlug: string | null;
  iconColor: string | null;
  resolutionDate: string | null;
  user1Id: string;
  user2Id: string;
  results: BetResult[];
  selectedResultIndex: number | null;
  status: BetStatus;
  outcome: 'open' | 'resolved' | 'void';
  pendingAction: 'user1' | 'user2' | null;
  settlementProposed: boolean;
  previousState: BetSnapshot | null;
  createdBy: string;
  lastModifiedBy: string;
  createdDate: string;
  lastModifiedDate: string;
}

export interface BetWithOpponent extends Bet {
  opponent: UserSearchResult;
}
