import { RuleFunction, DefaultFunction, IObject } from "./common";
import debug from "debug";

const log = debug("fjord");

const isString = (v: any) => typeof v == "string";
const isBoolean = (v: any) => typeof v == "boolean";
const isNumber = (v: any) => typeof v == "number";
const isInteger = (v: any) => Number.isInteger(v);
const isFloat = (v: any) => Number(v) === v && v % 1 !== 0;
const isObject = (v: any) => typeof v == "object" && v !== null;
const isArray = (v: any) => Array.isArray(v);

/**
 * Rule chaining factory
 */
export abstract class FjordHandler {
  protected rules: RuleFunction<any>[] = [];
  protected m_optional = false;
  protected m_default?: DefaultFunction | unknown;

  /**
   * Checks rules one-by-one
   */
  async check(
    value: unknown,
    key: string,
    root: unknown
  ): Promise<boolean | number | string> {
    for (const rule of this.rules) {
      log(`  Checking rule for ${key}...`);
      const result = await rule(value, key, root);
      if (result !== true) {
        log(`  Rule failed for ${key}.`);
        return result;
      }
    }
    log(`  ${key} OK.`);
    return true;
  }

  /**
   * Sets the property as optional
   */
  optional() {
    this.m_optional = true;
    return this;
  }

  /**
   * Sets a default value
   * @param value Value to be set as the default
   */
  default(value: DefaultFunction | unknown) {
    this.m_default = value;
    return this;
  }

  /**
   * Returns whether the property is optional
   */
  isOptional() {
    return this.m_optional;
  }

  /**
   * Checks if the property has a default value (only relevant when using optional)
   */
  hasDefault() {
    return this.m_default !== undefined;
  }

  /**
   * Returns the default value
   * @param root Origin object e.g. req
   */
  getDefault(root: unknown) {
    if (this.m_default !== undefined) {
      if (typeof this.m_default == "function") return this.m_default(root);
      return this.m_default;
    }
  }
}

/**
 * String factory
 */
export class FjordString extends FjordHandler {
  constructor(err?: number | string) {
    super();
    this.rules.push(v => isString(v) || err || false);
  }

  /**
   * Compares the string with the input string
   * @param val String to compare
   * @param err String or number that will be returned on fail
   */
  equals(val: string, err?: number | string) {
    this.rules.push((v: string) => v === val || err || false);
    return this;
  }

  /**
   * Store a custom function to check with
   * @param func Function to execute
   */
  custom(func: RuleFunction<string>) {
    this.rules.push(func);
    return this;
  }

  /**
   * Checks if the string has a certain minimum length
   * @param len Minimum length
   * @param err String or number that will be returned on fail
   */
  min(len: number, err?: number | string) {
    this.rules.push((v: string) => v.length >= len || err || false);
    return this;
  }

  /**
   * Checks if the string has a certain maximum length
   * @param len Maximum length
   * @param err String or number that will be returned on fail
   */
  max(len: number, err?: number | string) {
    this.rules.push((v: string) => v.length <= len || err || false);
    return this;
  }

  /**
   * Checks if the string matches input regex
   * @param regex Regex to check
   * @param err String or number that will be returned on fail
   */
  matches(regex: RegExp, err?: number | string) {
    this.rules.push((v: string) => regex.test(v) || err || false);
    return this;
  }
}

/**
 * Boolean factory
 */
export class FjordBoolean extends FjordHandler {
  constructor(err?: number | string) {
    super();
    this.rules.push(v => isBoolean(v) || err || false);
  }

  /**
   * Store a custom function to check with
   * @param func Function to execute
   */
  custom(func: RuleFunction<boolean>) {
    this.rules.push(func);
    return this;
  }

  /**
   * Checks if the boolean equals the input value
   * @param val Target value
   * @param err String or number that will be returned on fail
   */
  equals(val: boolean, err?: number | string) {
    this.rules.push((v: boolean) => v === val || err || false);
    return this;
  }

  /**
   * Checks if the boolean equals true
   * @param err String or number that will be returned on fail
   */
  true(err?: number | string) {
    this.rules.push((v: boolean) => !!v || err || false);
    return this;
  }

  /**
   * Checks if the boolean equals false
   * @param err String or number that will be returned on fail
   */
  false(err?: number | string) {
    this.rules.push((v: boolean) => !v || err || false);
    return this;
  }
}

/**
 * Number factory
 */
export class FjordNumber extends FjordHandler {
  constructor(err?: number | string) {
    super();
    this.rules.push(v => isNumber(v) || err || false);
  }

  /**
   * Checks if the number equals the input value
   * @param val Target value
   * @param err String or number that will be returned on fail
   */
  equals(val: number, err?: number | string) {
    this.rules.push((v: number) => v === val || err || false);
    return this;
  }

  /**
   * Store a custom function to check with
   * @param func Function to execute
   */
  custom(func: RuleFunction<number>) {
    this.rules.push(func);
    return this;
  }

  /**
   * Checks if the number is equal or larger than the input value
   * @param val Minimum value
   * @param err
   */
  min(val: number, err?: number | string) {
    this.rules.push((v: number) => v >= val || err || false);
    return this;
  }

  /**
   * Checks if the number is equal or smaller than the input value
   * @param val Maximum value
   * @param err String or number that will be returned on fail
   */
  max(val: number, err?: number | string) {
    this.rules.push((v: number) => v <= val || err || false);
    return this;
  }
}

/**
 * Integer factory
 */
export class FjordInteger extends FjordNumber {
  constructor(err?: number | string) {
    super(err);
    this.rules.push((v: number) => isInteger(v) || err || false);
  }
}

/**
 * Float factory
 */
export class FjordFloat extends FjordNumber {
  constructor(err?: number | string) {
    super(err);
    this.rules.push((v: number) => isFloat(v) || err || false);
  }
}

/**
 * Array factory
 */
export class FjordArray extends FjordHandler {
  of = this;

  constructor(err?: number | string) {
    super();
    this.rules.push(v => isArray(v) || err || false);
  }

  /**
   * Store a custom function to check with
   * @param func Function to execute
   */
  custom(func: RuleFunction<any[]>) {
    this.rules.push(func);
    return this;
  }

  /**
   * Checks if the length of the array is equal or larger than the input value
   * @param len Minimum value
   * @param err String or number that will be returned on fail
   */
  min(len: number, err?: number | string) {
    this.rules.push((v: any[]) => v.length >= len || err || false);
    return this;
  }

  /**
   * Checks if the length of the array is equal or smaller than the input value
   * @param len Maximum value
   * @param err String or number that will be returned on fail
   */
  max(len: number, err?: number | string) {
    this.rules.push((v: any[]) => v.length <= len || err || false);
    return this;
  }

  /**
   * Checks if the array contains the input value
   * @param val Value to check
   * @param err String or number that will be returned on fail
   */
  includes(val: any, err?: number | string) {
    this.rules.push((v: any[]) => v.includes(val) || err || false);
    return this;
  }

  /**
   * Alternative to includes()
   * @param val Value to check
   * @param err String or number that will be returned on fail
   */
  contains(val: any, err?: number | string) {
    return this.includes(val, err);
  }

  /**
   * Checks if every value of the array is a string
   * @param err String or number that will be returned on fail
   */
  strings(err?: number | string) {
    this.rules.push((v: any[]) => v.every(isString) || err || false);
    return this;
  }

  /**
   * Checks if every value of the array is a number
   * @param err String or number that will be returned on fail
   */
  numbers(err?: number | string) {
    this.rules.push((v: any[]) => v.every(isNumber) || err || false);
    return this;
  }

  /**
   * Checks if every value of the array is an integer
   * @param err String or number that will be returned on fail
   */
  integers(err?: number | string) {
    this.rules.push((v: any[]) => v.every(isInteger) || err || false);
    return this;
  }

  /**
   * Checks if every value of the array is a float
   * @param err String or number that will be returned on fail
   */
  floats(err?: number | string) {
    this.rules.push((v: any[]) => v.every(isFloat) || err || false);
    return this;
  }

  /**
   * Checks if every value of the array is an array
   * @param err String or number that will be returned on fail
   */
  arrays(err?: number | string) {
    this.rules.push((v: any[]) => v.every(i => isArray(i)) || err || false);
    return this;
  }

  /**
   * Checks if every value of the array is an object
   * @param err String or number that will be returned on fail
   */
  objects(err?: number | string) {
    this.rules.push((v: any[]) => v.every(i => isObject(i)) || err || false);
    return this;
  }

  /**
   * Checks if the function returns true for every item of the array
   * @param func Predicate
   * @param err String or number that will be returned on fail
   */
  every(func: (i: any) => boolean, err?: number | string) {
    this.rules.push((v: any[]) => v.every(func) || err || false);
    return this;
  }

  /**
   * Checks if the function returns true for at least one item of the array
   * @param func Predicate
   * @param err String or number that will be returned on fail
   */
  some(func: (i: any) => boolean, err?: number | string) {
    this.rules.push((v: any[]) => v.some(func) || err || false);
    return this;
  }

  /**
   * Alternative to every()
   * @param func Predicate
   * @param err String or number that will be returned on fail
   */
  all(func: (i: any) => boolean, err?: number | string) {
    return this.every(func, err);
  }

  /**
   * Alternative to some()
   * @param func Predicate
   * @param err String or number that will be returned on fail
   */
  any(func: (i: any) => boolean, err?: number | string) {
    return this.some(func, err);
  }
}

/**
 * Object factory
 */
export class FjordObject<T = IObject> extends FjordHandler {
  constructor(err?: number | string) {
    super();
    this.rules.push((v: T) => isObject(v) || err || false);
  }

  /**
   * Store a custom function to check with
   * @param func Function to execute
   */
  custom(func: RuleFunction<T>) {
    this.rules.push(func);
    return this;
  }
}

/**
 * Any factory
 */
export class FjordAny extends FjordHandler {
  constructor(err?: number | string) {
    super();
    this.rules.push((v: any) => v !== undefined || err || false);
  }

  /**
   * Checks if the property equals the input value
   * @param val Target value
   * @param err String or number that will be returned on fail
   */
  equals(val: any, err?: number | string) {
    this.rules.push((v: any) => v === val || err || false);
    return this;
  }

  /**
   * Store a custom function to check with
   * @param func Function to execute
   */
  custom(func: RuleFunction<any[]>) {
    this.rules.push(func);
    return this;
  }
}
