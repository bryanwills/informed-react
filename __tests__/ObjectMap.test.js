/* eslint-disable no-sparse-arrays */
import { ObjectMap, ldtoPath } from '../src/ObjectMap';

describe('ObjectMap', () => {
  describe('get', () => {
    it('should get value from very nested object', () => {
      const expected = 2;
      const object = {
        foo: {
          bar: {
            baz: [
              {
                taz: {
                  bar: [
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    [
                      null,
                      null,
                      null,
                      {
                        bar: {
                          '0': {
                            '5': 2
                          }
                        }
                      }
                    ]
                  ]
                }
              },
              {}
            ]
          }
        }
      };
      const actual = ObjectMap.get(
        object,
        "foo['bar'].baz[0].taz.bar[10][3].bar['0'].5"
      );
      expect(actual).toEqual(expected);
    });

    it('should return undefined when get is called with field that does not exist', () => {
      const expected = undefined;
      const actual = ObjectMap.get({}, 'foo.bar');
      expect(actual).toEqual(expected);
    });
  });

  describe('set', () => {
    it('should set a value', () => {
      const expected = 3;
      const object = {};
      ObjectMap.set(object, 'foo', 3);
      const actual = ObjectMap.get(object, 'foo');
      expect(actual).toEqual(expected);
    });

    describe('object', () => {
      it('should set a nested value and initialize objects along the way', () => {
        const expected = { foo: { bar: { baz: 3 } } };
        const actual = {};
        ObjectMap.set(actual, 'foo.bar.baz', 3);
        expect(actual).toEqual(expected);
      });

      it('should set a nested value and initialize arrays along the way', () => {
        const expected = { foo: [, [, 3]] };
        const actual = {};
        ObjectMap.set(actual, 'foo[1][1]', 3);
        expect(actual).toEqual(expected);
      });

      it('should set a nested value and initialize objects along the way with array object syntax', () => {
        const expected = { foo: { bar: { baz: 3 } } };
        const actual = {};
        ObjectMap.set(actual, "foo['bar'].baz", 3);
        expect(actual).toEqual(expected);
      });

      it('should set a nested value and initialize arrays and objects along the way', () => {
        const expected = { foo: [, { bar: [, 3] }] };
        const actual = {};
        ObjectMap.set(actual, 'foo[1].bar[1]', 3);
        expect(actual).toEqual(expected);
      });

      it('should set a value in an array to undefined', () => {
        const expected = { foo: { bar: ['baz', 'taz', undefined] } };
        const actual = { foo: { bar: ['baz', 'taz', 'raz'] } };
        ObjectMap.set(actual, 'foo.bar[2]', undefined);
        expect(actual).toEqual(expected);
      });

      it('should set array value to undefined and then cleanup', () => {
        const expected = {};
        const actual = { foo: { bar: ['baz', 'taz'] } };
        ObjectMap.set(actual, 'foo.bar', undefined);
        expect(actual).toEqual(expected);
      });
    });

    describe('delete', () => {
      it('should delete value', () => {
        const actual = { foo: { bar: { baz: 3 } } };
        ObjectMap.delete(actual, 'foo.bar.baz');
        expect(actual).toEqual({});
      });

      it('should remove objects when they are empty after deleting last attribute', () => {
        const expected = {};
        const actual = { foo: { bar: { baz: 3 } } };
        ObjectMap.delete(actual, 'foo.bar.baz');
        expect(actual).toEqual(expected);
      });

      it('should NOT remove objects when they are NOT empty after deleting element', () => {
        const expected = { foo: { bar: { boo: 4 } } };
        const actual = { foo: { bar: { baz: 3, boo: 4 } } };
        ObjectMap.delete(actual, 'foo.bar.baz');
        expect(actual).toEqual(expected);
      });

      it('should remove array when they are empty after deleting', () => {
        const expected = {};
        const actual = { foo: [, [, 3]] };
        ObjectMap.delete(actual, 'foo[1][1]');
        expect(actual).toEqual(expected);
      });

      it('should NOT remove array when they are NOT empty after deleting', () => {
        const expected = { foo: [null, [null, 4]] };
        const actual = { foo: [null, [null, 3, 4]] };
        ObjectMap.delete(actual, 'foo[1][1]');
        expect(actual).toEqual(expected);
      });

      it('should remove arrays and objects when they are empty after deleting', () => {
        const expected = {};
        const actual = { foo: [, { bar: [, 3] }] };
        ObjectMap.delete(actual, 'foo[1].bar[1]');
        expect(actual).toEqual(expected);
      });

      it('should NOT remove arrays and objects when they are NOT empty after deleting', () => {
        const expected = { foo: [, { bar: [, 4] }] };
        const actual = { foo: [, { bar: [, 3, 4] }] };
        ObjectMap.delete(actual, 'foo[1].bar[1]');
        expect(actual).toEqual(expected);
      });

      it('should delete value from array', () => {
        const actual = { foo: { bar: { baz: [1, 2, 3] } } };
        ObjectMap.delete(actual, 'foo.bar.baz[1]');
        expect(actual).toEqual({
          foo: { bar: { baz: [1, 3] } }
        });
      });

      it('should remove array and objects when all values are deleted', () => {
        const actual = { foo: { bar: { baz: [1, 2, 3] } } };
        ObjectMap.delete(actual, 'foo.bar.baz[2]');
        ObjectMap.delete(actual, 'foo.bar.baz[1]');
        ObjectMap.delete(actual, 'foo.bar.baz[0]');
        expect(actual).toEqual({});
      });

      it('should shift values in array when deleting', () => {
        const actual = { foo: { bar: { baz: [1, 2, 3] } } };
        ObjectMap.delete(actual, 'foo.bar.baz[0]');
        expect(actual).toEqual({ foo: { bar: { baz: [2, 3] } } });
        ObjectMap.delete(actual, 'foo.bar.baz[0]');
        expect(actual).toEqual({ foo: { bar: { baz: [3] } } });
        ObjectMap.delete(actual, 'foo.bar.baz[0]');
        expect(actual).toEqual({});
      });
    });

    describe('pullOut', () => {
      it('should shift values in array when pulling out', () => {
        const actual = { foo: { bar: { baz: [1, 2, 3] } } };
        ObjectMap.pullOut(actual, 'foo.bar.baz[0]');
        expect(actual).toEqual({ foo: { bar: { baz: [2, 3] } } });
        ObjectMap.pullOut(actual, 'foo.bar.baz[0]');
        expect(actual).toEqual({ foo: { bar: { baz: [3] } } });
        ObjectMap.pullOut(actual, 'foo.bar.baz[0]');
        expect(actual).toEqual({});
      });
    });

    describe('insert', () => {
      it('should insert a value into an array at the specified index', () => {
        const actual = { foo: { bar: { baz: [1, 3] } } };
        ObjectMap.insert(actual, 'foo.bar.baz', 1, 2);
        expect(actual).toEqual({ foo: { bar: { baz: [1, 2, 3] } } });
      });

      it('should insert a value at the beginning of an array', () => {
        const actual = { foo: { bar: { baz: [2, 3] } } };
        ObjectMap.insert(actual, 'foo.bar.baz', 0, 1);
        expect(actual).toEqual({ foo: { bar: { baz: [1, 2, 3] } } });
      });

      it('should insert a value at the end of an array', () => {
        const actual = { foo: { bar: { baz: [1, 2] } } };
        ObjectMap.insert(actual, 'foo.bar.baz', 2, 3);
        expect(actual).toEqual({ foo: { bar: { baz: [1, 2, 3] } } });
      });

      it('should not modify the object if the path does not point to an array', () => {
        const actual = { foo: { bar: { baz: 42 } } };
        ObjectMap.insert(actual, 'foo.bar.baz', 0, 1);
        expect(actual).toEqual({ foo: { bar: { baz: 42 } } });
      });

      it('should handle inserting into an empty array', () => {
        const actual = { foo: { bar: { baz: [] } } };
        ObjectMap.insert(actual, 'foo.bar.baz', 0, 1);
        expect(actual).toEqual({ foo: { bar: { baz: [1] } } });
      });
    });

    describe('has', () => {
      it('should return true for values in an object', () => {
        const object = { foo: { bar: { baz: [1, 2, 3] } } };

        expect(ObjectMap.has(object, 'foo')).toEqual(true);
        expect(ObjectMap.has(object, 'foo.bar')).toEqual(true);
        expect(ObjectMap.has(object, 'foo.bar.baz')).toEqual(true);
        expect(ObjectMap.has(object, 'foo.bar.baz[0]')).toEqual(true);
      });

      it('should return false for values not in an object', () => {
        const object = { foo: {} };

        expect(ObjectMap.has(object, 'foo.bar')).toEqual(false);
      });
    });

    it('should set value in very nested obejct', () => {
      const expected = 3;
      const object = {
        foo: {
          bar: {
            baz: [
              {
                taz: {
                  bar: [
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    [
                      null,
                      null,
                      null,
                      {
                        bar: {
                          '0': {
                            '5': 2
                          }
                        }
                      }
                    ]
                  ]
                }
              },
              {}
            ]
          }
        }
      };
      ObjectMap.set(object, 'foo.bar.baz[0].taz.bar[10][3].bar.0.5', 3);
      const actual = ObjectMap.get(
        object,
        'foo.bar.baz[0].taz.bar[10][3].bar.0.5'
      );
      expect(actual).toEqual(expected);
    });

    describe('helper functions', () => {
      it('ldtoPath should create path array from foo.bar', () => {
        const actual = ldtoPath('foo.bar');
        expect(actual).toEqual(['foo', 'bar']);
      });

      it('ldtoPath should create path array from foo.bar[0].baz[1].taz', () => {
        const actual = ldtoPath('foo.bar[0].baz[1].taz');
        expect(actual).toEqual(['foo', 'bar', '0', 'baz', '1', 'taz']);
      });

      it("ldtoPath should create path array from foo['bar'].baz[0].taz.bar[10][3].bar['0'].5", () => {
        const actual = ldtoPath("foo['bar'].baz[0].taz.bar[10][3].bar['0'].5");
        expect(actual).toEqual([
          'foo',
          'bar',
          'baz',
          '0',
          'taz',
          'bar',
          '10',
          '3',
          'bar',
          '0',
          '5'
        ]);
      });
    });
  });
});
