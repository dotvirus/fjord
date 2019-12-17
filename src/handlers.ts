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

export abstract class FjordHandler {
  protected rules: RuleFunction<any>[] = [];
  protected m_optional = false;
  protected m_default?: DefaultFunction | unknown;

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
   * Defines the property as optional
   */
  isOptional() {
    return this.m_optional;
  }

  /**
   * Checks if the property has a default value
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

export class FjordString extends FjordHandler {
  constructor(err?: number | string) {
    super();
    this.rules.push(async v => isString(v) || err || false);
  }

  /**
   * Compares the current property with the input string
   * @param val String to compare
   * @param err String or number that will be returned on fail
   */
  equals(val: string, err?: number | string) {
    this.rules.push(async (v: string) => v === val || err || false);
    return this;
  }

  /**
   * Executes a custom function
   * @param func Function to execute
   */
  custom(func: RuleFunction<string>) {
    this.rules.push(func);
    return this;
  }

  /**
   * Checks if the current property has a certain minimum length
   * @param len Minimum length
   * @param err String or number that will be returned on fail
   */
  min(len: number, err?: number | string) {
    this.rules.push(async (v: string) => v.length >= len || err || false);
    return this;
  }

  /**
   * Checks if the current property has a certain maximum length
   * @param len Maximum length
   * @param err String or number that will be returned on fail
   */
  max(len: number, err?: number | string) {
    this.rules.push(async (v: string) => v.length <= len || err || false);
    return this;
  }

  /**
   * Applies the input regex to the current property
   * @param regex Regex to check
   * @param err String or number that will be returned on fail
   */
  matches(regex: RegExp, err?: number | string) {
    this.rules.push(async (v: string) => regex.test(v) || err || false);
    return this;
  }
}

export class FjordBoolean extends FjordHandler {
  constructor(err?: number | string) {
    super();
    this.rules.push(async v => isBoolean(v) || err || false);
  }

  /**
   * Executes a custom function
   * @param func Function to execute
   */
  custom(func: RuleFunction<boolean>) {
    this.rules.push(func);
    return this;
  }

  /**
   * Checks if the current property equals the input value
   * @param val Target value
   * @param err String or number that will be returned on fail
   */
  equals(val: boolean, err?: number | string) {
    this.rules.push(async (v: boolean) => v === val || err || false);
    return this;
  }

  /**
   * Checks if the current property equals true
   * @param err String or number that will be returned on fail
   */
  true(err?: number | string) {
    this.rules.push(async (v: boolean) => !!v || err || false);
    return this;
  }

  /**
   * Checks if the current property equals false
   * @param err String or number that will be returned on fail
   */
  false(err?: number | string) {
    this.rules.push(async (v: boolean) => !v || err || false);
    return this;
  }
}

export class FjordNumber extends FjordHandler {
  constructor(err?: number | string) {
    super();
    this.rules.push(async v => isNumber(v) || err || false);
  }

  /**
   * Checks if the current property equals the input value
   * @param val Target value
   * @param err String or number that will be returned on fail
   */
  equals(val: number, err?: number | string) {
    this.rules.push(async (v: number) => v === val || err || false);
    return this;
  }

  /**
   * Executes a custom function
   * @param func Function to execute
   */
  custom(func: RuleFunction<number>) {
    this.rules.push(func);
    return this;
  }

  /**
   * Checks if the current property is equal or larger than the input value
   * @param val Minimum value
   * @param err
   */
  min(val: number, err?: number | string) {
    this.rules.push(async (v: number) => v >= val || err || false);
    return this;
  }

  /**
   * Checks if the current property is equal or smaller than the input value
   * @param val Maximum value
   * @param err String or number that will be returned on fail
   */
  max(val: number, err?: number | string) {
    this.rules.push(async (v: number) => v <= val || err || false);
    return this;
  }
}

export class FjordInteger extends FjordNumber {
  constructor(err?: number | string) {
    super(err);
    this.rules.push(async (v: number) => isInteger(v) || err || false);
  }
}

export class FjordFloat extends FjordNumber {
  constructor(err?: number | string) {
    super(err);
    this.rules.push(async (v: number) => isFloat(v) || err || false);
  }
}

export class FjordArray extends FjordHandler {
  of = this;

  constructor(err?: number | string) {
    super();
    this.rules.push(async v => isArray(v) || err || false);
  }

  /**
   * Executes a custom function
   * @param func Function to execute
   */
  custom(func: RuleFunction<any[]>) {
    this.rules.push(func);
    return this;
  }

  /**
   * Checks if the length of the current property is equal or larger than the input value
   * @param len Minimum value
   * @param err String or number that will be returned on fail
   */
  min(len: number, err?: number | string) {
    this.rules.push(async (v: any[]) => v.length >= len || err || false);
    return this;
  }

  /**
   * Checks if the length of the current property is equal or smaller than the input value
   * @param len Maximum value
   * @param err String or number that will be returned on fail
   */
  max(len: number, err?: number | string) {
    this.rules.push(async (v: any[]) => v.length <= len || err || false);
    return this;
  }

  /**
   * Checks if the current property contains the input value
   * @param val Value to check
   * @param err String or number that will be returned on fail
   */
  includes(val: any, err?: number | string) {
    this.rules.push(async (v: any[]) => v.includes(val) || err || false);
    return this;
  }

  /**
   * Checks if the current property contains the input value. Alternative to includes()
   * @param val Value to check
   * @param err String or number that will be returned on fail
   */
  contains(val: any, err?: number | string) {
    return this.includes(val, err);
  }

  /**
   * Checks if every value of the current property is a string
   * @param err String or number that will be returned on fail
   */
  strings(err?: number | string) {
    this.rules.push(async (v: any[]) => v.every(isString) || err || false);
    return this;
  }

  /**
   * Checks if every value of the current property is a number
   * @param err String or number that will be returned on fail
   */
  numbers(err?: number | string) {
    this.rules.push(async (v: any[]) => v.every(isNumber) || err || false);
    return this;
  }

  /**
   * Checks if every value of the current property is an integer
   * @param err String or number that will be returned on fail
   */
  integers(err?: number | string) {
    this.rules.push(async (v: any[]) => v.every(isInteger) || err || false);
    return this;
  }

  /**
   * Checks if every value of the current property is a float
   * @param err String or number that will be returned on fail
   */
  floats(err?: number | string) {
    this.rules.push(async (v: any[]) => v.every(isFloat) || err || false);
    return this;
  }

  /**
   * Checks if every value of the current property is an array
   * @param err String or number that will be returned on fail
   */
  arrays(err?: number | string) {
    this.rules.push(
      async (v: any[]) => v.every(i => isArray(i)) || err || false
    );
    return this;
  }

  /**
   * Checks if every value of the current property is an object
   * @param err String or number that will be returned on fail
   */
  objects(err?: number | string) {
    this.rules.push(
      async (v: any[]) => v.every(i => isObject(i)) || err || false
    );
    return this;
  }

  every(func: (i: any) => boolean, err?: number | string) {
    this.rules.push(async (v: any[]) => v.every(func) || err || false);
    return this;
  }

  some(func: (i: any) => boolean, err?: number | string) {
    this.rules.push(async (v: any[]) => v.some(func) || err || false);
    return this;
  }

  all(func: (i: any) => boolean, err?: number | string) {
    return this.every(func, err);
  }

  any(func: (i: any) => boolean, err?: number | string) {
    return this.some(func, err);
  }
}

export class FjordObject<T = IObject> extends FjordHandler {
  constructor(err?: number | string) {
    super();
    this.rules.push(async (v: T) => isObject(v) || err || false);
  }

  custom(func: RuleFunction<T>) {
    this.rules.push(func);
    return this;
  }
}

export class FjordAny extends FjordHandler {
  constructor(err?: number | string) {
    super();
    this.rules.push(async (v: any) => v !== undefined || err || false);
  }

  equals(val: any, err?: number | string) {
    this.rules.push(async (v: any) => v === val || err || false);
    return this;
  }

  custom(func: RuleFunction<any[]>) {
    this.rules.push(func);
    return this;
  }
}
