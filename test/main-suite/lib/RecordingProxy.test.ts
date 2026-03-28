import {
  createRecordingProxy,
  deepishEqual,
  wasCalledWith,
} from "./RecordingProxy";

describe("equality", () => {
  it("handles null", () => {
    expect(deepishEqual(null, null)).toEqual(true);
    expect(deepishEqual(null, "bar")).toEqual(false);
  });

  it("handles objects by type", () => {
    expect(deepishEqual("a", 6)).toEqual(false);
    expect(deepishEqual("a", "a")).toEqual(true);
  });

  it("uses JSON-ifying to figure out similar objects", () => {
    expect(deepishEqual({ a: "b", c: "d" }, { a: "b", c: "d" })).toEqual(true);
    expect(deepishEqual({ a: "b", c: "c" }, { a: "b", c: "d" })).toEqual(false);
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
    expect(result).toEqual(42);
    expect(wasCalledWith<Foo>(foo, "meth")).toEqual(true);
    expect(wasCalledWith<Foo>(foo, "od")).toEqual(true);

    const badCall = () => {
      // @ts-ignore -- "err" is not a key of Foo
      return wasCalledWith<Foo>(foo, "err");
    };
    expect(badCall).toThrow("Recorded object method `err` was not called");
  });
});
