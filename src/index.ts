import ptree from "@dotvirus/ptree";
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

function normalizeToArray<T>(val: T | T[]) {
  if (Array.isArray(val)) return val;
  return [val];
}

export type TransformFunction = (
  val: any,
  key: string,
  root: unknown
) => Promise<unknown>;

export type VoidFunction = (
  value: unknown,
  key: string,
  root: unknown
) => Promise<void>;

export interface IFjordOptions {
  before: VoidFunction;
  transformBefore: TransformFunction | TransformFunction[];
  transformAfter: TransformFunction | TransformFunction[];
  after: VoidFunction;
  onSuccess: (root: unknown) => Promise<void>;
  onFail: VoidFunction;
}

interface IValidationRule {
  key: string;
  before?: VoidFunction;
  transformBefore?: TransformFunction | TransformFunction[];
  transformAfter?: TransformFunction | TransformFunction[];
  after?: VoidFunction;
  handler: FjordHandler;
}

export default class FjordInstance {
  options: IFjordOptions;

  constructor(opts?: Partial<IFjordOptions>) {
    this.options = {
      before: async () => {},
      transformBefore: async v => v,
      transformAfter: async v => v,
      after: async () => {},
      onSuccess: async () => {},
      onFail: async () => {}
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
    const tree = ptree.from(root);

    for (const rule of rules) {
      let value = tree.get(rule.key);

      await this.runBefore(value, rule.key, root, rule.before);

      if (value === undefined && !rule.handler.isOptional()) {
        await this.options.onFail(value, rule.key, root);
        return false;
      }

      if (value === undefined && rule.handler.isOptional()) {
        if (rule.handler.hasDefault()) {
          tree.set(rule.key, rule.handler.getDefault(root));
        }
        continue;
      }

      const preTransforms = normalizeToArray(
        this.options.transformBefore
      ).concat(rule.transformBefore || []);

      if (preTransforms.length) {
        for (const transformer of preTransforms) {
          tree.set(rule.key, await transformer(value, rule.key, root));
        }
        value = tree.get(rule.key);
      }

      const result = await rule.handler.check(value, rule.key, root);
      if (result !== true) {
        await this.options.onFail(value, rule.key, root);
        return result;
      }

      const postTransforms = normalizeToArray(
        this.options.transformAfter
      ).concat(rule.transformAfter || []);

      if (postTransforms.length) {
        for (const transformer of postTransforms) {
          tree.set(rule.key, await transformer(value, rule.key, root));
        }
        value = tree.get(rule.key);
      }

      await this.runAfter(value, rule.key, root, rule.after);
    }

    await this.options.onSuccess(root);
    return true;
  }

  async validate(obj: IObject, rules: IValidationRule[]) {
    if (Array.isArray(rules)) {
      return this.validateRules(obj, rules);
    }
  }

  string(err?: number | string) {
    return new FjordString(err);
  }

  number(err?: number | string) {
    return new FjordNumber(err);
  }

  integer(err?: number | string) {
    return new FjordInteger(err);
  }

  int(err?: number | string) {
    return this.integer(err);
  }

  float(err?: number | string) {
    return new FjordFloat(err);
  }

  array(err?: number | string) {
    return new FjordArray(err);
  }

  object(err?: number | string) {
    return new FjordObject(err);
  }

  any(err?: number | string) {
    return new FjordAny(err);
  }

  boolean(err?: number | string) {
    return new FjordBoolean(err);
  }

  connect(rules: IValidationRule[]) {
    return async (req: any, res: any, next: Function) => {
      try {
        const result = await this.validate(req, rules);

        if (result === true) {
          return next();
        } else {
          next(result);
        }
      } catch (error) {
        console.error(error);
        next(500);
      }
    };
  }

  koa(rules: IValidationRule[]) {
    return async (ctx: any, next: any) => {
      try {
        const result = await this.validate(ctx.req, rules);

        if (result === true) {
          return next();
        } else {
          ctx.throw(400, result);
        }
      } catch (error) {
        ctx.throw(500, error);
      }
    };
  }
}
