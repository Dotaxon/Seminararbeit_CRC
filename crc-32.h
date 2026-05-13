#pragma once
/**
 * CRC-32 implementation supporting
 * INIT,
 * XOROUT,
 * REFIN and REFOUT.
 */
#include "utils.h"

uint32_t crc32(const uint8_t *data, size_t length,
               const crc_config_t *config) {
  uint32_t crc = config->init; // Initalize crc

  // Iterate over bytes of data
  while (length--) {
    uint8_t nextByte = config->refin ? reflect(*data++, 8) : *data++;
    crc ^= nextByte << 24; // XOR new byte into MSByte

    for (int i = 0; i < 8; i++) {        // Process each bit
      if (crc & (1 << 31)) {             // If MSBit is set
        crc = (crc << 1) ^ config->poly; // shift out MSBit and XOR
      } else {
        crc <<= 1; // Just shift out MSBit
      }
    }
  }
  
  uint32_t finalCrc = config->refout ? reflect(crc, 32)
                                     : crc; // Apply refout if necessary
  return finalCrc ^ config->xorout;         // Apply final XOROUT value
}