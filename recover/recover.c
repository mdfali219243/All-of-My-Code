#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[])
{
    // first we need  to have 1 single line argument
    if (argc != 2)
    {
        printf("Usage: ./recover FILE\n");
        return 1;
    }

    // open the file
    FILE *card = fopen(argv[1], "r");

    uint8_t buffer[512];
    int count = 0;
    char filename[8];
    FILE *img = NULL;
    // we have make a loop that would repreat untill  it  read the whole file
    while (fread(buffer, 512, 1, card))
    {

        if (buffer[0] == 0xff && buffer[1] == 0xd8 && buffer[2] == 0xff &&
            (buffer[3] & 0xf0) == 0xe0)
        {
            if (img != NULL)
            {
                fclose(img);
            }
            sprintf(filename, "%03i.jpg", count++);
            img = fopen(filename, "w");
        }
        if (img != NULL)
        {
            fwrite(buffer, 512, 1, img);
        }
    }
    if (img != NULL)
    {
        fclose(img);
    }
    fclose(card);
}
