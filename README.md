## Archived! Continued here: [https://github.com/dotvirus/yxc](https://github.com/dotvirus/yxc)

[![npm version](https://badge.fury.io/js/%40dotvirus%2Ffjord.svg)](https://badge.fury.io/js/%40dotvirus%2Ffjord)
[![Actions Status](https://github.com/dotvirus/fjord/workflows/Test/badge.svg)](https://github.com/dotvirus/fjord/actions)

# fjord

# Install

```
npm i @dotvirus/fjord
```

```javascript
// Require
const fjord = require("@dotvirus/fjord");
```

```typescript
// Import
import Fjord from "@dotvirus/fjord";
```

# Basic usage

```javascript
const fjord = new Fjord();

fjord
  .validate({ a: 2, b: 3 }, [
    // a is mandatory and needs to be an integer
    {
      key: "a",
      handler: fjord.integer()
    },
    // b is mandatory and needs to be an integer
    {
      key: "b",
      handler: fjord.integer()
    }
  ])
  .then(val => {
    console.log(val); // -> true
  });

fjord
  .validate({ a: 2, b: 3 }, [
    // a is mandatory and needs to be an integer
    {
      key: "a",
      handler: fjord.integer()
    },
    // b is mandatory and needs to be an integer
    {
      key: "b",
      handler: fjord.integer()
    },
    // c is optional, but if it exists it needs to be an integer
    {
      key: "c",
      handler: fjord.integer().optional()
    },
    // d too is optional, but if it exists it needs to be an integer
    // if it does not exist, it will be set to null (but will pass, because defaults skip any rules)
    {
      key: "d",
      handler: fjord
        .integer()
        .optional()
        .default(null)
    }
  ])
  .then(val => {
    console.log(val); // -> true
  });
```

# Custom error messages

```javascript
const fjord = new Fjord();

fjord
  .validate({ a: "str" }, [
    {
      key: "a",
      handler: fjord.integer("a must be an integer")
    }
  ])
  .then(val => {
    console.log(val); // -> "a must be an integer"
  });
```

# Connect-style middleware

```javascript
const fjord = new Fjord();

app.get(
  "/",
  fjord.connect([
    // Root will be request object
    {
      key: "query.name",
      handler: fjord
        .string()
        .min(2)
        .max(50)
    }
  ]),
  (req, res) => {
    res.send("OK");
  }
);
```

# Koa-style middleware

```javascript
const fjord = new Fjord();

app.get(
  "/",
  fjord.koa([
    // Root will be context object
    {
      key: "req.query.name",
      handler: fjord
        .string()
        .min(2)
        .max(50)
    }
  ]),
  ctx => {
    res.send("OK");
  }
);
```

# Transform input

```javascript
const fjord = new Fjord({
  transformBefore: async v => {
    if (typeof v == "string") return v.trim();
    return v;
  }
});

const obj = { name: " not trimmed string    " };

fjord
  .validate(obj, [
    {
      key: "name",
      handler: fjord.string()
    }
  ])
  .then(val => {
    console.log(val); // -> true
    console.log(obj.name); // -> "not trimmed string"
  });
```

# Custom functions

```javascript
const fjord = new Fjord();

// Example: Require all numbers to be even
fjord
  .validate({ a: 2, b: 3 }, [
    {
      key: "a",
      handler: fjord.integer().custom(async i => i % 2 == 0)
    },
    {
      key: "b",
      handler: fjord.integer().custom(async i => i % 2 == 0)
    }
  ])
  .then(val => {
    console.log(val); // -> false
  });
```
