#pragma once

#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>

/**
 * Rocksoft^tm Model for CRC Algorithms see 'A Painless Guide to CRC
 * Error Detection Algorithms' by Ross Williams
 */
typedef struct {
  uint8_t width;
  uint64_t poly;
  uint64_t init;
  bool refin;
  bool refout;
  uint64_t xorout;
} crc_config_t;

/**
 * Swaps the byte order of a 16-bit unsigned integer.
 * Used to convert endianness
 */
uint16_t swap_uint16(uint16_t value) {
  return (value >> 8) | (value << 8);
}

/**
 * Prints a table of uint32_t values in hexadecimal format,
 * 4 values per line.
 */
void print_uint32_table(const uint32_t *table, size_t size) {
  for (size_t i = 0; i < size; i++) {
    printf("0x%08XL", table[i]);
    if ((i + 1) % 4 == 0)
      printf(",\n");
    else if (i + 1 < size)
      printf(", ");
  }
  if (size % 4 != 0)
    printf("\n");
}

/**
 * Reflects the lower b bits of v
 * Copied from 'A Painless Guide to CRC Error Detection Algorithms'
 */
uint64_t reflect(uint64_t v, uint8_t b) {
  uint64_t t = v;
  for (uint8_t i = 0; i < b; i++) {
    if (t & 1L)
      v |= 1 << ((b - 1) - i);
    else
      v &= ~(1 << (((b - 1) - i)));
    t >>= 1;
  }
  return v;
}
