import {
  createRecordingProxy,
  containsDeep,
  wasCalledWith,
} from "./RecordingProxy";

describe("containsDeep", () => {
  it("handles null and primitives", () => {
    expect(containsDeep(null, null)).toEqual(true);
    expect(containsDeep(null, "bar")).toEqual(false);
    expect(containsDeep("a", 6)).toEqual(false);
    expect(containsDeep("a", "a")).toEqual(true);
  });

  it("matches equal objects exactly", () => {
    expect(containsDeep({ a: "b", c: "d" }, { a: "b", c: "d" })).toEqual(true);
    expect(containsDeep({ a: "b", c: "c" }, { a: "b", c: "d" })).toEqual(false);
  });

  it("matches objects as subsets (extra keys in actual are ignored)", () => {
    // Typical Express case: res.locals merged into render options
    const actual = {
      value: 0,
      _locals: { reqId: "abc", allowedSessionObjectKeys: ["counter"] },
    };
    expect(containsDeep(actual, { value: 0 })).toEqual(true);

    // Deeper nesting
    const nested = { a: 1, b: { c: 2, d: 3 } };
    expect(containsDeep(nested, { b: { c: 2 } })).toEqual(true);
    expect(containsDeep(nested, { b: { c: 99 } })).toEqual(false);

    // Expected key missing from actual
    expect(containsDeep({ a: 1 }, { a: 1, b: 2 })).toEqual(false);
  });

  it("matches arrays exactly (not as subsets)", () => {
    expect(containsDeep([1, 2, 3], [1, 2, 3])).toEqual(true);
    expect(containsDeep([1, 2, 3], [1, 2])).toEqual(false);
    expect(containsDeep([1, 2, 3], [1, 2, 4])).toEqual(false);
  });

  it("handles nested structures", () => {
    const actual = {
      items: [{ id: 1 }, { id: 2, extra: true }],
      meta: { page: 1 },
    };
    // Array elements that are objects are still subset-matched
    expect(containsDeep(actual, { items: [{ id: 1 }, { id: 2 }] })).toEqual(
      true,
    );
    expect(containsDeep(actual, { meta: { page: 1 } })).toEqual(true);
  });
});

describe("RecordingProxy", () => {
  it("handles chaining", () => {
    class Foo {
      meth() {
        return this;
      }
      od() {
        return 42;
      }
    }

    const foo = createRecordingProxy(new Foo());
    const result = foo.meth().od();
    // ASSERT
    expect(result).toEqual(42);
    wasCalledWith(foo, "meth");
    wasCalledWith(foo, "od");

    expect(() => {
      // @ts-ignore -- "err" is not a key of Foo
      return wasCalledWith(foo, "err");
    }).toThrow("Recorded object method `err` was not called");
  });

  it("allows matching with fewer expected args than the call received", () => {
    class Bar {
      render(view: string, _locals: Record<string, unknown>) {
        return view;
      }
    }

    const bar = createRecordingProxy(new Bar());
    bar.render("counter", { value: 0, _locals: { reqId: "abc" } });

    // ASSERT — just check the template name, ignore locals
    wasCalledWith(bar, "render", "counter");

    // Check template name + subset of locals
    wasCalledWith(bar, "render", "counter", { value: 0 });

    // Full match still works
    wasCalledWith(bar, "render", "counter", {
      value: 0,
      _locals: { reqId: "abc" },
    });

    // Wrong value still fails
    expect(() => {
      return wasCalledWith(bar, "render", "counter", { value: 99 });
    }).toThrow();
  });
});
