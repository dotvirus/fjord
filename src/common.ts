/**
 * Generic object
 */
export interface IObject {
  [key: string]: unknown;
}

/**
 * Rule function
 */
export type RuleFunction<T> = (
  val: T,
  key: string,
  root: unknown
) => (boolean | number | string) | Promise<boolean | number | string>;

/**
 * Function that generates some default value
 */
export type DefaultFunction = (root: object) => any;
