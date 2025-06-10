#include <cs50.h>
#include <stdio.h>

int main(int argc, string argv[])// for to write in the comand line
{
    if (argc != 2)
    {
        printf("Missing comand line argument\n");
        return 1;
    }
    else
    printf("%s\n", argv[1]);
    return 0;
}
