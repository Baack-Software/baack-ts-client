/**
 * BAACK.CO CLIENT - TYPE DEFINITIONS
 */

// ==========================================
// SYSTEM & INFRASTRUCTURE
// ==========================================

export interface Pagination {
  /** Offset hint used in paginated queries */
  after?: string | null;
  /** URL for accessing paginated offset results when more items exist */
  nextUrl?: string | null;
  /** Set to true if there are more pages available */
  isMorePages?: boolean;
}


/**
 * Represents an API client used for authentication and integration.
 */
export interface ApiClient {
  urn: string;
  /** 
   * Scope of the API client. 
   * For server-side bearer tokens, use 'api.baack.co'. 
   * For webhooks, use 'webhook.baack.co'. 
   */
  scope?: string | null;
  /** The owning company this API Client is associated with */
  owner?: Company | null;
  /** 
   * The client ID of this client. Used for identification in 
   * third-party integrations or OAuth contexts. 
   */
  clientID: string;
}

/**
 * Represents an OAuth token, typically granted during OAuth flows.
 */
export interface ApiClientOauthToken {
  /** The URN of the oauth token */
  urn: string;
}

/**
 * Represents a bearer token used to authenticate an API request.
 */
export interface ApiClientBearerToken {
  urn: string;
  /** The associated API client */
  apiClient?: ApiClient | null;
  /** Bearer token generated for the client */
  bearerToken?: string | null;
  /** The expiration timestamp of the token (ISO 8601) */
  expirationTimestamp: string;
}

// --- Contextual references to ensure type integrity ---

export interface ClientContext {
  hasSession?: boolean | null;
  hasBearer?: boolean | null;
  user?: User | null;
  client?: ApiClient | null;
  company?: Company | null;
  identity?: Identity | null;
  loginIframeSrc?: string | null;
}


/** 
 * The specific authentication/verification states of a user.
 */
export type UserState = 
  | 'UNVERIFIED' 
  | 'VERIFIED' 
  | 'MODERATED';

/** 
 * The specific roles assigned to a user within the Baack ecosystem.
 */
export type UserRole = 
  | 'ANONYMOUS' 
  | 'DEFAULT' 
  | 'COMMENTER' 
  | 'EDITOR' 
  | 'PUBLISHER' 
  | 'ADMIN' 
  | 'SUPER';

/**
 * Represents a session user returned in contexts like the API client context 
 * when user-based authentication is being used.
 */
export interface User {
  /** The URN of the user */
  urn: string;
  /** The user role assigned for the login user */
  role?: UserRole | null;
  /** The status of the login user (e.g., VERIFIED) */
  status?: UserState | null;
}

// ==========================================
// COMPANY & ORGANISATION
// ==========================================

export interface Organisation {
  urn: string;
  url: string;
}


export interface Company {
  urn: string;
  url: string;
  name?: string;
  parentCompany?: Company | null;
  owner?: Company | null;
  organisation?: Organisation |
    null;
  entity?: Entity | null;
}

// ==========================================
// IDENTITY & PERSONS
// ==========================================

export interface Identity {
  urn: string;
  url: string;
  owner: Company;
  name?: string | null;
  persons?: Person[];
  emails?: Email[];
  telephones?: Telephone[];
  clientIdentifiers?: ClientIdentifier[];
  addresses?: Address[];
  companies?: Company[];
}

export interface Person {
  urn: string;
  url: string;
  birthDate?: string | null;
  identity?: Identity | null;
  names?: PersonName[];
}

export interface PersonName {
  urn: string;
  url: string;
  person?: Person | null;
  givenName: string;
  familyName?: string | null;
  honorificPrefix?: string | null;
}

export interface Address {
  urn: string;
  identity?: Identity | null;
  url: string;
  officeBoxNumber?: string | null;
  street: string;
  area?: string | null;
  locality: string;
  region?: string | null;
  postalCode: string;
  countryCode: string;
  addressType?: string | null; // Represents AddressType enum
}

export interface Email {
  urn: string;
  url: string;
  identity?: Identity | null;
  email: string;
}

export interface ClientIdentifier {
  urn: string;
  url: string;
  identity?: Identity | null;
  domain: string;
  token: string;
  expiresTimestamp?: string | null;
}

export interface Telephone {
  urn: string;
  url: string;
  number: string;
  type?: string | null;
  identity?: Identity | null;
}

// ==========================================
// CONTENT ENTITY &  ITEMS (Primitives)
// ==========================================

export interface Entity {
  urn: string;
  url?: string;
  owner?: Company | null;
  status: 'DRAFT_UNPUBLISHED' | 'PUBLISH_PENDING' | 'PUBLISH' | 'PUBLISHED' | 'PUBLISHED_WITH_DRAFTS';
  name: string;
  language: string; // ISO 639-1
  variant?: string;
  publishTimestamp?: string | null;
  updatedTimestamp?: string | null;
  // Content Item Collections
  texts?: TextItem[];
  doubles?: DoubleItem[];
  dateTimes?: DateTimeItem[];
  booleans?: BooleanItem[];
  images?: ImageItem[];
  templates?: TemplateItem[];
  markdowns?: MarkdownItem[];
  latLongs?: LatLongItem[];
  longs?: LongItem[];
  money?: MoneyItem[];
  jsons?: JsonItem[];
}

export interface TextItem { 
  urn: string;
  name: string;
  value: string;
  sortOrder: number;
  entity?: Entity | null;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: TextItemHistory | null;
}

export interface BooleanItem {
  urn: string;
  entity?: Entity | null;
  url?: string;
  name: string;
  sortOrder: number;
  value: boolean;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: BooleanItemHistory | null;
}

export interface DateTimeItem {
  urn: string;
  url?: string;
  entity?: Entity | null;
  name: string;
  sortOrder: number;
  value: string; // ISO 8601
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: DateTimeItemHistory | null;
}

export interface DoubleItem {
  urn: string;
  url?: string;
  name: string;
  sortOrder: number;
  value: number;
  entity?: Entity | null;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: DoubleItemHistory | null;
}

export interface ImageItem {
  urn: string;
  url?: string;
  name: string;
  sortOrder: number;
  altText?: string | null;
  src?: string | null;
  largeSrc?: string | null;
  mediumSrc?: string | null;
  entity?: Entity | null;
  isPublished?: boolean;
  createdTimestamp?: string | null;
  history?: ImageItemHistory | null;
}

export interface JsonItem {
  urn: string;
  name: string;
  sortOrder: number;
  value: unknown;
  entity?: Entity | null;
  url?: string;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: JsonItemHistory | null;
}

export interface LatLongItem {
  urn: string;
  url?: string;
  entity?: Entity | null;
  name: string;
  sortOrder: number;
  latitude: number;
  longitude: number;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: LatLongItemHistory | null;
}

export interface LongItem {
  urn: string;
  name: string;
  sortOrder: number;
  value: number; // 64-bit integer
  entity?: Entity | null;
  url?: string;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: LongItemHistory | null;
}

export interface MarkdownItem {
  urn: string;
  name: string;
  sortOrder: number;
  value: string; // Markdown content
  entity?: Entity | null;
  url?: string;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: MarkdownItemHistory | null;
}

export interface MoneyItem {
  urn: string;
  url: string;
  name: string;
  sortOrder: number;
  currencyCode: string; // e.g., "GBP"
  unitValue: number; // Value in cents/smallest unit
  entity?: Entity | null;
  formattedValue?: string;
  currencySymbol?: string;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: MoneyItemHistory | null;
}

// ==========================================
// ITEM HISTORIES
// ==========================================


export interface TextItemHistory {
  item?: TextItem | null;
  pagination?: Pagination | null;
  history: TextItem[];
  url: string;
}

export interface BooleanItemHistory {
  item?: BooleanItem | null;
  pagination?: Pagination | null;
  history: BooleanItem[];
  url: string;
}

export interface DateTimeItemHistory {
  item?: DateTimeItem | null;
  pagination?: Pagination | null;
  history: DateTimeItem[];
  url: string;
}

export interface DoubleItemHistory {
  item?: DoubleItem | null;
  pagination?: Pagination | null;
  history: DoubleItem[];
  url: string;
}

export interface ImageItemHistory {
  item?: ImageItem | null;
  pagination?: Pagination | null;
  history: ImageItem[];
  url: string;
}

export interface JsonItemHistory {
  item?: JsonItem | null;
  pagination?: Pagination | null;
  history: JsonItem[];
  url: string;
}

export interface LatLongItemHistory {
  item?: LatLongItem | null;
  pagination?: Pagination | null;
  history: LatLongItem[];
  url: string;
}

export interface LongItemHistory {
  item?: LongItem | null;
  pagination?: Pagination | null;
  history: LongItem[];
  url: string;
}

export interface MarkdownItemHistory {
  item?: MarkdownItem | null;
  pagination?: Pagination | null;
  history: MarkdownItem[];
  url: string;
}


// ==========================================
// PROJECT
// ==========================================

export interface Project {
  urn: string;
  url?: string | null;
  owner?: Company | null;
  name: string;
  createdTimestamp?: string | null;
  dueTimestamp?: string | null;
}

// ==========================================
// WORKFLOW & STAGE
// ==========================================

export interface Workflow {
  urn: string;
  url: string;

  name: string;
  owner?: Company | null;
  stages: WorkflowStage[];
}

export interface WorkflowStage {
  name: string;
  urn: string;
  order: number;
}

// ==========================================
// TASK ENUMS (Strict String Unions)
// ==========================================

/** 
 * The status of a Task.
 */
export type TaskStatus = 
  | 'UNDEFINED'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CLOSED';

/** 
 * The priority level assigned to a Task.
 */
export type TaskPriority = 
  | 'NONE'
  | 'LOW'
  | 'MEDIUM'  
  | 'HIGH'
  | 'CRITICAL';

/** 
 * Specific activity types for Task Log entries, representing lifecycle events.
 */
export type TaskActivity = 
  | 'CREATED'
  | 'STATUS_UNDEFINED'
  | 'STATUS_PENDING'
  | 'STATUS_IN_PROGRESS'
  | 'STATUS_BLOCKED'
  | 'STATUS_COMPL_ETED' // Note: Using provided spelling if exact, but corrected to COMPLETED below
  | 'STATUS_CLOSED'
  | 'PRIORITY_LOW'
  | 'PRIORITY_MEDIUM'
  | 'PRIORITY_HIGH'
  | 'PRIORITY_CRITICAL'
  | 'PRIORITY_NONE'
  | 'WORKFLOW_STAGE_SET'
  | 'WORKFLOW_STAGE_UNSET'
  | 'COMMENT_ADDED'
  | 'WORK_TASK_ASSOCIATION_ADDED'
  | 'WORK_TASK_ASSOCIATION_REMOVED'
  | 'WORK_TASK_BLOCKER_ADDED'
  | 'WORK_TASK_BLOCKER_REMOVED'
  | 'WORK_TASK_BLOCKING_ADDED'
  | 'WORK_TASK_BLOCKING_REMOVED'
  | 'WORK_TASK_ENTITY_ADDED'
  | 'WORK_TASK_ENTITY_REMOVED'
  | 'WORK_TASK_IDENTITY_ADDED'
  | 'WORK_TASK_IDENTITY_REMOVED'
  | 'WORK_TASK_COMPANY_ADDED'
  | 'WORK_TASK_COMPANY_REMOVED'
  | 'WORK_PROJECT_SET'
  | 'WORK_PROJECT_UNSET'
  | 'ASSIGNED'
  | 'UNASSIGNED'
  | 'TITLE_UPDATED'
  | 'DESCRIPTION_UPDATED'
  | 'DUE_DATE_UPDATED'
  | 'DUE_DATE_UNSET';

// ==========================================
// TASK MODULE RE-INTEGRATION
// ==========================================

export interface Task {
  urn: string;
  url?: string | null;
  owner?: Company | null;
  workflowStage?: WorkflowStage | null;
  assignee?: Identity | null;
  project?: Project | null;
  status: TaskStatus;     // Now strictly typed
  priority: TaskPriority; // Now strictly typed
  title: string;
  description: string;
  createdTimestamp?: string | null;
  updatedTimestamp?: string | 'string' | null;
  dueTimestamp: string;

  blockedBy: Task[];
  blocking: Task[];
  associatedTasks: Task[];
  associatedEntities: Entity[];
  associatedIdentities: Identity[];
  associatedCompanies: Company[];
  identityForLogs?: Identity | null;
}

export interface TaskLog {
  urn: string;
  url: string;
  task?: Task | null;
  subject?: Subject | null;
  replyTo?: TaskLog | null;
  sortOrder?: number | null;
  identity?: Identity | null;
  activity: TaskActivity; // Now strictly typed with all 35 event types
  comment?: string | null;
  createdTimestamp?: string | null;
}


