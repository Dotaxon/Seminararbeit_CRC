#pragma once
/**
 * CRC-32 implementation using a precomputed table for faster computation.
 * Supports:
 * INIT,
 * XOROUT
 * 
 * NOT SUPPORTED:
 * REFIN,
 * REFOUT
 */
#include "utils.h"

uint32_t direct_table_crc32(const uint8_t *data, size_t length,
                            const crc_config_t *config, 
                            const uint32_t *crc32_table ) {
  uint32_t crc = config->init; // Initalize crc

  while (length--) {
    // XOR new byte into MSByte to get index for table
    uint8_t index = (crc >> (config->width - 8)) ^ *data++;
    // Shift out MSByte and XOR  with table value
    crc = (crc << 8) ^ crc32_table[index]; 
  }

  return crc ^ config->xorout; //Apply final XOROUT value
}