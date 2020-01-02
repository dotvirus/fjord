import "mocha";
import { expect } from "chai";
import Fjord from "../src/index";
import { FjordArray } from "../src/handlers";

describe("Validate basic objects", () => {
  it("Should be a valid object", async () => {
    let calledAfter = 0;
    let calledBefore = 0;
    let calledSuccess = 0;
    let calledFail = 0;
    const fjord = new Fjord({
      before: async v => {
        calledBefore++;
      },
      after: async v => {
        calledAfter++;
      },
      onSuccess: async v => {
        calledSuccess++;
      },
      onFail: async v => {
        calledFail++;
      }
    });
    const obj = { a: 2, b: 3 };
    expect(
      await fjord.validate(obj, [
        {
          key: "a",
          handler: fjord
            .integer()
            .min(0)
            .max(5)
        },
        {
          key: "b",
          handler: fjord
            .integer()
            .min(0)
            .max(5)
        }
      ])
    ).to.be.true;
    expect(calledBefore).to.equal(2);
    expect(calledAfter).to.equal(2);
    expect(calledSuccess).to.equal(1);
    expect(calledFail).to.equal(0);
  });

  it("Should check even numbers", async () => {
    const fjord = new Fjord(/* opts */);

    // Example: Require all numbers to be even
    const val = await fjord.validate({ a: 2, b: 3 }, [
      {
        key: "a",
        handler: fjord.integer().custom(i => i % 2 == 0)
      },
      {
        key: "b",
        handler: fjord.integer().custom(i => i % 2 == 0)
      }
    ]);

    expect(val).to.be.false;
  });

  it("Should return correct error message", async () => {
    const fjord = new Fjord(/* opts */);

    {
      const obj = { a: "str" } as any;
      const val = await fjord.validate(obj, [
        {
          key: "a",
          handler: fjord.integer("Must be an integer")
        },
        {
          key: "c",
          handler: fjord
            .integer()
            .optional()
            .default(null)
        }
      ]);

      expect(val).to.equal("Must be an integer");
    }

    {
      const obj = { a: 4 } as any;
      const val = await fjord.validate(obj, [
        {
          key: "a",
          handler: fjord.integer("Must be an integer")
        },
        {
          key: "c",
          handler: fjord
            .integer()
            .optional()
            .default(null)
        }
      ]);

      expect(val).to.equal(true);
      expect(obj.c).to.equal(null);
    }

    {
      const val = await fjord.validate({ a: 250, c: 4 }, [
        {
          key: "a",
          handler: fjord.integer("Must be an integer")
        },
        {
          key: "c",
          handler: fjord
            .integer()
            .optional()
            .default(null)
            .max(2, "C is too large (max. 2)")
        }
      ]);

      expect(val).to.equal("C is too large (max. 2)");
    }
  });

  it("Should be an invalid object", async () => {
    let calledAfter = 0;
    let calledBefore = 0;
    let calledSuccess = 0;
    let calledFail = 0;
    const fjord = new Fjord({
      before: async v => {
        calledBefore++;
      },
      after: async v => {
        calledAfter++;
      },
      onSuccess: async v => {
        calledSuccess++;
      },
      onFail: async v => {
        calledFail++;
      }
    });
    const obj = { a: 2, b: 3 };
    expect(
      await fjord.validate(obj, [
        {
          key: "a",
          handler: fjord.float()
        },
        {
          key: "b",
          handler: fjord.integer()
        }
      ])
    ).to.equal(false);
    expect(calledBefore).to.equal(1);
    expect(calledAfter).to.equal(0);
    expect(calledSuccess).to.equal(0);
    expect(calledFail).to.equal(1);
  });

  it("Should be an invalid object", async () => {
    let calledAfter = 0;
    let calledBefore = 0;
    let calledSuccess = 0;
    let calledFail = 0;
    const fjord = new Fjord({
      before: async v => {
        calledBefore++;
      },
      after: async v => {
        calledAfter++;
      },
      onSuccess: async v => {
        calledSuccess++;
      },
      onFail: async v => {
        calledFail++;
      }
    });
    const obj = { a: 2, b: 3 };

    expect(
      await fjord.validate(obj, [
        {
          key: "a",
          handler: fjord.integer().min(5)
        },
        {
          key: "b",
          handler: fjord.integer()
        }
      ])
    ).to.equal(false);
    expect(calledBefore).to.equal(1);
    expect(calledAfter).to.equal(0);
    expect(calledSuccess).to.equal(0);
    expect(calledFail).to.equal(1);
  });

  it("Should be an invalid object", async () => {
    let calledAfter = 0;
    let calledBefore = 0;
    let calledSuccess = 0;
    let calledFail = 0;
    const fjord = new Fjord({
      before: async v => {
        calledBefore++;
      },
      after: async v => {
        calledAfter++;
      },
      onSuccess: async v => {
        calledSuccess++;
      },
      onFail: async v => {
        calledFail++;
      }
    });
    const obj = { a: 2, b: 3 };

    expect(
      await fjord.validate(obj, [
        {
          key: "a",
          handler: fjord.any().optional()
        },
        {
          key: "b",
          handler: fjord.float().optional()
        }
      ])
    ).to.equal(false);
    expect(calledBefore).to.equal(2);
    expect(calledAfter).to.equal(1);
    expect(calledSuccess).to.equal(0);
    expect(calledFail).to.equal(1);
  });

  it("Should be a valid object", async () => {
    let calledAfter = 0;
    let calledBefore = 0;
    let calledSuccess = 0;
    let calledFail = 0;
    const fjord = new Fjord({
      before: async v => {
        calledBefore++;
      },
      after: async v => {
        calledAfter++;
      },
      onSuccess: async v => {
        calledSuccess++;
      },
      onFail: async v => {
        calledFail++;
      }
    });
    const obj = { a: 2, b: 3 };

    expect(
      await fjord.validate(obj, [
        {
          key: "a",
          handler: fjord.integer()
        },
        {
          key: "b",
          handler: fjord.integer()
        },
        {
          key: "c",
          handler: fjord.any().optional()
        }
      ])
    ).to.equal(true);
    expect(calledBefore).to.equal(3);
    expect(calledAfter).to.equal(2);
    expect(calledSuccess).to.equal(1);
    expect(calledFail).to.equal(0);
  });

  it("Basic checks", async () => {
    const fjord = new Fjord();

    expect(
      await fjord.validate({ a: null, b: "test" }, [
        {
          key: "a",
          handler: fjord.string().nullable()
        },
        {
          key: "b",
          handler: fjord.string().nullable()
        }
      ])
    ).to.be.true;

    expect(
      await fjord.validate({ b: null }, [
        {
          key: "b",
          handler: fjord.string().nullable()
        },
        {
          key: "c",
          handler: fjord.string().nullable()
        }
      ])
    ).to.be.false;
  });

  it("Check array member types", async () => {
    const fjord = new Fjord();

    expect(
      await fjord.validate({ a: ["1", "string", "3"] }, [
        {
          key: "a",
          handler: (<FjordArray<string>>fjord.array()).of.strings()
        }
      ])
    ).to.equal(true);

    expect(
      await fjord.validate({ a: [1, 2, 3] }, [
        {
          key: "a",
          handler: (<FjordArray<number>>fjord.array()).of.integers()
        }
      ])
    ).to.equal(true);

    expect(
      await fjord.validate({ a: [1, "string", 3] }, [
        {
          key: "a",
          handler: (<FjordArray<number>>fjord.array()).of.integers()
        }
      ])
    ).to.equal(false);
  });

  it("Check array members 2", async () => {
    const fjord = new Fjord();

    expect(
      await fjord.validate({ a: [2, 5, 7] }, [
        {
          key: "a",
          handler: (<FjordArray<number>>fjord.array()).of
            .integers()
            .some(i => i > 10)
        }
      ])
    ).to.be.false;

    expect(
      await fjord.validate({ a: [2, 5, 20] }, [
        {
          key: "a",
          handler: (<FjordArray<number>>fjord.array()).of
            .integers()
            .some(i => i > 10)
        }
      ])
    ).to.be.true;

    expect(
      await fjord.validate({ a: [2, 5, 20] }, [
        {
          key: "a",
          handler: (<FjordArray<number>>fjord.array()).of
            .integers()
            .every(i => i > 10)
        }
      ])
    ).to.be.false;
  });
});

describe("Transforms", async () => {
  it("Should trim all strings", async () => {
    let calledAfter = 0;
    let calledBefore = 0;
    let calledSuccess = 0;
    let calledFail = 0;
    const fjord = new Fjord({
      transformBefore: async v => {
        if (typeof v == "string") return v.trim();
        return v;
      },
      before: async v => {
        calledBefore++;
      },
      after: async v => {
        calledAfter++;
      },
      onSuccess: async v => {
        calledSuccess++;
      },
      onFail: async v => {
        calledFail++;
      }
    });
    const obj = { a: "  string   ", b: 3, c: { d: { e: "  test ", f: true } } };

    expect(
      await fjord.validate(obj, [
        {
          key: "a",
          handler: fjord.any().custom(v => !v.includes(" ")),
          transformAfter: v => "cool " + v
        },
        {
          key: "b",
          handler: fjord.integer().custom(v => v < 10)
        },
        {
          key: "c.d.e",
          handler: fjord.any().custom(v => !v.includes(" "))
        },
        {
          key: "c.d.f",
          handler: fjord.boolean().true()
        }
      ])
    ).to.equal(true);
    expect(calledBefore).to.equal(4);
    expect(calledAfter).to.equal(4);
    expect(calledSuccess).to.equal(1);
    expect(calledFail).to.equal(0);

    expect(obj.a).to.equal("cool string");
    expect(obj.c.d.e).to.equal("test");
  });
});

describe("Middlewares", async () => {
  it("Should be valid connect middleware", async () => {
    const fjord = new Fjord();

    const middleware = fjord.connect([
      {
        key: "body.name",
        handler: fjord
          .string()
          .equals("Test Name", "String should equal 'Test Name'")
      }
    ]);

    let calledNext = 0;

    await middleware(
      {
        body: {
          name: "Test Name",
          age: 24
        }
      },
      null,
      (err?: any) => {
        expect(err).to.be.undefined;
        calledNext++;
      }
    );

    expect(calledNext).to.equal(1);

    await middleware(
      {
        body: {
          name: "Another name",
          age: 24
        }
      },
      null,
      (err?: any) => {
        expect(err).to.equal("String should equal 'Test Name'");
        calledNext++;
      }
    );

    expect(calledNext).to.equal(2);
  });

  it("Should be valid koa middleware", async () => {
    const fjord = new Fjord();

    const middleware = fjord.koa([
      {
        key: "body.name",
        handler: fjord
          .string()
          .equals("Test Name", "String should equal 'Test Name'")
      }
    ]);

    let calledNext = 0;

    let calledThrow = 0;

    await middleware(
      {
        req: {
          body: {
            name: "Test Name",
            age: 24
          }
        },
        throw: () => {
          calledThrow++;
        }
      },
      (err?: any) => {
        expect(err).to.be.undefined;
        calledNext++;
      }
    );

    expect(calledNext).to.equal(1);

    await middleware(
      {
        body: {
          name: "Another name",
          age: 24
        },
        throw: () => {
          calledThrow++;
        }
      },
      (err?: any) => {
        expect(err).to.equal("String should equal 'Test Name'");
        calledNext++;
      }
    );

    expect(calledNext).to.equal(1);
    expect(calledThrow).to.equal(1);
  });

  it("Simulate database calls", async () => {
    // Fake database
    const users = ["test@mail.de", "test2@mail.de"];

    // Simulate database
    const userExists = async (email: string) => {
      return await new Promise(resolve => {
        setTimeout(() => {
          const index = users.findIndex(e => e == email);
          resolve(index >= 0);
        }, 250);
      });
    };

    let calledNext = 0;
    const fjord = new Fjord();
    const middleware = fjord.connect([
      {
        key: "body.email",
        handler: fjord.string().custom(async v => {
          if (await userExists(v)) return "Email already signed up";
          return true;
        })
      },
      {
        key: "body.age",
        handler: fjord
          .integer()
          .optional()
          .min(18, "18+")
      }
    ]);

    await middleware(
      {
        body: {
          email: "doesntexist@mail.de"
        }
      },
      null,
      (err?: any) => {
        expect(err).to.be.undefined;
        calledNext++;
      }
    );

    await middleware(
      {
        body: {
          email: "test@mail.de"
        }
      },
      null,
      (err?: any) => {
        expect(err).to.equal("Email already signed up");
        calledNext++;
      }
    );

    await middleware(
      {
        body: {
          email: "asdasd@mail.de",
          age: 15
        }
      },
      null,
      (err?: any) => {
        expect(err).to.equal("18+");
        calledNext++;
      }
    );

    expect(calledNext).to.equal(3);
  });
});
