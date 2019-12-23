import PTree from "@dotvirus/ptree";
import {
  FjordHandler,
  FjordFloat,
  FjordInteger,
  FjordNumber,
  FjordString,
  FjordArray,
  FjordObject,
  FjordAny,
  FjordBoolean
} from "./handlers";
import { IObject } from "./common";
import debug from "debug";

const log = debug("fjord");

function normalizeToArray<T>(val: T | T[]) {
  if (Array.isArray(val)) return val;
  return [val];
}

export type TransformFunction = (
  val: any,
  key: string,
  root: unknown
) => unknown | Promise<unknown>;

export type VoidFunction = (
  value: unknown,
  key: string,
  root: unknown
) => void | Promise<void>;

export interface IFjordOptions {
  /**
   * Triggers before applying any transformations or validating rules
   * @param value Value that failed the validation
   * @param key Key that failed the validation
   * @param root Origin object e.g. req
   */
  before: VoidFunction;
  /**
   * Transforms the value before validating rules
   * @param val Value to transform
   * @param key Key of the value
   * @param root Origin object e.g. req
   */
  transformBefore: TransformFunction | TransformFunction[];
  /**
   * Transforms the value after validating rules
   * @param val Value to transform
   * @param key Key of the value
   * @param root Origin object e.g. req
   */
  transformAfter: TransformFunction | TransformFunction[];
  /**
   * Triggers after applying transformations and validating rules
   * @param value Value that failed the validation
   * @param key Key that failed the validation
   * @param root Origin object e.g. req
   */
  after: VoidFunction;
  /**
   * Triggers whenever validation fully succeeds
   * @param root Origin object e.g. req
   */
  onSuccess: (root: unknown) => Promise<void>;
  /**
   * Triggers whenever validation fails
   * @param value Value that failed the validation
   * @param key Key that failed the validation
   * @param root Origin object e.g. req
   */
  onFail: VoidFunction;
  /**
   * Triggers whenever a default value is set for the property
   * @param value Value that failed the validation
   * @param key Key that failed the validation
   * @param root Origin object e.g. req
   */
  onDefault: VoidFunction;
}

interface IValidationRule {
  /**
   * Object property
   */
  key: string;
  /**
   * Triggers before applying any transformations or validating rules
   */
  before?: VoidFunction;
  /**
   * Transforms the value before validating rules
   */
  transformBefore?: TransformFunction | TransformFunction[];
  /**
   * Transforms the value after validating rules
   */
  transformAfter?: TransformFunction | TransformFunction[];
  /**
   * Triggers after applying transformations and validating rules
   */
  after?: VoidFunction;
  /**
   * Rule chaining
   */
  handler: FjordHandler;
}

/**
 * GraphQL Resolver function
 * https://graphql.org/learn/execution/#root-fields-resolvers
 */
type IGraphQLResolver = (
  parent: any,
  args: any,
  ctx: any,
  info: any
) => Promise<any>;

/**
 * Main class
 */
export default class FjordInstance {
  options: IFjordOptions;

  constructor(opts?: Partial<IFjordOptions>) {
    this.options = {
      before: async () => {},
      transformBefore: async v => v,
      transformAfter: async v => v,
      after: async () => {},
      onSuccess: async () => {},
      onFail: async () => {},
      onDefault: async () => {}
    };
    if (opts) Object.assign(this.options, opts);
  }

  private async runBefore(
    value: unknown,
    key: string,
    root: unknown,
    add: VoidFunction | VoidFunction[] = []
  ) {
    const before = normalizeToArray(this.options.before).concat(add);

    if (before.length) {
      for (const func of before) {
        await func(value, key, root);
      }
    }
  }

  private async runAfter(
    value: unknown,
    key: string,
    root: unknown,
    add: VoidFunction | VoidFunction[] = []
  ) {
    const after = normalizeToArray(this.options.after).concat(add);

    if (after.length) {
      for (const func of after) {
        await func(value, key, root);
      }
    }
  }

  private async validateRules(root: IObject, rules: IValidationRule[]) {
    const tree = PTree.from(root);

    log(`Validating object...`);

    for (const rule of rules) {
      let value = tree.get(rule.key);
      log(`Validating key ${rule.key}...`);

      log(`Running before hook...`);
      await this.runBefore(value, rule.key, root, rule.before);

      log(`Checking if ${rule.key} is undefined...`);
      if (value === undefined && !rule.handler.isOptional()) {
        log(`${rule.key} is undefined & not optional: validation failed...`);
        log(`Running onFail hook...`);
        await this.options.onFail(value, rule.key, root);
        return false;
      }

      if (value === undefined && rule.handler.isOptional()) {
        log(`${rule.key} is undefined & optional.`);
        if (rule.handler.hasDefault()) {
          log(`Setting ${rule.key} to default value...`);
          tree.set(rule.key, rule.handler.getDefault(root));
          log(`Running onDefault hook...`);
          await this.options.onDefault(value, rule.key, root);
        }
        continue;
      }

      log(`${rule.key} is defined.`);

      const preTransforms = normalizeToArray(
        this.options.transformBefore
      ).concat(rule.transformBefore || []);

      if (preTransforms.length) {
        log(`${rule.key} pre-transform(s)...`);
        for (const transformer of preTransforms) {
          tree.set(rule.key, await transformer(value, rule.key, root));
        }
        value = tree.get(rule.key);
      }

      log(`Checking rules for ${rule.key}...`);
      const result = await rule.handler.check(value, rule.key, root);
      if (result !== true) {
        log(`Validation failed for ${rule.key}`);
        log(`Running onFail hook...`);
        await this.options.onFail(value, rule.key, root);
        return result;
      }

      const postTransforms = normalizeToArray(
        this.options.transformAfter
      ).concat(rule.transformAfter || []);

      if (postTransforms.length) {
        log(`${rule.key} post-transform(s)...`);
        for (const transformer of postTransforms) {
          tree.set(rule.key, await transformer(value, rule.key, root));
        }
        value = tree.get(rule.key);
      }

      await this.runAfter(value, rule.key, root, rule.after);
    }

    log(`Running onSuccess hook...`);
    await this.options.onSuccess(root);
    return true;
  }

  async validate(obj: IObject, rules: IValidationRule[]) {
    if (Array.isArray(rules)) {
      return this.validateRules(obj, rules);
    }
  }

  /**
   * Requires the property to be a string
   * @param err String or number that will be returned on fail
   */
  string(nullable?: boolean, err?: number | string) {
    return new FjordString(nullable, err);
  }

  /**
   * Requires the property to be a number
   * @param err String or number that will be returned on fail
   */
  number(err?: number | string) {
    return new FjordNumber(err);
  }

  /**
   * Requires the property to be an integer
   * @param err String or number that will be returned on fail
   */
  integer(err?: number | string) {
    return new FjordInteger(err);
  }

  /**
   * Requires the property to be an int. Alternative to integer
   * @param err String or number that will be returned on fail
   */
  int(err?: number | string) {
    return this.integer(err);
  }

  /**
   * Requires the property to be a float
   * @param err String or number that will be returned on fail
   */
  float(err?: number | string) {
    return new FjordFloat(err);
  }

  /**
   * Requires the property to be an array
   * @param err String or number that will be returned on fail
   */
  array(err?: number | string) {
    return new FjordArray(err);
  }

  /**
   * Requires the property to be an object
   * @param err String or number that will be returned on fail
   */
  object(err?: number | string) {
    return new FjordObject(err);
  }

  /**
   * Requires to property to be anything
   * @param err String or number that will be returned on fail
   */
  any(err?: number | string) {
    return new FjordAny(err);
  }

  /**
   * Requires the property to be a boolean
   * @param err String or number that will be returned on fail
   */
  boolean(err?: number | string) {
    return new FjordBoolean(err);
  }

  /**
   * Connect style middleware
   * https://github.com/senchalabs/connect
   * https://expressjs.com/
   * @param rules Array of rules that should be checked
   */
  connect(rules: IValidationRule[]) {
    return async (req: any, res: any, next: Function) => {
      try {
        const result = await this.validate(req, rules);

        if (result === true) {
          log(`Validation success, calling next middleware...`);
          return next();
        } else {
          log(`Validation fail: '${result}', calling error middleware...`);
          return next(result || 400);
        }
      } catch (error) {
        log(`Validation ERROR, calling error middleware with 500...`);
        console.error(error);
        next(500);
      }
    };
  }

  /**
   * Koa style middleware
   * https://koajs.com/
   * @param rules Array of rules that should be checked
   */
  koa(rules: IValidationRule[]) {
    return async (ctx: any, next: any) => {
      try {
        const result = await this.validate(ctx.req, rules);

        if (result === true) {
          log(`Validation success, calling next middleware...`);
          return next();
        } else {
          log(`Validation fail, calling error middleware...`);
          ctx.throw(400, result);
        }
      } catch (error) {
        log(`Validation ERROR, calling error middleware with 500...`);
        ctx.throw(500, error);
      }
    };
  }

  /**
   * Function to validate GraphQL arguments
   * https://graphql.org/
   * @param rules Array of rules that should be checked
   * @param cb Resolver function (executed after successful validation)
   */
  graphql(rules: IValidationRule[], cb: IGraphQLResolver) {
    return async (
      parent: unknown,
      args: IObject,
      ctx: unknown,
      info: unknown
    ) => {
      let result = false as boolean | number | string | undefined;

      try {
        result = await this.validate(args, rules);
      } catch (error) {
        log(`Validation ERROR, throwing 500...`);
        console.error(error);
        throw new Error("SERVER_ERROR");
      }

      if (result === true) {
        log(`Validation success, calling resolver...`);
        return cb(parent, args, ctx, info);
      } else {
        log(`Validation fail, throwing bad request...`);
        throw new Error("BAD_REQUEST");
      }
    };
  }
}
