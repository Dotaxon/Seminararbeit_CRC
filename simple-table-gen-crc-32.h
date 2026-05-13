#pragma once
/**
 * This program generates a CRC-32 lookup table based on the
 * specified polynomial.
 * Refin and Refout are ignored (false is used).
 */

#include "utils.h"
#include <stdint.h>
#include <stdio.h>

void calculate_table(uint32_t *table, crc_config_t config) {
  uint32_t crc = 0;
  for (int i = 0; i < 256; ++i) {  // iterate every possible byte value
    crc = i << (config.width - 8); // set value of i in MSByte
    for (int k = 0; k < 8; ++k) {  // iterate over each bit in MSByte
      if (crc & (1 << (config.width - 1))) { // check if MSBit is set
        // if set, shift out MSBit and XOR with polynomial
        crc = (crc << 1) ^ config.poly;
      } else {
        crc <<= 1; // if not set, just shift left
      }
    }
    table[i] = crc; // store result in table at index of the byte value
  }
}
