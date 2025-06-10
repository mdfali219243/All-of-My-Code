#include <cs50.h>
#include <ctype.h>
#include <stdio.h>
#include <string.h>

int main(void)
{
    string s = get_string("Before: "); // we are asking the user for string of character
    printf("After:  ");
    for (int i = 0, n = strlen(s); i < n; i++)
    {
            printf("%c", toupper(s[i]));
            // it would give us uppercase latter
    }
    printf("\n");
}
