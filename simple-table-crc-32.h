#pragma once
/**
 * This program calculates a crc 32 of a message
 * Refin and Refout are ignored (false is used).
 * INIT is ignored (0 is used) 
 * XOROUT is used
 */

#include "utils.h"

uint32_t calculate_crc32_with_table(const uint8_t *data, size_t length,
                         const crc_config_t *config,
                         const uint32_t *table) {
  uint32_t crc = 0; // INIT is ignored, 0 is used
  while (length--) {
    uint8_t temp = (crc >> config->width - 8) & 0xFF; // get MSByte
    crc = (crc << 8) | *data++; // shift out MSByte and get next LSByte
    crc = crc ^ table[temp];    // do XOR on new data
  }

  // calculate for appending 0 byte
  for (int i = 0; i < config->width / 8; ++i) {
    uint8_t temp = (crc >> config->width - 8) & 0xFF; // get MSByte
    crc = (crc << 8);        // shift out MSByte and get 0 byte
    crc = crc ^ table[temp]; // do XOR
  }

  return crc ^ (uint32_t)config->xorout;
}
