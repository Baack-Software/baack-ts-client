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
  client?: ApiClient | null; // Uses the updated ApiClient type above
  company?: Company | null;
  identity?: Identity | null;
  loginIframeSrc?: string | null;
}


/** Placeholder for User object referenced in ClientContext */
export interface User {
  urn: string;
  identity?: Identity | null;
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


