#include <cs50.h>
#include <stdio.h>

int main(int argc, string argv[])// so can write in the comand line interface
{
    for (int i = 0; i < argc; i++)
    {
        printf("%s\n", argv[i]);
    }
}
