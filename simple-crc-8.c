/**
 * With this program you can calculate the CRC (degree 8 or smaller) of a
 * message
 *
 *  No initial init, No XOR on out, No Refin, No Refout
 */

#include "utils.h"
#include <stdint.h>
#include <stdio.h>
#include <string.h>

#define MAX_MESSAGE_LENGTH 8 * 10
#define MAX_POLY_LEN 2

#define POLY 0x1d // Polynomial with omitted MSBit
#define WIDTH 8   // degree of the poly (including MSBit)

uint8_t crc(uint8_t *buff, uint8_t poly, uint8_t degree, size_t msg_len);

int main() {
  // init buffer with space for message and crc
  uint8_t buff[MAX_MESSAGE_LENGTH + MAX_POLY_LEN] = {0};
  char text[MAX_MESSAGE_LENGTH] = "123456789";

  // fill buffer with message but to a max of MAX_MESSAGE_LENGTH to keep
  // the space for crc
  strncpy(buff, text, MAX_MESSAGE_LENGTH);

  // calculate crc
  uint8_t crc_result =
      crc(buff, POLY, WIDTH, strnlen(text, MAX_MESSAGE_LENGTH));
  printf("CRC: 0x%02x\n", crc_result);
}

/**
 * @param buff message buffer including appended zeros for crc
 * @param poly polynomial with omitted MSBit
 * @param width degree of the poly (including MSBit)
 * @param msg_len length of the message (without crc)
 * @return crc value
 */
uint8_t crc(uint8_t *buff, uint8_t poly, uint8_t width, size_t msg_len) {
  uint16_t polybuff = poly;
  polybuff <<= 8; // shift POLY into MSByte

  polybuff <<= (8 - width); // shift to the left so that omitted MSBit
                            // would be just outside the left side

  for (int i = 0; i < msg_len; ++i) { // iterate message
    // iterate byte left to right
    for (int k = 7; k >= 0; --k) // k is the bit index inside the byte
    {
      if (buff[i] & (1 << k)) // identify the highest bit that is 1
      {
        uint16_t *temp = &buff[i]; // x86/amd64 is little endian, but
                                   // an array of bytes is like big endian

        // polybuff is is little endian, temp is big endian (because it
        // is out of an array of bytes) to match endianess we swap
        // polybuff (we could also swap temp)
        *temp = *temp ^ swap_uint16(polybuff >> (8 - k));
      }
    }
  }

  return (buff[msg_len] & (0xff << (8 - width))) >> (8 - width);
}
