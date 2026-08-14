/**
 * EntityView
 * ----------
 * A thin, read-only wrapper around a raw `Entity` returned from the
 * ENTITY_VIEW endpoint. The raw Entity models content as parallel
 * collections (`texts`, `markdowns`, `images`, `booleans`, `doubles`,
 * `longs`, `money`, `dateTimes`, `latLongs`, `jsons`, `templates`), each
 * entry identified by a `name` and ordered by `sortOrder`.
 *
 * EntityView hides that navigation and gives you name-based accessors that
 * return the underlying item (not just its scalar value), so you still have
 * access to metadata like `isPublished`, `history`, etc. Each single-item
 * accessor also takes an optional `sortOrder`, which defaults to 0, so you
 * can reach a specific entry in a repeated field:
 *
 *   const view = new EntityView(entity);
 *   view.text('headline');               // TextItem | undefined (sortOrder 0)
 *   view.text('gallery-captions', 2);    // TextItem | undefined (sortOrder 2)
 *   view.markdown('body');                // MarkdownItem | undefined
 *   view.image('hero');                   // ImageItem | undefined
 *   view.texts('gallery-captions');       // TextItem[] (all entries, sortOrder-ordered)
 *
 * Adjust the import path below to wherever your generated types actually
 * live (e.g. 'baack-ts-client' if published, or a relative path into
 * this repo).
 */

import type {
  Entity,
  TextItem,
  MarkdownItem,
  TemplateItem,
  BooleanItem,
  DoubleItem,
  LongItem,
  MoneyItem,
  DateTimeItem,
  ImageItem,
  LatLongItem,
  JsonItem
} from './types/index.ts';
import { BaackClient } from './client.ts';
import { Endpoint } from './endpoints.ts';

/** Anything shaped like an Entity content item (has a name + sortOrder). */
interface NamedItem {
  name: string;
  sortOrder: number;
}

export class EntityView {
  constructor(private readonly entity: Entity) {}

  // ---------------------------------------------------------------------
  // Metadata
  // ---------------------------------------------------------------------

  get urn(): string {
    return this.entity.urn;
  }

  get name(): string {
    return this.entity.name;
  }

  get status(): Entity['status'] {
    return this.entity.status;
  }

  get language(): string {
    return this.entity.language;
  }

  get variant(): string | undefined {
    return this.entity.variant;
  }

  get publishedAt(): Date | undefined {
    return this.entity.publishTimestamp ? new Date(this.entity.publishTimestamp) : undefined;
  }

  get updatedAt(): Date | undefined {
    return this.entity.updatedTimestamp ? new Date(this.entity.updatedTimestamp) : undefined;
  }

  /** Escape hatch back to the untouched Entity, for anything not yet covered. */
  get raw(): Entity {
    return this.entity;
  }

  // ---------------------------------------------------------------------
  // Generic helpers
  // ---------------------------------------------------------------------

  /**
   * Returns every item in a collection matching `name`, ordered by sortOrder.
   * Collections legitimately support multiple items sharing a name (e.g. a
   * repeated "gallery-image" field), so this is the base primitive that all
   * single-value accessors build on.
   */
  private allByName<T extends NamedItem>(
    items: T[] | undefined,
    name: string,
  ): T[] {
    if (!items) return [];
    return items
      .filter((item) => item.name === name)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Returns the item matching both `name` and `sortOrder`. Most fields only
   * ever have a single item at `sortOrder` 0, so that's the default — pass
   * an explicit `sortOrder` to reach a specific entry in a repeated field.
   */
  private byNameAndSortOrder<T extends NamedItem>(
    items: T[] | undefined,
    name: string,
    sortOrder = 0,
  ): T | undefined {
    return items?.find((item) => item.name === name && item.sortOrder === sortOrder);
  }

  /**
   * True if any content collection on the entity has an item with this name.
   * Useful for conditionally rendering optional sections.
   */
  has(name: string): boolean {
    const { texts, markdowns, templates, booleans, doubles, longs, money, dateTimes, images, latLongs, jsons } =
      this.entity;
    return [texts, markdowns, templates, booleans, doubles, longs, money, dateTimes, images, latLongs, jsons].some(
      (collection) => (collection as NamedItem[] | undefined)?.some((item) => item.name === name),
    );
  }

  private hasByNameAndSortOrder<T extends NamedItem>(
    items: T[] | undefined,
    name: string,
    sortOrder = 0,
  ): boolean {
    return this.byNameAndSortOrder(items, name, sortOrder) !== undefined;
  }

  hasText(name: string, sortOrder = 0): boolean {
    return this.hasByNameAndSortOrder(this.entity.texts, name, sortOrder);
  }

  hasMarkdown(name: string, sortOrder = 0): boolean {
    return this.hasByNameAndSortOrder(this.entity.markdowns, name, sortOrder);
  }

  hasTemplate(name: string, sortOrder = 0): boolean {
    return this.hasByNameAndSortOrder(this.entity.templates, name, sortOrder);
  }

  hasBoolean(name: string, sortOrder = 0): boolean {
    return this.hasByNameAndSortOrder(this.entity.booleans, name, sortOrder);
  }

  hasDouble(name: string, sortOrder = 0): boolean {
    return this.hasByNameAndSortOrder(this.entity.doubles, name, sortOrder);
  }

  hasLong(name: string, sortOrder = 0): boolean {
    return this.hasByNameAndSortOrder(this.entity.longs, name, sortOrder);
  }

  /** True if either a double or a long item exists with this name/sortOrder. */
  hasNumber(name: string, sortOrder = 0): boolean {
    return this.hasDouble(name, sortOrder) || this.hasLong(name, sortOrder);
  }

  hasMoney(name: string, sortOrder = 0): boolean {
    return this.hasByNameAndSortOrder(this.entity.money, name, sortOrder);
  }

  hasDate(name: string, sortOrder = 0): boolean {
    return this.hasByNameAndSortOrder(this.entity.dateTimes, name, sortOrder);
  }

  hasImage(name: string, sortOrder = 0): boolean {
    return this.hasByNameAndSortOrder(this.entity.images, name, sortOrder);
  }

  hasLatLong(name: string, sortOrder = 0): boolean {
    return this.hasByNameAndSortOrder(this.entity.latLongs, name, sortOrder);
  }

  hasJson(name: string, sortOrder = 0): boolean {
    return this.hasByNameAndSortOrder(this.entity.jsons, name, sortOrder);
  }

  // ---------------------------------------------------------------------
  // Text
  // ---------------------------------------------------------------------

  text(name: string, sortOrder = 0): TextItem | undefined {
    return this.byNameAndSortOrder<TextItem>(this.entity.texts, name, sortOrder);
  }

  texts(name: string): TextItem[] {
    return this.allByName<TextItem>(this.entity.texts, name);
  }

  /** Like `text`, but throws if the field is missing — for required content. */
  requireText(name: string, sortOrder = 0): TextItem {
    const item = this.text(name, sortOrder);
    if (item === undefined) {
      throw new Error(`EntityView: missing required text item "${name}" on entity ${this.entity.urn}`);
    }
    return item;
  }

  // ---------------------------------------------------------------------
  // Markdown
  // ---------------------------------------------------------------------

  markdown(name: string, sortOrder = 0): MarkdownItem | undefined {
    return this.byNameAndSortOrder<MarkdownItem>(this.entity.markdowns, name, sortOrder);
  }

  markdowns(name: string): MarkdownItem[] {
    return this.allByName<MarkdownItem>(this.entity.markdowns, name);
  }

  // ---------------------------------------------------------------------
  // Template
  // ---------------------------------------------------------------------

  template(name: string, sortOrder = 0): TemplateItem | undefined {
    return this.byNameAndSortOrder<TemplateItem>(this.entity.templates, name, sortOrder);
  }

  templates(name: string): TemplateItem[] {
    return this.allByName<TemplateItem>(this.entity.templates, name);
  }

  // ---------------------------------------------------------------------
  // Boolean
  // ---------------------------------------------------------------------

  boolean(name: string, sortOrder = 0): BooleanItem | undefined {
    return this.byNameAndSortOrder<BooleanItem>(this.entity.booleans, name, sortOrder);
  }

  booleans(name: string): BooleanItem[] {
    return this.allByName<BooleanItem>(this.entity.booleans, name);
  }

  // ---------------------------------------------------------------------
  // Numbers (double / long kept distinct to match the underlying API)
  // ---------------------------------------------------------------------

  double(name: string, sortOrder = 0): DoubleItem | undefined {
    return this.byNameAndSortOrder<DoubleItem>(this.entity.doubles, name, sortOrder);
  }

  doubles(name: string): DoubleItem[] {
    return this.allByName<DoubleItem>(this.entity.doubles, name);
  }

  long(name: string, sortOrder = 0): LongItem | undefined {
    return this.byNameAndSortOrder<LongItem>(this.entity.longs, name, sortOrder);
  }

  longs(name: string): LongItem[] {
    return this.allByName<LongItem>(this.entity.longs, name);
  }

  /** Convenience: checks doubles first, falls back to longs, for callers who don't care which. */
  number(name: string, sortOrder = 0): DoubleItem | LongItem | undefined {
    return this.double(name, sortOrder) ?? this.long(name, sortOrder);
  }

  // ---------------------------------------------------------------------
  // Money
  // ---------------------------------------------------------------------

  money(name: string, sortOrder = 0): MoneyItem | undefined {
    return this.byNameAndSortOrder<MoneyItem>(this.entity.money, name, sortOrder);
  }

  moneys(name: string): MoneyItem[] {
    return this.allByName<MoneyItem>(this.entity.money, name);
  }

  // ---------------------------------------------------------------------
  // DateTime
  // ---------------------------------------------------------------------

  date(name: string, sortOrder = 0): DateTimeItem | undefined {
    return this.byNameAndSortOrder<DateTimeItem>(this.entity.dateTimes, name, sortOrder);
  }

  dates(name: string): DateTimeItem[] {
    return this.allByName<DateTimeItem>(this.entity.dateTimes, name);
  }

  // ---------------------------------------------------------------------
  // Images
  // ---------------------------------------------------------------------

  image(name: string, sortOrder = 0): ImageItem | undefined {
    return this.byNameAndSortOrder<ImageItem>(this.entity.images, name, sortOrder);
  }

  images(name: string): ImageItem[] {
    return this.allByName<ImageItem>(this.entity.images, name);
  }

  // ---------------------------------------------------------------------
  // LatLong
  // ---------------------------------------------------------------------

  latLong(name: string, sortOrder = 0): LatLongItem | undefined {
    return this.byNameAndSortOrder<LatLongItem>(this.entity.latLongs, name, sortOrder);
  }

  latLongs(name: string): LatLongItem[] {
    return this.allByName<LatLongItem>(this.entity.latLongs, name);
  }

  // ---------------------------------------------------------------------
  // JSON
  // ---------------------------------------------------------------------

  json(name: string, sortOrder = 0): JsonItem | undefined {
    return this.byNameAndSortOrder<JsonItem>(this.entity.jsons, name, sortOrder);
  }

  jsons(name: string): JsonItem[] {
    return this.allByName<JsonItem>(this.entity.jsons, name);
  }

  // ---------------------------------------------------------------------
  // Static helpers
  // ---------------------------------------------------------------------

  /**
   * Fetches an entity view from the API and wraps it directly, so callers
   * never have to touch the raw Entity at all:
   *
   *   const view = await EntityView.fetch(client, '/home');
   */
  static async fetch(client: BaackClient, path: string): Promise<EntityView> {
    const entity = await client.read<Entity>(Endpoint.ENTITY_VIEW, path);
    return new EntityView(entity);
  }

  /** Wrap an Entity you already fetched some other way. */
  static from(entity: Entity): EntityView {
    return new EntityView(entity);
  }
}
