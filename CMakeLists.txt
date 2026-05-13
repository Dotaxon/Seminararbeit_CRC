cmake_minimum_required(VERSION 3.15)
project(CRC C)

set(CMAKE_C_STANDARD 99)

if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Debug)
endif()

add_executable(simple-crc-8 simple-crc-8.c)

add_executable(main main.c)