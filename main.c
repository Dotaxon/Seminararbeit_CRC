#include "utils.h"

//#define GEN_TABLE_CRC_32
#define SIMPLE_TABLE_CRC_32
// #define CRC_32
//#define DIRECT_TABLE_CRC_32

#ifdef GEN_TABLE_CRC_32
#include "simple-table-gen-crc-32.h"
#endif
#ifdef SIMPLE_TABLE_CRC_32
#include "simple-table-crc-32.h"
#include "simple-table-gen-crc-32.h"
#endif
#ifdef CRC_32
#include "crc-32.h"
#endif
#ifdef DIRECT_TABLE_CRC_32
#include "simple-table-gen-crc-32.h"
#include "direct-table-crc-32.h"
#endif

// CRC-32/AXIM
#if 0
#define POLY 0x814141abL
#define WIDTH 32
#define INIT 0
#define XOROUT 0
#define REFLECTIN false
#define REFLECTOUT false
// check=0x3010bf7f
#endif

// CRC-BZIP2
#if 1
#define POLY 0x04c11db7
#define WIDTH 32
#define INIT 0xffffffff
#define XOROUT 0xffffffff
#define REFLECTIN false
#define REFLECTOUT false
// check=0xfc891918
#endif

// CRC-32/CKSUM alias CRC-32/POSIX
#if 0
#define POLY 0x04c11db7
#define WIDTH 32
#define INIT 0
#define XOROUT 0xffffffff
#define REFLECTIN false
#define REFLECTOUT false
// check=0x765e7680
#endif

// CRC-32/AUTOSAR
#if 0
#define POLY 0xf4acfb13
#define WIDTH 32
#define INIT 0xffffffff
#define XOROUT 0xffffffff
#define REFLECTIN true
#define REFLECTOUT true
// check=0x1697d06a
#endif

// CRC-32 own creation based on AUTOSAR
#if 0
#define POLY 0xf4acfb13
#define WIDTH 32
#define INIT 0xffffffff
#define XOROUT 0xffffffff
#define REFLECTIN true
#define REFLECTOUT false
// check=0x560BE968
#endif

// CRC-32 own creation based on AUTOSAR
#if 0
#define POLY 0xf4acfb13
#define WIDTH 32
#define INIT 0xffffffff
#define XOROUT 0xffffffff
#define REFLECTIN false
#define REFLECTOUT true
// check=0x58623e9c
#endif


// CRC-32/CD-ROM-EDC
#if 0
#define POLY 0x8001801b
#define WIDTH 32
#define INIT 0
#define XOROUT 0
#define REFLECTIN true
#define REFLECTOUT true
// check=0x6ec2edc4
#endif

#ifdef SIMPLE_TABLE_CRC_32
int main() {
  crc_config_t cfg = {
      .poly = POLY,
      .width = WIDTH,
      .init = INIT, // todo implement, test
      .xorout = XOROUT,
      .refin = REFLECTIN,  // todo implement, test
      .refout = REFLECTOUT // todo implement, test
  };
  uint32_t table[256];
  calculate_table(table, cfg);
  print_uint32_table(table, 256);

  uint8_t *msg = "123456789";
  uint32_t crc =
      calculate_crc32_with_table((uint8_t *)msg, 9, &cfg, table);
  printf("CRC 32 of \"%s\" is 0x%08x\n", msg, crc);
}
#endif

#ifdef CRC_32
int main(){
  crc_config_t cfg = {
    .poly = POLY,
    .width = WIDTH,
    .init = INIT,
    .xorout = XOROUT,
    .refin = REFLECTIN,
    .refout = REFLECTOUT
  };

  uint8_t *msg = "123456789";
  uint32_t crc = crc32((uint8_t *)msg, 9, &cfg);
  printf("CRC 32 of \"%s\" is 0x%08x\n", msg, crc);
}
#endif

#ifdef GEN_TABLE_CRC_32
int main() {

  crc_config_t cfg = {
    .poly = POLY, 
    .width = WIDTH,
    .refin = REFLECTIN, //todo implement, test
    .refout = REFLECTOUT, //todo implement, test
    };
  uint32_t table[256];
  calculate_table(table, cfg);
  print_uint32_table(table, 256);
}
#endif

#ifdef DIRECT_TABLE_CRC_32
int main(){
  crc_config_t cfg ={
    .poly = POLY,
    .width = WIDTH,
    .init = INIT, 
    .xorout = XOROUT,
    .refin = REFLECTIN, //todo  test
    .refout = REFLECTOUT //todo test
  };
  uint32_t table[256];
  calculate_table(table, cfg);
  uint8_t *msg = "123456789";
  uint32_t crc = direct_table_crc32((uint8_t *)msg, 9, &cfg, table);
  printf("CRC 32 of \"%s\" is 0x%08x\n", msg, crc);
  return 0;
}
#endif
