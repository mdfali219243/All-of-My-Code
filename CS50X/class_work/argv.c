
// this program is to understanf the command line argument.
#include <cs50.h>
#include <stdio.h>
// int means intager, so it means the number of array, argument user type in comand line
int main(int argc,string argv[])
{
    for (int i = 0; i < argc; i++)
    {
        printf("argv[%i] is the %s\n", i, argv[i]);
    }
}
