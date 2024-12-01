import { selectUnit } from 'functions/components/NumberInput/type'

describe('unit', () => {
  test('selectUnit()', () => {
    expect(
      selectUnit(
        [
          ['Hz', 1],
          ['kHz', 1000],
        ],
        100,
      ),
    ).toStrictEqual(['Hz', 1])
    expect(
      selectUnit(
        [
          ['Hz', 1],
          ['kHz', 1000],
        ],
        -100,
      ),
    ).toStrictEqual(['Hz', 1])
    expect(
      selectUnit(
        [
          ['Hz', 1],
          ['kHz', 1000],
        ],
        999,
      ),
    ).toStrictEqual(['Hz', 1])
    expect(
      selectUnit(
        [
          ['Hz', 1],
          ['kHz', 1000],
        ],
        1000,
      ),
    ).toStrictEqual(['kHz', 1000])
    expect(
      selectUnit(
        [
          ['Hz', 1],
          ['kHz', 1000],
        ],
        1001,
      ),
    ).toStrictEqual(['kHz', 1000])
    expect(
      selectUnit(
        [
          ['Hz', 1],
          ['kHz', 1000],
        ],
        -1000,
      ),
    ).toStrictEqual(['kHz', 1000])
  })
})
