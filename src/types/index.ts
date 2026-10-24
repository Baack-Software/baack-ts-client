/**
 * BAACK.CO CLIENT - TYPE DEFINITIONS
 */

// ==========================================
// SYSTEM & INFRASTRUCTURE
// ==========================================

/**
 * General API error object, returned with a failed request.
 */
export type ApiCode =
  | 'INVALID_REPRESENTATION'
  | 'REPRESENTATION_MISSING_REQUIRED_FIELD'
  | 'READ_SUCCESS'
  | 'UPDATE_SUCCESS'
  | 'DELETE_SUCCESS'
  | 'NOT_FOUND'
  | 'CREATE_SUCCESS'
  | 'BAD_REQUEST'
  | 'QUOTA_EXCEEDED';

export interface ApiError {
  apiCode?: ApiCode;
  /** A human-readable description of the problem. */
  detail?: string;
  httpCode?: number;
  /** For a form post (`BaackClient.submitForm`), the fields that were refused, by form field name. */
  fields?: FormFieldError[];
}

/** A refused form field: its name in the form, and what's wrong with it. */
export interface FormFieldError {
  name: string;
  detail?: string;
}

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
  urn?: string;
  url?: string;
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

/** The product an account is on. */
export type AccountProduct = 'STANDARD' | 'STARTUP_INITIAL' | 'BUSINESS_INITIAL' | 'ENTERPRISE_INITIAL';

/**
 * An account: Baack's record of a customer, as given when the account was set up. It's Baack's data, not the
 * customer's: an administrator of the account's owned company (through its `organisation`) can read it to check
 * their details, but that doesn't let them change it through the API. Accounts are created and updated with the
 * account setup form (`Endpoint.ACCOUNT_SETUP`).
 */
export interface Account {
  urn: string;
  product?: AccountProduct | null;
  /** The billing currency, an ISO 4217 code such as `GBP`. */
  currency?: string | null;
  website?: string | null;
  domainName?: string | null;
  ukCompanyNumber?: string | null;
  ukDunsNumber?: string | null;
  euBris?: string | null;
  /** Baack's customer company for the account, owned by Baack: the company that is billed. */
  baackCustomer?: Company | null;
  /**
   * Baack's customer identity that pays: the person who set up the account, with the names, telephone and billing
   * address given then.
   */
  remitter?: Identity | null;
  /** The organisation of the customer's own (owned) company, which holds their data on Baack. */
  organisation?: Organisation | null;
}

/** The accounts whose owned company the session user administers, from `Endpoint.ACCOUNTS`. */
export interface Accounts {
  accounts?: Account[];
}

/** A page of the companies the caller can manage, from `Endpoint.COMPANIES`. */
export interface CompanyPage {
  companies?: Company[];
  /** The next page's URL, when there are more companies. */
  nextPageUrl?: string | null;
}

// ==========================================
// IDENTITY & PERSONS
// ==========================================

export interface Identity {
  urn: string;
  url: string;
  owner: Company;
  label?: string | null;
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
  addressType?: string | null; // Represents AddressType
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
  links?: LinkItem[];
  references?: ReferenceItem[];
  /**
   * Entity view only: the other language versions of the returned entity, in
   * the same variant, as shallow links. Absent when there are none, and
   * ignored on update. For `<link rel="alternate" hreflang>`.
   */
  alternativeLanguages?: Entity[];
}

export interface TextItem { 
  urn?: string;
  url?: string;
  name: string;
  value: string;
  sortOrder: number;
  entity?: Entity | null;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: TextItemHistory | null;
}

export interface TemplateItem {
  urn?: string;
  url?: string;
  name: string;
  value: string;
  sortOrder: number;
  entity?: Entity | null;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: TextItemHistory | null;
}

export interface BooleanItem {
  urn?: string;
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
  urn?: string;
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
  urn?: string;
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
  urn?: string;
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
  urn?: string;
  url?: string;
  name: string;
  sortOrder: number;
  /** Any JSON object, sent and returned as structured JSON, not as a string. */
  value: unknown;
  entity?: Entity | null;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: JsonItemHistory | null;
}

export interface LatLongItem {
  urn?: string;
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
  urn?: string;
  url?: string;
  name: string;
  sortOrder: number;
  value: number; // 64-bit integer
  entity?: Entity | null;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: LongItemHistory | null;
}

export interface MarkdownItem {
  urn?: string;
  url?: string;
  name: string;
  sortOrder: number;
  value: string; // Markdown content
  entity?: Entity | null;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: MarkdownItemHistory | null;
}

export interface LinkItem {
  urn?: string;
  url?: string;
  name: string;
  sortOrder: number;
  href: string;
  rel?: string;
  text?: string;
  lang?: string;
  entity?: Entity | null;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: LinkItemHistory | null;
}

export interface ReferenceItem {
  urn?: string;
  url?: string;
  name: string;
  sortOrder: number;
  entityReference: Entity;
  entity?: Entity | null;
  isPublished?: boolean | null;
  createdTimestamp?: string | null;
  history?: ReferenceItemHistory | null;
}

export interface MoneyItem {
  urn?: string;
  url?: string;
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

export interface MoneyItemHistory {
  item?: MoneyItem | null;
  pagination?: Pagination | null;
  history: MoneyItem[];
  url: string;
}

export interface LinkItemHistory {
  item?: LinkItem | null;
  pagination?: Pagination | null;
  history: LinkItem[];
  url: string;
}

export interface ReferenceItemHistory {
  item?: ReferenceItem | null;
  pagination?: Pagination | null;
  history: ReferenceItem[];
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
  | 'STATUS_COMPLETED'
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

// In the context of a task log the subject is the reference to the assignee on assignment
export type SubjectType =
| 'WORKFLOW_STAGE'
| 'ASSOCIATION'
| 'DEPENDENCY'
| 'ENTITY'
| 'IDENTITY'
| 'COMPANY'
| 'PROJECT'
| 'ASSIGNEE'
;

export interface Subject {
  urn: string;
  url: string;
  type: SubjectType;
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


/**
 * SEARCH MODULE
 */

export type SearchState = 
  | 'PENDING' 
  | 'RUNNING' 
  | 'PARTIAL_RESULT' 
  | 'FULL_RESULT';

export type SearchOrder = 'UNDEFINED' | 'NAME';

export type IncludeScope = 
  | 'API_CLIENT'
  | 'COMPANY'
  | 'ENTITY' 
  | 'ENTITY_LIST' 
  | 'GROUP' 
  | 'GROUP_MEMBERSHIP' 
  | 'IDENTITY' 
  | 'PERMISSION'
  | 'PROJECT' 
  | 'TASK'
  | 'WEBHOOK_SUBSCRIPTION'
  | 'WEBHOOK_TRIGGER'
  | 'WORKFLOW';

/**
 * The specific type of content returned in a search result item.
 */
export type SearchItemType = 
  | 'API_CLIENT'
  | 'COMPANY'
  | 'ENTITY' 
  | 'ENTITY_LIST' 
  | 'GROUP' 
  | 'GROUP_MEMBERSHIP' 
  | 'IDENTITY' 
  | 'PERMISSION'
  | 'PROJECT' 
  | 'TASK'
  | 'WEBHOOK_SUBSCRIPTION'
  | 'WEBHOOK_TRIGGER'
  | 'WORKFLOW';


/**
 * Represents a search operation and its associated results.
 */
export interface Search {
  /** The URN of the search */
  urn?: string;
  /** The URL to access for results of the search */
  url?: string;
  /** The company owner of this search */
  owner?: Company | null;
  /** The timestamp this search was created (ISO 8601) */
  createdTimestamp?: string | null;
  /** The timestamp of the last update (ISO 8601) */
  updatedTimestamp?: string | null;
  /** The current state of the search process */
  status?: SearchState | null;
  /** The requested ordering of search results */
  order?: SearchOrder | null;
  /** The collection of scopes to include in the search scope */
  includeScopes: IncludeScope[];
  /** The actual result items found by the search */
  items?: SearchItem[];
  /** Pagination details for navigating through large result sets */
  pagination?: Pagination | null;
}

/**
 * Represents a single item returned within a search result.
 * This is a polymorphic type that can contain different content models.
 */
export interface SearchItem {
  /** The URN of the result item */
  urn: string;
  /** The URL to access the specific item */
  url: string;
  /** The sort ordering value used internally to rank results */
  sortOrder?: number | null;
  /** The category/type of this search item */
  type: SearchItemType;
  /** The display name of the search item (if applicable) */
  name?: string | null;
  /**
   * The actual content of the item, matching `type`.
   * This is a union of all possible searchable entities.
   */
  item?:
    | ApiClient
    | Entity
    | EntityList
    | Group
    | GroupMembership
    | Identity
    | Permission
    | Project
    | Task
    | WebhookSubscription
    | WebhookTrigger
    | Workflow
    | null;
}

/**
 * A group of identities (people) which can be used for various purposes 
 * like permissions or collections of identities like a mailing list or a community.
 */
export interface Group {
  /** The URN of the membership group */
  urn?: string;
  /** The URL of the membership group */
  url?: string;
  /** The name of the membership group (Max length 255) */
  name: string;
  /** The company which owns the group */
  owner?: Company | null;
  /** Content entities associated with the group */
  entity?: Entity | null;
}

/** 
 * The specific states for a group membership configuration.
 */
export type MembershipState = 
  | 'PENDING_ACCEPTANCE'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'BLOCKED_BY_MEMBER'
  | 'BANNED_BY_OWNER';

/** 
 * The method by which a user was enrolled in a group (for compliance reporting).
 */
export type MembershipEnrollment = 
  | 'BY_MEMBER_WITH_CONSENT' 
  | 'BY_OWNER_WITHOUT_CONSENT';

/** 
 * User preference for receiving notifications via various channels.
 */
export type NotificationState = 
  | 'SUBSCRIBED' 
  | 'UNSUBSCRIBED';

/**
 * Represents a group membership configuration.
 * Note that the presence of a membership does not imply that the membership is active.
 */
export interface GroupMembership {
  /** The URN for the membership configuration */
  urn: string;
  /** The URL for accessing this membership configuration */
  url?: string | null;
  /** The membership group this subscription configuration is associated with */
  group?: Group | null;
  /** The identity this group membership configuration is provided for */
  identity?: Identity | null;
  /** The state of the membership (e.g., ACTIVE) */
  status?: MembershipState | null;
  /** The enrollment criteria actor (e.g., BY_MEMBER_WITH_CONSENT) */
  enrollment?: MembershipEnrollment | null;
  /** Email notification preference for group notifications */
  emailNotification?: NotificationState | null;
  /** SMS notification preference for group notifications */
  smsNotification?: NotificationState | null;
  /** In-app notification preference for group notifications */
  inAppNotification?: NotificationState | null;
}

export type ThreadPurpose =
| 'GENERAL'
| 'CHANGELOG'
| 'BAACK_CUSTOMER_SUPPORT'
| 'SUPPORT'
| 'PROJECT_DISCUSSION'
| 'TASK_DISCUSSION'
| 'COMPANY_DISCUSSION'
| 'PAYMENT_INVOICE_DISCUSSION'
| 'ENTITY_DISCUSSION'
;

export interface MessageThread {
  urn?: string;
  url?: string;
  name: string;
  purpose: ThreadPurpose;
  group: Group;
  companies?: Company[];
  tasks?: Task[];
  projects?: Project[];
  entities?: Entity[];
  pagination?: Pagination;
  posts: ThreadPost[];
}

export interface ThreadPost {
  urn?: string;
  url?: string;
  messageThread?: MessageThread;
  authorIdentity: Identity;
  content: string;
  replyTo: ThreadPost;
  createdTimestamp?: string | null;
}

export interface IdentityNotificationInbox {
  pagination?: Pagination;
  notifications: ThreadNotification[];
}

export interface ThreadNotification {
  urn?: string;
  url?: string;
  messageThread: MessageThread;
  identity?: Identity;
  notificationCount: number;
  updatedTimestamp: string;
}



// ==========================================
// ENTITY LIST MODULE
// ==========================================

/**
 * An entity list for a collection of entity references.
 * Note: The returned list respects the natural ordering of the sort order field.
 */
export interface EntityList {
  /** The URN for this entity list */
  urn: string;
  /** The URL for the entity list */
  url?: string | null;
  /** The company owner of this entity list */
  owner?: Company | null;
  /** The name associated with this list of entities */
  name: string;
  /** The collection of entity list items, including their sort order */
  entities: EntityListItem[];
}

/**
 * A reference to an entity within a list, including its sorting position.
 */
export interface EntityListItem {
  /** The URN of the entity item */
  urn: string;
  /**
   * The listed entity. Links are shallow: the list returns it with only `urn`
   * (and `url`) set and does not render it; read its view to hydrate it. A
   * full Entity can be sent here, and only its URN is stored.
   */
  entity: Entity;
  /** The sort order for the entity in the listing */
  sortOrder?: number | null;
}


// ==========================================
// PERMISSIONS
// ==========================================

/** The kinds of subject and object a permission grant can name. */
export type PermissionScope =
  | 'ANY'
  | 'ACCOUNT'
  | 'API_CLIENT'
  | 'COMPANY'
  | 'EMAIL_ADDRESS'
  | 'ENTITY'
  | 'ENTITY_LIST'
  | 'GROUP'
  | 'GROUP_MEMBERSHIP'
  | 'IDENTITY'
  | 'ORGANISATION'
  | 'PAYMENT_CARD'
  | 'PERSON'
  | 'PROJECT'
  | 'ROLE'
  | 'TASK'
  | 'USER'
  | 'OAUTH_TOKEN';

/** What a permission grant allows. */
export type PermissionLabel =
  | 'ALL'
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'ADMINISTER'
  | 'MODERATE'
  | 'ARCHIVE';

/**
 * A permission grant: a subject (e.g. an identity or API client) may do
 * `label` to an object (e.g. a company or entity), between optional dates.
 */
export interface Permission {
  urn: string;
  url?: string;
  /** The company that owns this grant */
  owner?: Company | null;
  subjectUrn: string;
  subjectScope?: PermissionScope | null;
  label?: PermissionLabel | null;
  objectUrn: string;
  objectScope?: PermissionScope | null;
  /** When the grant starts (ISO 8601) */
  fromTimestamp?: string | null;
  /** When the grant ends (ISO 8601), if it does */
  toTimestamp?: string | null;
}

/**
 * A role for role based access control. Identities and API clients
 * associated with the role get its permissions.
 */
export interface Role {
  urn: string;
  url?: string;
  /** The company that owns this role */
  owner?: Company | null;
  name?: string | null;
  identities?: Identity[];
  clients?: ApiClient[];
}


// ==========================================
// WEBHOOKS
// ==========================================

/** How a webhook delivery authenticates to its destination. */
export type WebhookAuth = 'BASIC' | 'DIGEST' | 'BEARER' | 'HMAC_SHA256';

/** The changes a webhook subscription is triggered by. */
export type WebhookEvent = 'ALL' | 'CREATE' | 'UPDATE' | 'DELETE';

/** The kind of object a webhook watches. */
export type WebhookSubject =
  | 'UNKNOWN'
  | 'ADDRESS'
  | 'API_CLIENT'
  | 'BEARER_TOKEN'
  | 'BOOLEAN_ITEM'
  | 'CLIENT_IDENTIFIER'
  | 'COMPANY'
  | 'DATETIME_ITEM'
  | 'DOUBLE_ITEM'
  | 'EMAIL'
  | 'ENTITY'
  | 'ENTITY_LIST'
  | 'GROUP'
  | 'GROUP_MEMBERSHIP'
  | 'IDENTITY'
  | 'JSON_ITEM'
  | 'LINK_ITEM'
  | 'REFERENCE_ITEM'
  | 'IMAGE_ITEM'
  | 'LATLONG_ITEM'
  | 'LONG_ITEM'
  | 'MARKDOWN_ITEM'
  | 'MESSAGE_THREAD'
  | 'MESSAGE_THREAD_NOTIFICATION'
  | 'MONEY_ITEM'
  | 'OAUTH_TOKEN'
  | 'PERMISSION'
  | 'PERSON'
  | 'PERSON_NAME'
  | 'PROJECT'
  | 'ROLE'
  | 'TASK'
  | 'TELEPHONE'
  | 'TEMPLATE_ITEM'
  | 'TEXT_ITEM'
  | 'THREAD_POST'
  | 'WEBHOOK_SUBSCRIPTION'
  | 'WORKFLOW';

/**
 * A subscription that calls `destinationUrl` when a watched kind of object
 * changes. `secret` is write-only in spirit: required on create, and never
 * to be shown back to users.
 */
export interface WebhookSubscription {
  urn: string;
  url?: string;
  /** The API client deliveries are made as */
  apiClient?: ApiClient | null;
  auth?: WebhookAuth | null;
  subject?: WebhookSubject | null;
  event?: WebhookEvent | null;
  /** The most deliveries a minute */
  eventsPerMinute?: number | null;
  /** When the subscription stops (ISO 8601) */
  expirationTimestamp?: string | null;
  destinationUrl?: string | null;
  /** Required on create; never display it */
  secret?: string | null;
}

/** A bearer token for an API client, from `Endpoint.BEARER_TOKEN`. The token is returned when it's created. */
export interface BearerToken {
  urn: string;
  url?: string;
  apiClient?: ApiClient | null;
  /** The token itself: keep it server-side, and never log or display it after it's first shown. */
  bearerToken?: string | null;
  /** When the token stops working (ISO 8601); required on create. */
  expirationTimestamp?: string | null;
}

/** One time watched changes fired one or more subscriptions. */
export interface WebhookTrigger {
  urn: string;
  url?: string;
  owner?: Company | null;
  /** The subscriptions this trigger fired */
  subscriptions?: WebhookSubscription[] | null;
  /** The URN of the object that changed */
  targetUrn?: string | null;
  subject?: WebhookSubject | null;
  event?: WebhookEvent | null;
  /** When it fired (ISO 8601) */
  timestamp?: string | null;
  /** Delivery attempts; their shape isn't specified yet */
  deliveries?: unknown[] | null;
}


// ==========================================
// STATISTICS
// ==========================================

/** One day of a usage series: its date (`2026-10-17`) and a count per series key. */
export interface UsagePoint {
  date: string;
  [series: string]: number | string;
}

/**
 * A company's daily API usage from `Endpoint.STAT_USAGE`, shaped for charts:
 * a label per series key, and one point a day. Days without calls are left
 * out. Readable only in an administrator's session.
 */
export interface UsageStats {
  chartConfig: Record<string, { label: string }>;
  data: UsagePoint[];
}
