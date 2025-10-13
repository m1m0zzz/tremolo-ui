import {
  parseValue,
  selectUnit,
  Units,
} from '../../src/components/NumberInput/type'

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

  test('parseValue()', () => {
    const hzUnits: Units = [
      ['Hz', 1],
      ['kHz', 1000],
    ]
    expect(parseValue('1234')).toStrictEqual({
      rawValue: 1234,
      formatValue: '1234',
      unit: '',
    })
    expect(parseValue('1.23', 'Hz')).toStrictEqual({
      rawValue: 1.23,
      formatValue: '1.23Hz',
      unit: 'Hz',
    })
    expect(parseValue('1.2', 'Hz', 0)).toStrictEqual({
      rawValue: 1.2,
      formatValue: '1Hz',
      unit: 'Hz',
    })
    expect(parseValue('1.23', 'Hz', 1)).toStrictEqual({
      rawValue: 1.23,
      formatValue: '1.2Hz',
      unit: 'Hz',
    })
    expect(parseValue('10', 'Hz', 2)).toStrictEqual({
      rawValue: 10,
      formatValue: '10.00Hz',
      unit: 'Hz',
    })
    expect(parseValue('10', hzUnits, 0)).toStrictEqual({
      rawValue: 10,
      formatValue: '10Hz',
      unit: 'Hz',
    })
    expect(parseValue('1234', hzUnits, 0)).toStrictEqual({
      rawValue: 1234,
      formatValue: '1kHz',
      unit: 'kHz',
    })
    expect(parseValue('1234', hzUnits, 1)).toStrictEqual({
      rawValue: 1234,
      formatValue: '1.2kHz',
      unit: 'kHz',
    })
    expect(parseValue('1234', hzUnits, 4)).toStrictEqual({
      rawValue: 1234,
      formatValue: '1.2340kHz',
      unit: 'kHz',
    })
    expect(parseValue('1234Hz', hzUnits, 4)).toStrictEqual({
      rawValue: 1234,
      formatValue: '1.2340kHz',
      unit: 'kHz',
    })
    expect(parseValue('1.23kHz', hzUnits, 1)).toStrictEqual({
      rawValue: 1230,
      formatValue: '1.2kHz',
      unit: 'kHz',
    })
    expect(parseValue('3.', 'Hz', 0)).toStrictEqual({
      rawValue: 3,
      formatValue: '3Hz',
      unit: 'Hz',
    })
    expect(parseValue('3.', 'Hz', 1)).toStrictEqual({
      rawValue: 3,
      formatValue: '3.0Hz',
      unit: 'Hz',
    })
    expect(parseValue('')).toStrictEqual({
      rawValue: 0,
      formatValue: '0',
      unit: '',
    })
    expect(parseValue('', hzUnits, 4)).toStrictEqual({
      rawValue: 0,
      formatValue: '0.0000Hz',
      unit: 'Hz',
    })
    expect(parseValue('aaaa')).toStrictEqual({
      rawValue: 0,
      formatValue: '0',
      unit: '',
    })
    expect(parseValue('4aaaa')).toStrictEqual({
      rawValue: 4,
      formatValue: '4',
      unit: '',
    })
    expect(parseValue('4aaaa', 'Hz')).toStrictEqual({
      rawValue: 4,
      formatValue: '4Hz',
      unit: 'Hz',
    })
  })
})
