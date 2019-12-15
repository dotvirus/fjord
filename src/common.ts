export interface IObject {
  [key: string]: unknown;
}

export type RuleFunction<T> = (
  val: T,
  key: string,
  root: unknown
) => Promise<boolean | number | string>;

export type DefaultFunction = (root: object) => any;
