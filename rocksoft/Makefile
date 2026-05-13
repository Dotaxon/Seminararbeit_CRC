CC = gcc
CFLAGS = -std=c89

crctable: crctable.c crcmodel.c crcmodel.h
	$(CC) $(CFLAGS) -o crctable crctable.c crcmodel.c

clean:
	rm -f crctable crctable.out
