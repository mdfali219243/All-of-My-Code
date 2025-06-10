// --> we wolud count for string number/ length.
#include <cs50.h>
#include <stdio.h>
#include <string.h>


int main(void)
{
    string name = get_string("Name: "); // we ask user for the name
    int length = strlen(name);
    printf("%i\n", length);
}
